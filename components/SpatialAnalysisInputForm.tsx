
import React, { useState, useRef } from 'react';
import FileUpload from './FileUpload';
import MapSelector from './MapSelector';
import html2canvas from 'html2canvas';
import { LatLngBounds } from 'leaflet';

interface SpatialAnalysisInputFormProps {
  onSubmit: (cityName: string, analysisTopic: string, file: File, bounds?: LatLngBounds) => void;
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
  const [useMapCapture, setUseMapCapture] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawBounds, setRawBounds] = useState<LatLngBounds | undefined>(undefined);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityName.trim() || !analysisTopic.trim()) {
      console.warn("City name or analysis topic is missing.");
      return;
    }

    if (useMapCapture) {
      if (!rawBounds) {
        console.warn("No map area selected.");
        return;
      }
      if (!mapContainerRef.current) {
        console.warn("Map container ref is missing.");
        return;
      }
      
      setIsCapturing(true);
      try {
        console.log("Starting map capture with html2canvas...");
        const canvas = await html2canvas(mapContainerRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: true, // Enable logging for debugging
          scale: 2, // Higher quality
        });
        
        console.log("Canvas captured, converting to blob...");
        canvas.toBlob((blob) => {
          if (blob) {
            console.log("Blob created successfully, size:", blob.size);
            const file = new File([blob], "map_capture.png", { type: "image/png" });
            onSubmit(cityName, analysisTopic, file, rawBounds);
          } else {
            console.error("Failed to create blob from canvas.");
            setError("Failed to capture map image. Please try again.");
          }
          setIsCapturing(false);
        }, 'image/png');
      } catch (err) {
        console.error("Capture error:", err);
        setError("An error occurred while capturing the map. Please try again.");
        setIsCapturing(false);
      }
    } else {
      if (files.length > 0) {
        onSubmit(cityName, analysisTopic, files[0]);
      } else {
        console.warn("No file uploaded.");
      }
    }
  };

  const handleBoundsChange = (_: string, boundsObj?: LatLngBounds) => {
    if (boundsObj) {
      setRawBounds(boundsObj);
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

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Reference Map (Google Earth Style)</label>
                  <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                    <button 
                      type="button"
                      onClick={() => setUseMapCapture(false)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!useMapCapture ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      UPLOAD
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUseMapCapture(true)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${useMapCapture ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      CAPTURE
                    </button>
                  </div>
                </div>

                {useMapCapture ? (
                  <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                      <p className="text-[11px] text-blue-300 leading-relaxed">
                        Use the interactive satellite map below to select your study area. This provides the AI with precise &quot;Google Earth&quot; coordination for accurate results.
                      </p>
                    </div>
                    <div ref={mapContainerRef} className="relative rounded-xl overflow-hidden border border-gray-800 shadow-inner">
                      <MapSelector 
                        cityName={cityName} 
                        onBoundsChange={() => {}} 
                        onRawBoundsChange={(str, obj) => {
                          if (obj) {
                            handleBoundsChange(str, obj);
                          }
                        }}
                        disabled={isLoading || isCapturing}
                      />
                    </div>
                    {!rawBounds && (
                      <p className="text-[11px] text-orange-400 px-1">
                        * Please select an area on the map to proceed.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                      <p className="text-[11px] text-blue-300 leading-relaxed">
                        Upload a high-resolution Google Earth screenshot or map. This will be used as the primary spatial reference for coordination and orientation.
                      </p>
                    </div>
                    <FileUpload 
                      files={files} 
                      setFiles={setFiles} 
                      disabled={isLoading} 
                    />
                    {files.length === 0 && (
                      <p className="text-[11px] text-red-400 px-1 font-medium">
                        * Map upload is required to proceed.
                      </p>
                    )}
                  </div>
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-sm font-medium text-gray-300">{credits} credits</span>
              </div>
              <span className="text-sm text-gray-500">Cost: 10 credits</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || isCapturing || !cityName.trim() || !analysisTopic.trim() || (useMapCapture ? !rawBounds : files.length === 0) || credits < 10}
              className="bg-gray-700/80 text-gray-200 font-semibold py-3 px-8 rounded-full hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 border border-gray-600/50 w-full md:w-auto text-lg"
            >
              {isLoading || isCapturing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isCapturing ? 'Capturing Map...' : 'Analyzing...'}</span>
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
