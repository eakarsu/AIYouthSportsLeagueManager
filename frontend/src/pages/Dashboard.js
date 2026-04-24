import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUsers,
  FaFutbol,
  FaBuilding,
  FaCalendarAlt,
  FaFlag,
  FaComments,
  FaCalendar,
  FaTrophy,
  FaBalanceScale,
  FaMagic,
  FaUserCheck,
  FaChartLine,
  FaBrain,
  FaRobot,
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Dashboard() {
  const [counts, setCounts] = useState({
    players: 0,
    teams: 0,
    facilities: 0,
    games: 0,
    referees: 0,
    communications: 0,
    seasons: 0,
    standings: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const endpoints = [
      { key: 'players', url: `${API}/players` },
      { key: 'teams', url: `${API}/teams` },
      { key: 'facilities', url: `${API}/facilities` },
      { key: 'games', url: `${API}/games` },
      { key: 'referees', url: `${API}/referees` },
      { key: 'communications', url: `${API}/communications` },
      { key: 'seasons', url: `${API}/seasons` },
      { key: 'standings', url: `${API}/standings` },
    ];

    endpoints.forEach(({ key, url }) => {
      fetch(url, { headers })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const count = Array.isArray(data) ? data.length : 0;
          setCounts((prev) => ({ ...prev, [key]: count }));
        })
        .catch(() => {});
    });
  }, []);

  const managementCards = [
    { to: '/players', icon: <FaUsers />, color: 'blue', title: 'Player Registration', desc: 'Manage player registrations, skills, and profiles', countKey: 'players' },
    { to: '/teams', icon: <FaFutbol />, color: 'green', title: 'Team Management', desc: 'Organize teams, rosters, and coaching staff', countKey: 'teams' },
    { to: '/facilities', icon: <FaBuilding />, color: 'purple', title: 'Facility Management', desc: 'Track fields, courts, and venue availability', countKey: 'facilities' },
    { to: '/games', icon: <FaCalendarAlt />, color: 'orange', title: 'Game Scheduling', desc: 'Schedule and manage game results', countKey: 'games' },
    { to: '/referees', icon: <FaFlag />, color: 'cyan', title: 'Referee Management', desc: 'Referee assignments and certifications', countKey: 'referees' },
    { to: '/communications', icon: <FaComments />, color: 'green', title: 'Parent Communication', desc: 'Parent portal and messaging', countKey: 'communications' },
    { to: '/seasons', icon: <FaCalendar />, color: 'blue', title: 'Season Management', desc: 'Configure seasons and divisions', countKey: 'seasons' },
    { to: '/standings', icon: <FaTrophy />, color: 'orange', title: 'League Standings', desc: 'View league standings and rankings', countKey: 'standings' },
  ];

  const aiCards = [
    { to: '/ai/team-balancing', icon: <FaBalanceScale />, title: 'AI Team Balancing', desc: 'AI-powered team composition and balance analysis' },
    { to: '/ai/schedule-optimizer', icon: <FaMagic />, title: 'AI Schedule Optimizer', desc: 'Optimize game schedules for fairness and logistics' },
    { to: '/ai/referee-matcher', icon: <FaUserCheck />, title: 'AI Referee Matcher', desc: 'Match referees to games based on experience' },
    { to: '/ai/player-development', icon: <FaChartLine />, title: 'AI Player Development', desc: 'Track and predict player growth trajectories' },
    { to: '/ai/game-predictions', icon: <FaBrain />, title: 'AI Game Predictions', desc: 'AI predictions for upcoming game outcomes' },
    { to: '/ai/communication-generator', icon: <FaRobot />, title: 'AI Communication Generator', desc: 'Auto-generate emails, announcements, and reports' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to your AI-powered league management hub</p>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
        League Management
      </h3>
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        {managementCards.map((card) => (
          <Link key={card.to} to={card.to} className="dashboard-card">
            <div className={`card-icon ${card.color}`}>{card.icon}</div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              {card.countKey && (
                <span className="card-count">{counts[card.countKey]} items</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
        AI-Powered Features
      </h3>
      <div className="dashboard-grid">
        {aiCards.map((card) => (
          <Link key={card.to} to={card.to} className="dashboard-card ai-card">
            <div className="card-icon purple">{card.icon}</div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
