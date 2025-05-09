import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  useMap
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import './CrimeMap.css';
import HeatmapLayer from './HeatmapLayer';
import { useNavigate } from 'react-router-dom';

// Fix leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ✅ Add scale bar using useMap
const ScaleControl = () => {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({ imperial: false }).addTo(map);
    return () => map.removeControl(scale);
  }, [map]);

  return null;
};

const CrimeMap = () => {
  const [crimeSummary, setCrimeSummary] = useState([]);
  const [startDate, setStartDate] = useState('2023-12');
  const [endDate, setEndDate] = useState('2023-12');
  const [viewMode, setViewMode] = useState('bubble');
  const [selectedCategory, setSelectedCategory] = useState(['all']);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [showSidebar, setShowSidebar] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDataForRange = async () => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];
      while (start <= end) {
        const year = start.getFullYear();
        const month = (start.getMonth() + 1).toString().padStart(2, '0');
        dates.push(`${year}-${month}`);
        start.setMonth(start.getMonth() + 1);
      }

      const allData = await Promise.all(
        dates.map(date =>
          fetch(`http://localhost:8000/api/crimes/summary?date=${date}`)
            .then(res => res.json())
            .catch(err => {
              console.error("API error for", date, err);
              return [];
            })
        )
      );

      setCrimeSummary(allData.flat());
    };

    fetchDataForRange();
  }, [startDate, endDate]);

  const allDistricts = [
    ...new Set(
      crimeSummary.map(c => c.postcode?.split(' ')[0]).filter(Boolean)
    )
  ].sort();

  const filteredCrimes = crimeSummary.filter(crime => {
    const matchCategory =
      selectedCategory.includes("all") ||
      selectedCategory.length === 0 ||
      selectedCategory.includes(crime.category);
    const district = crime.postcode?.split(' ')[0];
    const matchDistrict =
      selectedDistrict === 'all' || district === selectedDistrict;
    return matchCategory && matchDistrict;
  });

  const estimateTimeSeconds = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthCount = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return monthCount > 0 ? monthCount : 0;
  };

  return (
    <div className="map-layout">
      {showSidebar && (
        <div className="sidebar">
          <button onClick={() => setShowSidebar(false)}>← Hide Filters</button>

          <label>📅 Start Date:
            <input
              type="month"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </label>

          <label>📅 End Date:
            <input
              type="month"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </label>

          <p>⏳ Estimated load time: {estimateTimeSeconds()}s</p>

          <label>🗺️ View Mode:
            <select value={viewMode} onChange={e => setViewMode(e.target.value)}>
              <option value="bubble">🟣 Bubble Markers</option>
              <option value="cluster">🧩 Clustered Markers</option>
              <option value="heatmap">🔥 Heatmap</option>
            </select>
          </label>

          <label>🕵️ Crime Type (CTRL to Select Multiple):
            <select
              multiple
              value={selectedCategory}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                setSelectedCategory(options);
              }}
              className="multi-select"
            >
              <option value="all">All</option>
              {[...new Set(crimeSummary.map(c => c.category))].map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <label>🏷️ Postcode District:
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

          <button onClick={() => navigate('/analytics')}>
            📊 Show Analytics
          </button>
        </div>
      )}

      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          style={{ position: 'absolute', left: 10, top: 10, zIndex: 1000 }}
        >
          → Show Filters
        </button>
      )}

      <div className="map-container">
        <MapContainer center={[51.4545, -2.5879]} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ScaleControl />

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
                <Marker key={i} position={[crime.lat, crime.lng]}>
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

        {/* 📌 Legend */}
        <div className="map-legend">
          <h4>🗺️ Legend</h4>
          <ul>
            <li><span className="legend-marker small"></span> 1–5 crimes</li>
            <li><span className="legend-marker medium"></span> 6–20 crimes</li>
            <li><span className="legend-marker large"></span> 21+ crimes</li>
            <li><span className="legend-cluster">🧩</span> Cluster</li>
            <li><span className="legend-heat">🔥</span> Heatmap density</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CrimeMap;