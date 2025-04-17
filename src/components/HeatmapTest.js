import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import L from 'leaflet';

// Hardcoded heatmap data: [lat, lng, intensity]
const testPoints = [
  [51.4545, -2.5879, 0.5], // Central Bristol
  [51.455, -2.589, 0.8],
  [51.456, -2.586, 1.2],
  [51.457, -2.590, 1.5],
  [51.458, -2.585, 1.0],
];

const HeatLayer = () => {
  const map = useMap();
  useEffect(() => {
    const heat = L.heatLayer(testPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.5
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map]);

  return null;
};

const HeatmapTest = () => {
  return (
    <MapContainer center={[51.4545, -2.5879]} zoom={14} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatLayer />
    </MapContainer>
  );
};

export default HeatmapTest;