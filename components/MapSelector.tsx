import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngBounds, LatLng } from 'leaflet';
import { Maximize, Minimize, MousePointer2, Square } from 'lucide-react';

interface MapSelectorProps {
  onBoundsChange: (bounds: string) => void;
  cityName?: string;
  disabled?: boolean;
}

const MapController = ({ cityName, isFullscreen }: { cityName?: string, isFullscreen: boolean }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size when fullscreen toggles to fix tile loading
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [isFullscreen, map]);

  useEffect(() => {
    if (!cityName || cityName.trim().length < 3) return;

    const geocode = async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          map.flyTo([parseFloat(lat), parseFloat(lon)], 12);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    };

    const timeoutId = setTimeout(geocode, 1000); // Debounce 1s
    return () => clearTimeout(timeoutId);
  }, [cityName, map]);

  return null;
};

const DrawControl = ({ onBoundsSelected, isDrawing, setIsDrawing }: { onBoundsSelected: (b: LatLngBounds) => void, isDrawing: boolean, setIsDrawing: (v: boolean) => void }) => {
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [currentPoint, setCurrentPoint] = useState<LatLng | null>(null);
  const map = useMap();

  useMapEvents({
    mousedown: (e) => {
      if (!isDrawing) return;
      map.dragging.disable();
      setStartPoint(e.latlng);
      setCurrentPoint(e.latlng);
    },
    mousemove: (e) => {
      if (!isDrawing || !startPoint) return;
      setCurrentPoint(e.latlng);
    },
    mouseup: (e) => {
      if (!isDrawing || !startPoint) return;
      map.dragging.enable();
      const newBounds = new LatLngBounds(startPoint, e.latlng);
      // Only set if it's a valid area (not just a click)
      if (startPoint.lat !== e.latlng.lat && startPoint.lng !== e.latlng.lng) {
        onBoundsSelected(newBounds);
      }
      setStartPoint(null);
      setCurrentPoint(null);
      setIsDrawing(false);
    }
  });

  if (startPoint && currentPoint) {
    return <Rectangle bounds={new LatLngBounds(startPoint, currentPoint)} pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.2, dashArray: '5, 5' }} />;
  }
  return null;
};

const MapSelector: React.FC<MapSelectorProps> = ({ onBoundsChange, cityName, disabled }) => {
  const [selectedBounds, setSelectedBounds] = useState<LatLngBounds | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (selectedBounds) {
      const ne = selectedBounds.getNorthEast();
      const sw = selectedBounds.getSouthWest();
      onBoundsChange(`Selected Area - North: ${ne.lat.toFixed(4)}, South: ${sw.lat.toFixed(4)}, East: ${ne.lng.toFixed(4)}, West: ${sw.lng.toFixed(4)}`);
    } else {
      onBoundsChange('');
    }
  }, [selectedBounds, onBoundsChange]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFullscreen(!isFullscreen);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedBounds(null);
    setIsDrawing(false);
  };

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/80 z-[9998] backdrop-blur-sm" onClick={() => setIsFullscreen(false)} />
      )}
      <div className={`${isFullscreen ? 'fixed inset-4 md:inset-10 z-[9999] bg-gray-900 p-4 rounded-2xl shadow-2xl flex flex-col' : 'h-80 w-full relative'} rounded-xl overflow-hidden border border-gray-700 transition-all duration-300 ${disabled && !isFullscreen ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Toolbar */}
        <div className={`absolute top-4 right-4 z-[400] flex flex-col gap-2 ${isFullscreen ? 'top-8 right-8' : ''}`}>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="bg-white text-gray-800 p-2 rounded shadow hover:bg-gray-100 transition-colors"
          title={isFullscreen ? "Minimize" : "Maximize"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        
        <div className="bg-white rounded shadow flex flex-col overflow-hidden mt-2">
          <button
            type="button"
            onClick={() => setIsDrawing(false)}
            className={`p-2 transition-colors ${!isDrawing ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Pan/Navigate"
          >
            <MousePointer2 size={20} />
          </button>
          <button
            type="button"
            onClick={() => setIsDrawing(true)}
            className={`p-2 transition-colors border-t border-gray-200 ${isDrawing ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Draw Selection Area"
          >
            <Square size={20} />
          </button>
        </div>

        {selectedBounds && (
          <button
            type="button"
            onClick={clearSelection}
            className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-colors mt-2 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      <div className={`flex-1 rounded-lg overflow-hidden ${isFullscreen ? 'h-full' : 'h-full'}`}>
        <MapContainer 
          center={[24.7136, 46.6753]} 
          zoom={11} 
          style={{ height: '100%', width: '100%', zIndex: 0, cursor: isDrawing ? 'crosshair' : 'grab' }}
          zoomControl={false}
        >
          {/* Using a lighter, more obvious map theme for better visibility */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController cityName={cityName} isFullscreen={isFullscreen} />
          <DrawControl onBoundsSelected={setSelectedBounds} isDrawing={isDrawing} setIsDrawing={setIsDrawing} />
          
          {selectedBounds && (
            <Rectangle 
              bounds={selectedBounds} 
              pathOptions={{ color: '#2563eb', weight: 3, fillOpacity: 0.1 }} 
            />
          )}
        </MapContainer>
      </div>

      {!selectedBounds && !isDrawing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-black/70 backdrop-blur text-xs text-white px-4 py-2 rounded-full pointer-events-none text-center border border-gray-700 shadow-lg">
          Click the square icon to draw your study area
        </div>
      )}
      {isDrawing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-blue-600/90 backdrop-blur text-xs text-white px-4 py-2 rounded-full pointer-events-none text-center shadow-lg shadow-blue-500/30 animate-pulse">
          Click and drag on the map to select the area
        </div>
      )}
      {selectedBounds && !isDrawing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-green-600/90 backdrop-blur text-xs text-white px-4 py-2 rounded-full pointer-events-none text-center shadow-lg">
          Area selected successfully
        </div>
      )}
      </div>
    </>
  );
};

export default MapSelector;
