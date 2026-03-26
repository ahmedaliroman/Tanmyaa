
import React, { useState, useRef } from 'react';
import FileUpload from './FileUpload';
import MapSelector from './MapSelector';
import html2canvas from 'html2canvas';

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
  const [isCapturing, setIsCapturing] = useState(false);
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

      onSubmit(cityName, scale, analysisTopic, submitFile);
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
                  disabled={isLoading || isCapturing}
                  required
                />
              </div>
              <div ref={mapContainerRef}>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Study Area (Detect on Map)</label>
                <MapSelector onBoundsChange={setScale} cityName={cityName} disabled={isLoading || isCapturing} />
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
                  disabled={isLoading || isCapturing}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload Reference Map (Optional)</label>
              <FileUpload 
                files={files} 
                setFiles={setFiles} 
                disabled={isLoading || isCapturing} 
              />
              <p className="text-xs text-gray-500 mt-2 italic">
                If no map is uploaded, the system will automatically capture your selected area from the map above.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              {credits} credits remaining. <span className="text-blue-400/80 ml-2">Cost: 10 credits</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || isCapturing || !cityName.trim() || !scale.trim() || !analysisTopic.trim() || credits < 10}
              className="bg-blue-600/20 text-blue-400 font-semibold py-3 px-8 rounded-full hover:bg-blue-600/30 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-blue-500/30"
            >
              {isLoading || isCapturing ? 'Analyzing...' : 'Generate Spatial Analysis'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SpatialAnalysisInputForm;
