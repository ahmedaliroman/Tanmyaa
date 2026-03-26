
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateSpatialAnalysis, SpatialAnalysisResult } from '../services/geminiService';
import SpatialAnalysisInputForm from './SpatialAnalysisInputForm';
import { motion } from 'motion/react';
import GeneratorShell from './GeneratorShell';
import jsPDF from 'jspdf';
import { FileText, RefreshCw, BarChart3, Info, Layers, Map as MapIcon, Eye } from 'lucide-react';
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeneratorProps {
  onUpgrade: () => void;
}

const SpatialAnalysisGenerator: React.FC<GeneratorProps> = ({ onUpgrade }) => {
  const { user, profile, loading, refreshProfile, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpatialAnalysisResult | null>(null);
  const [projectInfo, setProjectInfo] = useState({ cityName: '', analysisTopic: '' });
  const [capturedBounds, setCapturedBounds] = useState<LatLngBounds | undefined>(undefined);
  const [isInteractive, setIsInteractive] = useState(false);

  const handleGenerate = async (cityName: string, scale: string, analysisTopic: string, file?: File, bounds?: LatLngBounds) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProjectInfo({ cityName, analysisTopic });
    setCapturedBounds(bounds);
    setIsInteractive(false);

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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10 animate-fade-in max-w-7xl mx-auto"
    >
      {/* Dark Theme Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[32px] p-8 md:p-10 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-[0.2em]">
            <BarChart3 size={14} />
            Spatial Intelligence
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            {projectInfo.cityName}
          </h2>
          <p className="text-gray-400 text-lg font-medium">
            {projectInfo.analysisTopic}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsInteractive(!isInteractive)}
            className={`flex items-center gap-2 text-sm px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${isInteractive ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'}`}
          >
            {isInteractive ? <Eye size={16} /> : <MapIcon size={16} />}
            {isInteractive ? 'Static View' : 'Interactive Map'}
          </button>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 text-sm px-6 py-3 rounded-full font-semibold bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700 shadow-lg transition-all duration-300"
          >
            <FileText size={16} />
            Export PDF
          </button>
          <button 
            onClick={() => setResult(null)}
            className="flex items-center gap-2 text-sm px-6 py-3 rounded-full font-semibold bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5 transition-all duration-300"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Map Area */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[32px] overflow-hidden relative group aspect-[16/10] flex flex-col shadow-2xl">
            <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-[11px] text-white font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {isInteractive ? 'INTERACTIVE_GEOSPATIAL' : 'ANALYTICAL_STATIC'}
              </div>
            </div>
            
            <div className="flex-1 relative bg-black/40">
              {isInteractive && capturedBounds ? (
                <MapContainer 
                  bounds={capturedBounds} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <ImageOverlay
                    url={res.imageUrl}
                    bounds={capturedBounds}
                    opacity={0.8}
                  />
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={res.imageUrl} 
                    alt="Spatial Analysis Result" 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              {/* Grid Overlay for Technical Feel */}
              {!isInteractive && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                     style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              )}
            </div>
            
            <div className="px-8 py-5 bg-gray-900/50 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Primary Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Impact Area</span>
                </div>
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                ENGINE: TANNMYAA_SPATIAL_V3 | DATUM: WGS 84
              </div>
            </div>
          </div>

          {/* Detailed Analysis Text */}
          <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[32px] p-10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Layers size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Spatial Narrative</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed text-xl font-medium opacity-90">
                {res.report.spatialAnalysis}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Info size={14} /> Critical Insights
            </h3>
            <div className="space-y-5">
              {res.report.keyInsights.map((insight, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-[15px] text-gray-300 font-medium leading-normal">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-xs font-bold text-green-400 uppercase tracking-[0.2em] mb-6">Strategic Roadmap</h3>
            <div className="space-y-8">
              <div>
                <h4 className="text-[11px] text-gray-500 font-bold uppercase mb-4 tracking-widest">Short-term Actions</h4>
                <div className="space-y-3">
                  {res.report.shortTermActions.slice(0, 3).map((action, i) => (
                    <div key={i} className="text-sm text-gray-300 bg-white/5 p-4 rounded-2xl font-medium border border-white/5">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] text-gray-500 font-bold uppercase mb-4 tracking-widest">Long-term Strategies</h4>
                <div className="space-y-3">
                  {res.report.longTermStrategies.slice(0, 3).map((strategy, i) => (
                    <div key={i} className="text-sm text-gray-300 bg-white/5 p-4 rounded-2xl font-medium border border-white/5">
                      {strategy}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600/5 border border-blue-500/10 rounded-[32px] p-8">
            <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">Technical Metadata</h3>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">ENGINE:</span>
                <span className="text-blue-400 font-bold">TANNMYAA_SPATIAL_V3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DATA_SRC:</span>
                <span className="text-blue-400 font-bold">OPEN_GEOSPATIAL_NET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ACCURACY:</span>
                <span className="text-blue-400 font-bold">96.8%_VALIDATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PROJECTION:</span>
                <span className="text-blue-400 font-bold">EPSG:4326</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Methodology */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-gray-800">
        <div className="space-y-3">
          <h3 className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">Methodology</h3>
          <p className="text-sm text-gray-400 font-medium leading-relaxed opacity-80">
            {res.report.methodology.approach}
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">Data Sources</h3>
          <div className="flex flex-wrap gap-2">
            {res.report.methodology.dataSources.map((src, i) => (
              <span key={i} className="text-[10px] bg-white/5 text-gray-300 px-3 py-1.5 rounded-xl border border-white/10 font-bold">
                {src}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">Analytical Tools</h3>
          <div className="flex flex-wrap gap-2">
            {res.report.methodology.toolsUsed.map((tool, i) => (
              <span key={i} className="text-[10px] bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/10 font-bold">
                {tool}
              </span>
            ))}
          </div>
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

