
import React, { useState } from 'react';
import FileUpload from './FileUpload';

interface SpatialAnalysisInputFormProps {
  onSubmit: (cityName: string, analysisTopic: string, file: File) => void;
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
  const [analysisTopic, setAnalysisTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cityName.trim() && analysisTopic.trim() && files.length > 0) {
      onSubmit(cityName, analysisTopic, files[0]);
    }
  };

  return (
    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-700/80 rounded-3xl shadow-2xl p-6 md:p-8 max-w-5xl mx-auto">
      {!userEmail ? (
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Sign in to Tanmyaa</h2>
          <p className="text-gray-400 mb-10 max-w-md mx-auto text-lg">
            Connect your account to access professional spatial intelligence tools.
          </p>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center space-x-3 mx-auto text-lg"
          >
            <span>Continue with Google</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <label htmlFor="cityName" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">City Name</label>
                <input
                  id="cityName"
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g., Riyadh, Saudi Arabia"
                  className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 text-lg"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Upload Map (Mandatory)</label>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-4">
                  <p className="text-[11px] text-blue-300 leading-relaxed">
                    Upload a high-resolution map or satellite image of the target area. This map will be used as the primary spatial reference for the analysis.
                  </p>
                </div>
                <FileUpload 
                  files={files} 
                  setFiles={setFiles} 
                  disabled={isLoading} 
                />
                {files.length === 0 && (
                  <p className="text-[11px] text-red-400 mt-2 px-1 font-medium">
                    * Map upload is required to proceed with spatial analysis.
                  </p>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-2">
                <label htmlFor="analysisTopic" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Analysis Topic</label>
                <textarea
                  id="analysisTopic"
                  value={analysisTopic}
                  onChange={(e) => setAnalysisTopic(e.target.value)}
                  placeholder="What would you like to analyze? (e.g., Urban growth patterns, service coverage, vegetation density)"
                  rows={8}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 text-lg resize-none"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-sm font-medium text-gray-300">{credits} credits</span>
              </div>
              <span className="text-sm text-gray-500">Cost: 10 credits</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !cityName.trim() || !analysisTopic.trim() || files.length === 0 || credits < 10}
              className="bg-gray-700/80 text-gray-200 font-semibold py-3 px-8 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 w-full md:w-auto text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : 'Generate Spatial Analysis'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SpatialAnalysisInputForm;
