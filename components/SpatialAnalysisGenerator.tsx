
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateSpatialAnalysis, SpatialAnalysisResult } from '../services/geminiService';
import SpatialAnalysisInputForm from './SpatialAnalysisInputForm';
import { motion } from 'motion/react';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';

interface GeneratorProps {
  onUpgrade: () => void;
}

const SpatialAnalysisGenerator: React.FC<GeneratorProps> = ({ onUpgrade }) => {
  const { user, profile, loading, refreshProfile, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpatialAnalysisResult | null>(null);
  const [projectInfo, setProjectInfo] = useState({ cityName: '', analysisTopic: '' });

  const handleGenerate = async (cityName: string, scale: string, analysisTopic: string, file?: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProjectInfo({ cityName, analysisTopic });

    try {
      const analysisResult = await generateSpatialAnalysis({ cityName, scale, analysisTopic }, file);
      setResult(analysisResult);
      await refreshProfile();
    } catch (err: unknown) {
      console.error('Spatial Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during spatial analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 20;

    const addTitle = (title: string) => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPos);
      yPos += 10;
    };

    const addText = (text: string) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 6 + 5;
    };

    const addBulletPoints = (points: string[]) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      points.forEach(point => {
        const lines = doc.splitTextToSize(`• ${point}`, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 6 + 2;
      });
      yPos += 5;
    };

    const checkPageBreak = (neededHeight: number) => {
      if (yPos + neededHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // PAGE 1 - COVER
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`Spatial Analysis`, pageWidth / 2, 60, { align: 'center' });
    doc.setFontSize(18);
    doc.text(`${projectInfo.cityName}: ${projectInfo.analysisTopic}`, pageWidth / 2, 75, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 90, { align: 'center' });
    doc.text(`© TANNMYAA ${new Date().getFullYear()}`, pageWidth / 2, 100, { align: 'center' });

    // Try to add image to cover if possible
    try {
      const isPng = result.imageUrl.includes('image/png');
      const format = isPng ? 'PNG' : 'JPEG';
      doc.addImage(result.imageUrl, format, margin, 120, contentWidth, (contentWidth * 9) / 16);
    } catch (e) {
      console.error("Could not add image to PDF", e);
    }

    // PAGE 2 - KEY INSIGHTS
    doc.addPage();
    yPos = margin;
    addTitle('KEY INSIGHTS');
    addBulletPoints(result.report.keyInsights);

    // PAGE 3 - SPATIAL ANALYSIS
    doc.addPage();
    yPos = margin;
    addTitle('SPATIAL ANALYSIS');
    addText(result.report.spatialAnalysis);

    // PAGE 4 - RECOMMENDATIONS
    doc.addPage();
    yPos = margin;
    addTitle('RECOMMENDATIONS');
    
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Short-term Actions', margin, yPos);
    yPos += 8;
    addBulletPoints(result.report.shortTermActions);

    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Long-term Strategies', margin, yPos);
    yPos += 8;
    addBulletPoints(result.report.longTermStrategies);

    // PAGE 5 - METHODOLOGY
    doc.addPage();
    yPos = margin;
    addTitle('METHODOLOGY');
    
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Approach', margin, yPos);
    yPos += 8;
    addText(result.report.methodology.approach);

    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Data Sources', margin, yPos);
    yPos += 8;
    addBulletPoints(result.report.methodology.dataSources);

    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tools Used', margin, yPos);
    yPos += 8;
    addBulletPoints(result.report.methodology.toolsUsed);

    doc.save(`Spatial_Analysis_Report_${projectInfo.cityName.replace(/\s+/g, '_')}.pdf`);
  };

  const renderInputForm = () => (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <SpatialAnalysisInputForm 
        onSubmit={handleGenerate}
        isLoading={isLoading}
        credits={profile?.credits || 0}
        userEmail={user?.email || null}
        onLogin={signInWithGoogle}
      />
    </motion.div>
  );

  const renderResult = (res: SpatialAnalysisResult) => (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 animate-fade-in"
    >
      <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h2 className="text-lg font-bold text-white">Analytical Visual Map</h2>
          <div className="flex space-x-2">
            <button 
              onClick={generatePDF}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition duration-200"
            >
              Download PDF Report
            </button>
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = res.imageUrl;
                link.download = `spatial-analysis-${Date.now()}.png`;
                link.click();
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition duration-200"
            >
              Download HD Map
            </button>
            <button 
              onClick={() => setResult(null)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full transition duration-200"
            >
              New Analysis
            </button>
          </div>
        </div>
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <img 
            src={res.imageUrl} 
            alt="Spatial Analysis Result" 
            className="max-w-full max-h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-widest text-[10px]">Methodology</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Synthesized from Google Earth, Landsat, and official geospatial databases using multilingual academic research.
          </p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-widest text-[10px]">Accuracy</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Grounded in real geography and validated published sources. Side panels provide concise strategic insights.
          </p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-widest text-[10px]">Output</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            High-end cartographic quality (ArcGIS Pro style) with mandatory elements like North arrow and legend.
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <GeneratorShell
      title="Spatial Analysis"
      description="Professional analytical urban maps grounded in real-world data and academic research."
      isLoading={isLoading || loading}
      error={error}
      result={result}
      renderInputForm={renderInputForm}
      renderResult={renderResult}
      userEmail={user?.email || null}
      onLogin={signInWithGoogle}
      onUpgrade={onUpgrade}
    />
  );
};

export default SpatialAnalysisGenerator;

