import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CrimeMapPage from './pages/CrimeMapPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CrimeMapPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Router>
  );
}

export default App;