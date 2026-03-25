
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import MapSelector from './MapSelector';

interface SpatialAnalysisInputFormProps {
  onSubmit: (cityName: string, scale: string, analysisTopic: string, file?: File) => void;
  isLoading: boolean;
  credits: number;
  userEmail: string | null;
  onLogin: () => void;
}

const SpatialAnalysisInputForm: React.FC<SpatialAnalysisInputFormProps> = ({ 
  onSubmit, 
  isLoading, 
  credits, 
  userEmail, 
  onLogin 
}) => {
  const [cityName, setCityName] = useState('');
  const [scale, setScale] = useState('');
  const [analysisTopic, setAnalysisTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityName.trim() && scale.trim() && analysisTopic.trim()) {
      onSubmit(cityName, scale, analysisTopic, files[0]);
    }
  };

  return (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8">
      {!userEmail ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            To prevent misuse and track your generation credits, please sign in with your Gmail account.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-2 mx-auto"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="cityName" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City Name</label>
                <input
                  id="cityName"
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g., Riyadh, Cairo, London"
                  className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Study Area (Detect on Map)</label>
                <MapSelector onBoundsChange={setScale} cityName={cityName} disabled={isLoading} />
              </div>
              <div>
                <label htmlFor="analysisTopic" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Analysis Topic</label>
                <textarea
                  id="analysisTopic"
                  value={analysisTopic}
                  onChange={(e) => setAnalysisTopic(e.target.value)}
                  placeholder="Describe the topic for spatial analysis (e.g., Urban Sprawl, Service Accessibility, Green Space Distribution)"
                  rows={4}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 resize-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload Reference Map (Optional)</label>
              <FileUpload 
                files={files} 
                setFiles={setFiles} 
                disabled={isLoading} 
              />
              <p className="text-xs text-gray-500 mt-2 italic">
                The AI will use the attached map as the primary visual and spatial reference for the analysis.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              {credits} credits remaining. <span className="text-blue-400/80 ml-2">Cost: 10 credits</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !cityName.trim() || !scale.trim() || !analysisTopic.trim() || credits < 10}
              className="bg-blue-600/20 text-blue-400 font-semibold py-3 px-8 rounded-full hover:bg-blue-600/30 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-blue-500/30"
            >
              {isLoading ? 'Analyzing...' : 'Generate Spatial Analysis'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SpatialAnalysisInputForm;
