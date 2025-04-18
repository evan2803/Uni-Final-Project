import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyticsPanel from '../components/AnalyticsPanel';

const AnalyticsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="analytics-panel-full">
      <button onClick={() => navigate('/')}>← Back to Map</button>
      <AnalyticsPanel />
    </div>
  );
};

export default AnalyticsPage;