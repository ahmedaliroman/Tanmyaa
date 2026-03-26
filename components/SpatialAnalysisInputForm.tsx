
import React, { useState, useRef } from 'react';
import FileUpload from './FileUpload';
import MapSelector from './MapSelector';
import html2canvas from 'html2canvas';

import { LatLngBounds } from 'leaflet';

interface SpatialAnalysisInputFormProps {
  onSubmit: (cityName: string, scale: string, analysisTopic: string, file?: File, bounds?: LatLngBounds) => void;
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [rawBounds, setRawBounds] = useState<LatLngBounds | undefined>(undefined);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cityName.trim() && scale.trim() && analysisTopic.trim()) {
      let submitFile = files[0];
      
      // If no file is uploaded, try to capture the map
      if (!submitFile && mapContainerRef.current) {
        setIsCapturing(true);
        try {
          // Find the leaflet container inside our ref
          const leafletContainer = mapContainerRef.current.querySelector('.leaflet-container') as HTMLElement;
          if (leafletContainer) {
            // Give a small delay for the map to settle if needed, 
            // but here we just capture what's visible.
            const canvas = await html2canvas(leafletContainer, {
              useCORS: true,
              backgroundColor: null,
              logging: false,
              allowTaint: true,
              scale: 2, // Higher quality
            });
            
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            if (blob) {
              submitFile = new File([blob], 'map-selection.jpg', { type: 'image/jpeg' });
            }
          }
        } catch (error) {
          console.error("Failed to capture map:", error);
        } finally {
          setIsCapturing(false);
        }
      }

      onSubmit(cityName, scale, analysisTopic, submitFile, rawBounds);
    }
  };

  const handleBoundsChange = (boundsStr: string, boundsObj?: LatLngBounds) => {
    setScale(boundsStr);
    setRawBounds(boundsObj);
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
                  disabled={isLoading || isCapturing}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Scale or Area Required</label>
                <div ref={mapContainerRef} className="rounded-xl overflow-hidden border border-gray-800">
                  <MapSelector onBoundsChange={handleBoundsChange} cityName={cityName} disabled={isLoading || isCapturing} />
                </div>
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
                  rows={5}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200 text-lg resize-none"
                  disabled={isLoading || isCapturing}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Additional (Optional)</label>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-4">
                  <p className="text-[11px] text-blue-300 leading-relaxed">
                    Upload one map of the target city. Use the attached map as the primary visual and spatial reference, then internally conduct extensive, multilingual scientific research on the city based on the selected Analysis Topic, relying on reliable published sources. After that, generate one final image only.
                  </p>
                </div>
                <FileUpload 
                  files={files} 
                  setFiles={setFiles} 
                  disabled={isLoading || isCapturing} 
                />
                <p className="text-[11px] text-gray-500 mt-3 leading-relaxed px-1">
                  Tanmyaa will automatically synthesize satellite data for your selected area if no reference is provided.
                </p>
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
              disabled={isLoading || isCapturing || !cityName.trim() || !scale.trim() || !analysisTopic.trim() || credits < 10}
              className="bg-gray-700/80 text-gray-200 font-semibold py-3 px-8 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 w-full md:w-auto text-lg"
            >
              {isLoading || isCapturing ? (
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
