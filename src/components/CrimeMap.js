import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import './CrimeMap.css';
import HeatmapLayer from './HeatmapLayer';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CrimeMap = () => {
  const [crimeSummary, setCrimeSummary] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2023-12');
  const [viewMode, setViewMode] = useState('bubble');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  useEffect(() => {
    fetch(`http://localhost:8000/api/crimes/summary?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        console.log("📦 crimeSummary from API:", data);
        setCrimeSummary(data);
      })
      .catch(err => console.error("API error:", err));
  }, [selectedDate]);

  // Extract unique postcode districts (e.g. BS1, BS2)
  const allDistricts = [
    ...new Set(
      crimeSummary
        .map(c => c.postcode?.split(' ')[0])
        .filter(Boolean)
    )
  ].sort();

  const filteredCrimes = crimeSummary.filter(crime => {
    const matchCategory =
      selectedCategory === 'all' || crime.category === selectedCategory;
    const district = crime.postcode?.split(' ')[0];
    const matchDistrict =
      selectedDistrict === 'all' || district === selectedDistrict;
    return matchCategory && matchDistrict;
  });

  return (
    <>
      <div className="controls">
        <label>
          📅 Date:
          <input
            type="month"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </label>

        <label>
          🗺️ View Mode:
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="bubble">🟣 Bubble Markers</option>
            <option value="cluster">🧩 Clustered Markers</option>
            <option value="heatmap">🔥 Heatmap</option>
          </select>
        </label>

        <label>
          🕵️ Crime Type:
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All</option>
            {[...new Set(crimeSummary.map(c => c.category))].map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          🏷️ Postcode District:
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="all">All</option>
            {allDistricts.map((d, idx) => (
              <option key={idx} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <MapContainer
        center={[51.4545, -2.5879]}
        zoom={13}
        style={{ height: "90vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {viewMode === 'bubble' && filteredCrimes.map((crime, i) => (
          <CircleMarker
            key={i}
            center={[crime.lat, crime.lng]}
            radius={Math.sqrt(crime.count) * 2}
            fillOpacity={0.5}
            color="purple"
          >
            <Popup>
              <b>{crime.category}</b><br />
              {crime.count} reports<br />
              <small>{crime.postcode}</small>
            </Popup>
          </CircleMarker>
        ))}

        {viewMode === 'cluster' && (
          <MarkerClusterGroup>
            {filteredCrimes.map((crime, i) => (
              <Marker
                key={i}
                position={[crime.lat, crime.lng]}
              >
                <Popup>
                  <b>{crime.category}</b><br />
                  {crime.count} reports<br />
                  <small>{crime.postcode}</small>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {viewMode === 'heatmap' && (
          <HeatmapLayer data={filteredCrimes} />
        )}
      </MapContainer>
    </>
  );
};

export default CrimeMap;