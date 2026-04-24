import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaFutbol,
  FaBuilding,
  FaCalendarAlt,
  FaFlag,
  FaComments,
  FaTrophy,
  FaRobot,
  FaBrain,
  FaChartLine,
  FaBalanceScale,
  FaCalendar,
  FaUserCheck,
  FaMagic,
  FaTachometerAlt,
  FaSignOutAlt,
  FaBars,
  FaChevronLeft,
  FaBolt,
} from 'react-icons/fa';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const managementLinks = [
    { to: '/players', icon: <FaUsers />, label: 'Players' },
    { to: '/teams', icon: <FaFutbol />, label: 'Teams' },
    { to: '/facilities', icon: <FaBuilding />, label: 'Facilities' },
    { to: '/games', icon: <FaCalendarAlt />, label: 'Games' },
    { to: '/referees', icon: <FaFlag />, label: 'Referees' },
    { to: '/seasons', icon: <FaCalendar />, label: 'Seasons' },
    { to: '/standings', icon: <FaTrophy />, label: 'Standings' },
  ];

  const communicationLinks = [
    { to: '/communications', icon: <FaComments />, label: 'Parent Portal' },
  ];

  const aiLinks = [
    { to: '/ai/team-balancing', icon: <FaBalanceScale />, label: 'Team Balancing' },
    { to: '/ai/schedule-optimizer', icon: <FaMagic />, label: 'Schedule Optimizer' },
    { to: '/ai/referee-matcher', icon: <FaUserCheck />, label: 'Referee Matcher' },
    { to: '/ai/player-development', icon: <FaChartLine />, label: 'Player Development' },
    { to: '/ai/game-predictions', icon: <FaBrain />, label: 'Game Predictions' },
    { to: '/ai/communication-generator', icon: <FaRobot />, label: 'Communication Gen' },
  ];

  return (
    <div className="app-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <FaBolt />
            </div>
            <div className="brand-text">
              <h2>Sports League</h2>
              <p>AI Manager</p>
            </div>
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FaBars /> : <FaChevronLeft />}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{getInitials(user.name || user.email)}</div>
          <div className="user-info">
            <div className="user-name">{user.name || 'Admin User'}</div>
            <div className="user-role">{user.role || 'Administrator'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-label">Overview</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FaTachometerAlt /></span>
              <span>Dashboard</span>
            </NavLink>
          </div>

          <div className="nav-group">
            <div className="nav-group-label">Management</div>
            {managementLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-group">
            <div className="nav-group-label">Communication</div>
            {communicationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-group">
            <div className="nav-group-label">AI Features</div>
            {aiLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
