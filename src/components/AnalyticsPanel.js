import React, { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import './AnalyticsPanel.css';

Chart.register(
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const AnalyticsPanel = () => {
  const [data, setData] = useState([]);
  const [longTermData, setLongTermData] = useState([]);
  const [startDate, setStartDate] = useState('2024-08');
  const [endDate, setEndDate] = useState('2025-02');
  const navigate = useNavigate();

  // Fetch selected range
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const allData = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        while (start <= end) {
          const year = start.getFullYear();
          const month = (start.getMonth() + 1).toString().padStart(2, '0');
          const formatted = `${year}-${month}`;

          const response = await fetch(`http://localhost:8000/api/crimes/summary?date=${formatted}`);
          const json = await response.json();

          const withDate = json.map(entry => ({
            ...entry,
            date: formatted
          }));

          allData.push(...withDate);
          start.setMonth(start.getMonth() + 1);
        }

        setData(allData);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      }
    };

    fetchAnalyticsData();
  }, [startDate, endDate]);

  // Fetch long-term (2022–2025)
  useEffect(() => {
    const fetchLongTermData = async () => {
      const allData = [];
      const start = new Date('2022-03');
      const end = new Date('2025-03');

      while (start <= end) {
        const year = start.getFullYear();
        const month = (start.getMonth() + 1).toString().padStart(2, '0');
        const formatted = `${year}-${month}`;

        try {
          const res = await fetch(`http://localhost:8000/api/crimes/summary?date=${formatted}`);
          const json = await res.json();
          const withDate = json.map(entry => ({
            ...entry,
            date: formatted
          }));
          allData.push(...withDate);
        } catch (err) {
          console.warn(`Failed to fetch long-term data for ${formatted}`);
        }

        start.setMonth(start.getMonth() + 1);
      }

      setLongTermData(allData);
    };

    fetchLongTermData();
  }, []);

  const trends = (() => {
    const summary = {};
    data.forEach(crime => {
      const month = crime.date || 'Unknown';
      summary[month] = (summary[month] || 0) + (crime.count || 0);
    });
    const sortedKeys = Object.keys(summary).sort();
    return {
      labels: sortedKeys,
      datasets: [{
        label: 'Total Crimes',
        data: sortedKeys.map(k => summary[k]),
        borderColor: 'blue',
        backgroundColor: 'blue',
        fill: false,
        tension: 0.2
      }]
    };
  })();

  const categories = (() => {
    const counts = {};
    data.forEach(crime => {
      const cat = crime.category || 'Unknown';
      counts[cat] = (counts[cat] || 0) + (crime.count || 0);
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).reverse();
    return {
      labels: sorted.map(([cat]) => cat),
      datasets: [{
        label: 'Crimes',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }]
    };
  })();

  const districts = (() => {
    const districtCounts = {};
    data.forEach(crime => {
      const district = crime.postcode?.split(' ')[0] || 'Unknown';
      districtCounts[district] = (districtCounts[district] || 0) + (crime.count || 0);
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

  const pie = (() => {
    const counts = {};
    data.forEach(crime => {
      const cat = crime.category || 'Unknown';
      counts[cat] = (counts[cat] || 0) + (crime.count || 0);
    });
    const entries = Object.entries(counts);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return {
      labels: entries.map(([cat]) => cat),
      datasets: [{
        label: 'Crime Breakdown',
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map((_, i) =>
          `hsl(${(i * 360) / entries.length}, 70%, 60%)`
        )
      }]
    };
  })();

  const crimeDistribution = (() => {
    const counts = data.map(c => c.count || 0);
    const bins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const binLabels = bins.map((b, i) =>
      i < bins.length - 1 ? `${b}–${bins[i + 1] - 1}` : `${b}+`
    );
    const binCounts = new Array(bins.length).fill(0);

    counts.forEach(count => {
      let placed = false;
      for (let i = 0; i < bins.length - 1; i++) {
        if (count >= bins[i] && count < bins[i + 1]) {
          binCounts[i]++;
          placed = true;
          break;
        }
      }
      if (!placed) binCounts[bins.length - 1]++;
    });

    return {
      labels: binLabels,
      datasets: [{
        label: 'Number of Crime Records',
        data: binCounts,
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
      }]
    };
  })();

const longTermTrend = (() => {
  const dateLabels = [];
  const current = new Date('2022-03');
  const end = new Date('2025-02');
  while (current <= end) {
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  dateLabels.push(`${year}-${month}`);
  current.setMonth(current.getMonth() + 1); // advance by 1 month
}

  // Build category data map
  const categoryMap = {};
  longTermData.forEach(crime => {
    const { category = 'Unknown', date, count = 0 } = crime;
    if (!categoryMap[category]) categoryMap[category] = {};
    categoryMap[category][date] = (categoryMap[category][date] || 0) + count;
  });

  const allCategories = Object.keys(categoryMap);

  const datasets = allCategories.map((category, i) => ({
    label: category,
    data: dateLabels.map(month => categoryMap[category][month] || 0),
    borderColor: `hsl(${(i * 360) / allCategories.length}, 70%, 50%)`,
    backgroundColor: 'transparent',
    tension: 0.3,
    pointRadius: 0,
    borderWidth: 1
  }));

  return {
    labels: dateLabels,
    datasets
  };
})();

const districtTrends = (() => {
  const districtMap = {};

  data.forEach(crime => {
    const month = crime.date || 'Unknown';
    const district = crime.postcode?.split(' ')[0] || 'Unknown';
    if (!districtMap[district]) districtMap[district] = {};
    districtMap[district][month] = (districtMap[district][month] || 0) + (crime.count || 0);
  });

  // Top 5 districts by total
  const topDistricts = Object.entries(districtMap)
    .map(([district, counts]) => ({
      district,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      data: counts
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const allMonths = [...new Set(data.map(c => c.date))].sort();

  return {
    labels: allMonths,
    datasets: topDistricts.map((d, i) => ({
      label: d.district,
      data: allMonths.map(month => d.data[month] || 0),
      borderColor: `hsl(${(i * 360) / 5}, 70%, 50%)`,
      fill: false,
      tension: 0.3
    }))
  };
})();

  return (
    <div className="analytics-panel">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Map
      </button>

      <div className="date-controls">
        <label>
          📅 Start Date:
          <input type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          📅 End Date:
          <input type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>

      <p>
        <em>Showing data from <strong>{startDate}</strong> to <strong>{endDate}</strong></em>
      </p>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>📈 Crime Trends Over Time</h3>
          <Line data={trends} />
        </div>

        <div className="chart-card">
          <h3>📊 Top Crime Categories</h3>
          <Bar data={categories} />
        </div>

        <div className="chart-card">
          <h3>📍 Top 10 Crime Districts</h3>
          <Bar data={districts} />
        </div>

        <div className="chart-card">
          <h3>🍰 Crime Category Breakdown</h3>
          <Pie
            data={pie}
            options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const value = context.parsed;
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${context.label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>📊 Crime Frequency Distribution</h3>
          <Bar data={crimeDistribution} />
        </div>

        <div className="chart-card wide">
          <h3>📈 District Crime Trends Over Time</h3>
          <Line data={districtTrends} />
        </div>

        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <h3>🕰️ Long-Term Crime Trends by Category (2022–2025)</h3>
          <Line data={longTermTrend} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;