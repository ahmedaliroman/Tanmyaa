
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
    <div className="ios-card p-6 md:p-10 max-w-5xl mx-auto">
      {!userEmail ? (
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-[#1C1C1E] mb-3 tracking-tight">Sign in to Tanmyaa</h2>
          <p className="text-[#8E8E93] mb-10 max-w-md mx-auto text-lg">
            Connect your account to access professional spatial intelligence tools.
          </p>
          <button
            onClick={onLogin}
            className="ios-button bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-xl shadow-blue-500/20 flex items-center space-x-3 mx-auto text-lg"
          >
            <span>Continue with Google</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <label htmlFor="cityName" className="block text-sm font-semibold text-[#8E8E93] px-1">City Name</label>
                <input
                  id="cityName"
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g., Riyadh, Saudi Arabia"
                  className="w-full ios-input text-lg"
                  disabled={isLoading || isCapturing}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#8E8E93] px-1">Study Area Selection</label>
                <div ref={mapContainerRef}>
                  <MapSelector onBoundsChange={handleBoundsChange} cityName={cityName} disabled={isLoading || isCapturing} />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-2">
                <label htmlFor="analysisTopic" className="block text-sm font-semibold text-[#8E8E93] px-1">Analysis Objective</label>
                <textarea
                  id="analysisTopic"
                  value={analysisTopic}
                  onChange={(e) => setAnalysisTopic(e.target.value)}
                  placeholder="What would you like to analyze? (e.g., Urban growth patterns, service coverage, vegetation density)"
                  rows={5}
                  className="w-full ios-input text-lg resize-none"
                  disabled={isLoading || isCapturing}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#8E8E93] px-1">Reference Data (Optional)</label>
                <FileUpload 
                  files={files} 
                  setFiles={setFiles} 
                  disabled={isLoading || isCapturing} 
                />
                <p className="text-[11px] text-[#8E8E93] mt-3 leading-relaxed px-1">
                  Tanmyaa will automatically synthesize satellite data for your selected area if no reference is provided.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-black/[0.05]">
            <div className="flex items-center gap-4">
              <div className="bg-black/[0.03] px-4 py-2 rounded-2xl">
                <span className="text-sm font-medium text-[#1C1C1E]">{credits} credits</span>
              </div>
              <span className="text-sm text-[#8E8E93]">Cost: 10 credits</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || isCapturing || !cityName.trim() || !scale.trim() || !analysisTopic.trim() || credits < 10}
              className="ios-button bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-xl shadow-blue-500/20 w-full md:w-auto text-lg"
            >
              {isLoading || isCapturing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Analysis...</span>
                </div>
              ) : 'Generate Intelligence Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SpatialAnalysisInputForm;
