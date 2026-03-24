import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Processes from './pages/Processes';
import Monitor from './pages/Monitor';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/processes" element={<Processes />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/logs" element={<div className="p-8 text-center text-slate-400">Logs Page (Coming Soon)</div>} />
          <Route path="/config" element={<div className="p-8 text-center text-slate-400">Config Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
