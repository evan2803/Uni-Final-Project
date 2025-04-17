import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

const HeatmapLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !data.length) return;

    const points = data
      .filter(p => p.lat && p.lng && p.count)
      .map(p => [p.lat, p.lng, Math.min(p.count / 10, 1.5)]);

    console.log("🔥 Adding heatmap. Points sample:", points.slice(0, 10));

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.5,
      gradient: {
        0.2: 'blue',
        0.4: 'lime',
        0.6: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, data]);

  return null;
};

export default HeatmapLayer;