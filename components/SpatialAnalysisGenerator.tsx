
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateSpatialAnalysis } from '../services/geminiService';
import SpatialAnalysisInputForm from './SpatialAnalysisInputForm';
import { motion } from 'motion/react';
import GeneratorShell from './GeneratorShell';

interface GeneratorProps {
  onUpgrade: () => void;
}

const SpatialAnalysisGenerator: React.FC<GeneratorProps> = ({ onUpgrade }) => {
  const { user, profile, loading, refreshProfile, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async (cityName: string, scale: string, analysisTopic: string, file?: File) => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const result = await generateSpatialAnalysis({ cityName, scale, analysisTopic }, file);
      setImageUrl(result);
      await refreshProfile();
    } catch (err: unknown) {
      console.error('Spatial Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during spatial analysis.');
    } finally {
      setIsLoading(false);
    }
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

  const renderResult = (url: { url: string }) => (
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
              onClick={() => {
                const link = document.createElement('a');
                link.href = url.url;
                link.download = `spatial-analysis-${Date.now()}.png`;
                link.click();
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition duration-200"
            >
              Download HD Map
            </button>
            <button 
              onClick={() => setImageUrl(null)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full transition duration-200"
            >
              New Analysis
            </button>
          </div>
        </div>
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <img 
            src={url.url} 
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
      result={imageUrl ? { url: imageUrl } : null}
      renderInputForm={renderInputForm}
      renderResult={renderResult}
      userEmail={user?.email || null}
      onLogin={signInWithGoogle}
      onUpgrade={onUpgrade}
    />
  );
};

export default SpatialAnalysisGenerator;

