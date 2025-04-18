import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import './AnalyticsPanel.css';

Chart.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AnalyticsPanel = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/crimes/summary?date=2023-12');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Crime trends over time
  const trends = (() => {
    const summary = {};
    data.forEach(crime => {
      const key = crime.month || 'Unknown';
      summary[key] = (summary[key] || 0) + crime.count;
    });
    return {
      labels: Object.keys(summary),
      datasets: [{
        label: 'total',
        data: Object.values(summary),
        borderColor: 'blue',
        fill: false,
        tension: 0.2
      }]
    };
  })();

  // Crime categories
  const categories = (() => {
    const counts = {};
    data.forEach(crime => {
      const cat = crime.category || 'Unknown';
      counts[cat] = (counts[cat] || 0) + crime.count;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(([cat]) => cat),
      datasets: [{
        label: 'Crimes',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }]
    };
  })();

  // Top districts
  const districts = (() => {
    const districtCounts = {};
    data.forEach(crime => {
      const district = crime.postcode?.split(' ')[0] || 'Unknown';
      districtCounts[district] = (districtCounts[district] || 0) + crime.count;
    });
    const top10 = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      labels: top10.map(([district]) => district),
      datasets: [{
        label: 'Top Districts',
        data: top10.map(([, count]) => count),
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      }]
    };
  })();

  return (
    <div className="analytics-panel">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Map
      </button>

      <h3>📈 Crime Trends Over Time</h3>
      <Line data={trends} />

      <h3>📊 Top Crime Categories</h3>
      <Bar data={categories} />

      <h3>📍 Top 10 Crime Districts</h3>
      <Bar data={districts} />
    </div>
  );
};

export default AnalyticsPanel;