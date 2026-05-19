import React, { useState } from 'react';
import { FaChartBar, FaCalendarCheck, FaFilePdf, FaCog } from 'react-icons/fa';
import TeamStandingsChart from '../components/TeamStandingsChart';
import PracticeAttendanceHeatmap from '../components/PracticeAttendanceHeatmap';
import RosterPDF from '../components/RosterPDF';
import LeagueRulesEditor from '../components/LeagueRulesEditor';

const TABS = [
  { key: 'standings', label: 'Standings Chart', icon: <FaChartBar /> },
  { key: 'attendance', label: 'Attendance Heatmap', icon: <FaCalendarCheck /> },
  { key: 'roster', label: 'Roster PDF', icon: <FaFilePdf /> },
  { key: 'rules', label: 'League Rules', icon: <FaCog /> },
];

function CustomViewsPage() {
  const [tab, setTab] = useState('standings');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">League Views</h1>
            <p>Custom analytics, exports, and configuration tools</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div data-testid="custom-views-panel">
        {tab === 'standings' && <TeamStandingsChart />}
        {tab === 'attendance' && <PracticeAttendanceHeatmap />}
        {tab === 'roster' && <RosterPDF />}
        {tab === 'rules' && <LeagueRulesEditor />}
      </div>
    </div>
  );
}

export default CustomViewsPage;
