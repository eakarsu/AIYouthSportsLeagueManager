import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Facilities from './pages/Facilities';
import Games from './pages/Games';
import Referees from './pages/Referees';
import Communications from './pages/Communications';
import Seasons from './pages/Seasons';
import Standings from './pages/Standings';
import AITeamBalancing from './pages/AITeamBalancing';
import AIScheduleOptimizer from './pages/AIScheduleOptimizer';
import AIRefereeMatcher from './pages/AIRefereeMatcher';
import AIPlayerDevelopment from './pages/AIPlayerDevelopment';
import AIGamePredictions from './pages/AIGamePredictions';
import AICommunicationGenerator from './pages/AICommunicationGenerator';
import AIPostgameSummary from './pages/AIPostgameSummary';
import AIInjuryRisk from './pages/AIInjuryRisk';
import CustomViewsPage from './pages/CustomViewsPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute><Facilities /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/referees" element={<ProtectedRoute><Referees /></ProtectedRoute>} />
        <Route path="/communications" element={<ProtectedRoute><Communications /></ProtectedRoute>} />
        <Route path="/seasons" element={<ProtectedRoute><Seasons /></ProtectedRoute>} />
        <Route path="/standings" element={<ProtectedRoute><Standings /></ProtectedRoute>} />
        <Route path="/ai/team-balancing" element={<ProtectedRoute><AITeamBalancing /></ProtectedRoute>} />
        <Route path="/ai/schedule-optimizer" element={<ProtectedRoute><AIScheduleOptimizer /></ProtectedRoute>} />
        <Route path="/ai/referee-matcher" element={<ProtectedRoute><AIRefereeMatcher /></ProtectedRoute>} />
        <Route path="/ai/player-development" element={<ProtectedRoute><AIPlayerDevelopment /></ProtectedRoute>} />
        <Route path="/ai/game-predictions" element={<ProtectedRoute><AIGamePredictions /></ProtectedRoute>} />
        <Route path="/ai/communication-generator" element={<ProtectedRoute><AICommunicationGenerator /></ProtectedRoute>} />
        <Route path="/ai/postgame-summary" element={<ProtectedRoute><AIPostgameSummary /></ProtectedRoute>} />
        <Route path="/ai/injury-risk" element={<ProtectedRoute><AIInjuryRisk /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
