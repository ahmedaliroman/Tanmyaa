import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { LatLngBounds } from 'leaflet';

interface MapSelectorProps {
  onBoundsChange: (bounds: string) => void;
  cityName?: string;
  disabled?: boolean;
}

const MapEvents = ({ setBounds }: { setBounds: (b: LatLngBounds) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());
    },
    zoomend: () => {
      setBounds(map.getBounds());
    }
  });
  
  useEffect(() => {
    setBounds(map.getBounds());
  }, [map, setBounds]);

  return null;
};

const MapController = ({ cityName }: { cityName?: string }) => {
  const map = useMap();

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

const MapSelector: React.FC<MapSelectorProps> = ({ onBoundsChange, cityName, disabled }) => {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);

  useEffect(() => {
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChange(`Bounding Box - North: ${ne.lat.toFixed(4)}, South: ${sw.lat.toFixed(4)}, East: ${ne.lng.toFixed(4)}, West: ${sw.lng.toFixed(4)}`);
    }
  }, [bounds, onBoundsChange]);

  return (
    <div className={`h-64 w-full rounded-xl overflow-hidden border border-gray-800 relative z-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <MapContainer 
        center={[24.7136, 46.6753]} 
        zoom={11} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapEvents setBounds={setBounds} />
        <MapController cityName={cityName} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 right-2 z-[400] bg-black/80 backdrop-blur text-xs text-blue-400 p-2 rounded pointer-events-none text-center border border-gray-800 font-medium">
        Pan and zoom to select the study area
      </div>
    </div>
  );
};

export default MapSelector;
