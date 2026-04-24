import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt, FaRobot, FaSyncAlt, FaSpinner, FaHistory, FaTrash,
  FaClock, FaMapMarkerAlt, FaFutbol, FaCheckCircle, FaCog, FaArrowRight,
  FaBuilding, FaExclamationTriangle,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AIScheduleOptimizer() {
  const [games, setGames] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [preferences, setPreferences] = useState({
    priority: 'balanced',
    avoidBackToBack: true,
    balanceHomeAway: true,
    minimizeTravel: false,
    maximizeFacilityUsage: false,
    restDaysBetweenGames: 2,
    preferWeekends: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [gamesRes, facilitiesRes, teamsRes] = await Promise.all([
        api.get('/games'),
        api.get('/facilities').catch(() => ({ data: [] })),
        api.get('/teams'),
      ]);
      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : gamesRes.data.games || gamesRes.data.data || []);
      setFacilities(Array.isArray(facilitiesRes.data) ? facilitiesRes.data : facilitiesRes.data.facilities || facilitiesRes.data.data || []);
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.teams || teamsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTeamName = (id) => {
    const t = teams.find(t => (t.id || t._id) === id);
    return t ? t.name : 'TBD';
  };

  const getFacilityName = (id) => {
    const f = facilities.find(f => (f.id || f._id) === id);
    return f ? f.name : 'TBD';
  };

  const upcomingGames = games.filter(g => {
    if (!g.date) return true;
    return new Date(g.date) >= new Date();
  }).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  const pastGames = games.filter(g => g.date && new Date(g.date) < new Date());

  const conflicts = upcomingGames.filter((g, i) => {
    return upcomingGames.some((other, j) => {
      if (i === j) return false;
      if (g.date && other.date && g.date === other.date) {
        return g.facility_id && other.facility_id && g.facility_id === other.facility_id;
      }
      return false;
    });
  });

  const runOptimization = async () => {
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.post('/ai/schedule-optimizer', {
        games,
        facilities,
        teams,
        preferences,
      });
      const aiResult = res.data.result || res.data.analysis || res.data.message || JSON.stringify(res.data);
      setResult(aiResult);
      setHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        priority: preferences.priority,
        gameCount: games.length,
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Schedule optimization complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run schedule optimization');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaCalendarAlt style={{ marginRight: 10 }} /> AI Schedule Optimizer</h1>
          <p>Optimize game schedules for fairness and logistics</p>
        </div>
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading schedule data...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title"><FaCalendarAlt style={{ marginRight: 10 }} /> AI Schedule Optimizer</h1>
            <p>Optimize game schedules for fairness and logistics</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={runOptimization} disabled={analyzing}>
              {analyzing ? <><FaSpinner className="spin-animation" /> Optimizing...</> : <><FaRobot /> Optimize Schedule</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaFutbol style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{games.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Total Games</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaClock style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{upcomingGames.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Upcoming Games</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaBuilding style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{facilities.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Facilities</div>
          </div>
        </div>
        <div className="card" style={{
          background: conflicts.length > 0
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          color: '#fff',
        }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            {conflicts.length > 0 ? <FaExclamationTriangle style={{ fontSize: 24, marginBottom: 6 }} /> : <FaCheckCircle style={{ fontSize: 24, marginBottom: 6 }} />}
            <div style={{ fontSize: 32, fontWeight: 800 }}>{conflicts.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Conflicts Detected</div>
          </div>
        </div>
      </div>

      {/* Optimization Preferences */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCog style={{ color: '#6366f1' }} /> Optimization Preferences
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13 }}>Optimization Priority</label>
              <select
                className="form-control"
                value={preferences.priority}
                onChange={e => setPreferences(p => ({ ...p, priority: e.target.value }))}
              >
                <option value="balanced">Balanced (All Factors)</option>
                <option value="minimize-travel">Minimize Travel Distance</option>
                <option value="maximize-facility">Maximize Facility Usage</option>
                <option value="balance-home-away">Balance Home/Away Games</option>
                <option value="minimize-conflicts">Minimize Scheduling Conflicts</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13 }}>Minimum Rest Days Between Games</label>
              <input
                className="form-control"
                type="number"
                min="0"
                max="14"
                value={preferences.restDaysBetweenGames}
                onChange={e => setPreferences(p => ({ ...p, restDaysBetweenGames: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
            {[
              { key: 'avoidBackToBack', label: 'Avoid Back-to-Back Games' },
              { key: 'balanceHomeAway', label: 'Balance Home/Away' },
              { key: 'minimizeTravel', label: 'Minimize Travel' },
              { key: 'maximizeFacilityUsage', label: 'Maximize Facility Usage' },
              { key: 'preferWeekends', label: 'Prefer Weekend Games' },
            ].map(opt => (
              <label key={opt.key} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '8px 16px', borderRadius: 8,
                background: preferences[opt.key] ? '#eef2ff' : '#f9fafb',
                border: `2px solid ${preferences[opt.key] ? '#6366f1' : '#e5e7eb'}`,
                fontSize: 13, fontWeight: 600,
                color: preferences[opt.key] ? '#6366f1' : '#6b7280',
                transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={preferences[opt.key]}
                  onChange={e => setPreferences(p => ({ ...p, [opt.key]: e.target.checked }))}
                  style={{ display: 'none' }}
                />
                {preferences[opt.key] ? <FaCheckCircle /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #d1d5db' }} />}
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Current Schedule Overview */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCalendarAlt style={{ color: '#3b82f6' }} /> Current Schedule ({upcomingGames.length} upcoming)
          </h3>
          {upcomingGames.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-icon"><FaCalendarAlt /></div>
              <h3>No Upcoming Games</h3>
              <p>Add games to the schedule to run optimization</p>
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {upcomingGames.slice(0, 20).map((g, i) => {
                const isConflict = conflicts.some(c => (c.id || c._id) === (g.id || g._id));
                return (
                  <div key={g.id || g._id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                    borderRadius: 8, marginBottom: 8,
                    background: isConflict ? '#fef2f2' : '#f9fafb',
                    borderLeft: `4px solid ${isConflict ? '#ef4444' : '#3b82f6'}`,
                  }}>
                    <div style={{ minWidth: 80, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                        {g.date ? new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {g.time || (g.date ? new Date(g.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '')}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
                        <span>{getTeamName(g.home_team_id || g.homeTeam)}</span>
                        <span style={{ color: '#6b7280', fontSize: 11 }}>vs</span>
                        <span>{getTeamName(g.away_team_id || g.awayTeam)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <FaMapMarkerAlt style={{ fontSize: 10 }} />
                        {getFacilityName(g.facility_id || g.facility)}
                      </div>
                    </div>
                    {isConflict && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 8, background: '#ef4444',
                        color: '#fff', fontSize: 10, fontWeight: 700,
                      }}>CONFLICT</span>
                    )}
                  </div>
                );
              })}
              {upcomingGames.length > 20 && (
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                  + {upcomingGames.length - 20} more games
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Animation */}
      {analyzing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <FaCalendarAlt style={{ fontSize: 48, color: '#3b82f6', animation: 'pulse 1.5s infinite' }} />
              <FaSyncAlt style={{
                fontSize: 20, color: '#6366f1', position: 'absolute', top: -8, right: -12,
                animation: 'spin 1s linear infinite',
              }} />
            </div>
            <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Optimizing Schedule...</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Analyzing {games.length} games across {facilities.length} facilities for {teams.length} teams
            </p>
            <div style={{ maxWidth: 300, margin: '16px auto', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 2, animation: 'loading-bar 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* AI Results */}
      {result && !analyzing && (
        <div className="card" style={{ marginBottom: 24, borderTop: '4px solid #3b82f6' }}>
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaRobot style={{ color: '#3b82f6' }} /> Schedule Optimization Results
            </h3>
            <AIResultDisplay result={result} />
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaHistory style={{ color: '#3b82f6' }} /> Optimization History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}><FaTrash /> Clear</button>
            </div>
            {history.map(item => (
              <div key={item.id} style={{
                padding: 12, borderRadius: 8, background: '#f9fafb', marginBottom: 8, cursor: 'pointer',
              }} onClick={() => { setResult(item.result); setShowHistory(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Priority: {item.priority}</span>
                    <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>{item.gameCount} games</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default AIScheduleOptimizer;
