import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaUserTie, FaRobot, FaSyncAlt, FaSpinner, FaHistory, FaTrash,
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaFutbol, FaMapMarkerAlt,
  FaStar, FaExclamationTriangle, FaCheck, FaClock,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AIRefereeMatcher() {
  const [referees, setReferees] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [filterUnassigned, setFilterUnassigned] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [refRes, gamesRes] = await Promise.all([
        api.get('/referees'),
        api.get('/games'),
      ]);
      const r = Array.isArray(refRes.data) ? refRes.data : refRes.data.referees || refRes.data.data || [];
      const g = Array.isArray(gamesRes.data) ? gamesRes.data : gamesRes.data.games || gamesRes.data.data || [];
      setReferees(r);
      setGames(g);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcomingGames = games
    .filter(g => !g.date || new Date(g.date) >= new Date())
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  const unassignedGames = upcomingGames.filter(g => !g.referee_id && !g.referee);
  const assignedGames = upcomingGames.filter(g => g.referee_id || g.referee);
  const displayGames = filterUnassigned ? unassignedGames : upcomingGames;

  const toggleGameSelection = (gameId) => {
    setSelectedGames(prev =>
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = displayGames.map(g => g.id || g._id);
    setSelectedGames(visibleIds);
  };

  const clearSelection = () => setSelectedGames([]);

  const getRefereeName = (id) => {
    const r = referees.find(r => (r.id || r._id) === id);
    return r ? `${r.first_name || ''} ${r.last_name || ''}`.trim() : 'Unassigned';
  };

  const experienceColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'senior' || l === 'expert') return '#22c55e';
    if (l === 'intermediate' || l === 'mid') return '#f59e0b';
    return '#3b82f6';
  };

  const certBadge = (cert) => {
    if (!cert) return { bg: '#f3f4f6', color: '#6b7280', label: 'N/A' };
    const c = cert.toLowerCase();
    if (c.includes('level 3') || c.includes('advanced') || c.includes('national')) return { bg: '#dcfce7', color: '#16a34a', label: cert };
    if (c.includes('level 2') || c.includes('intermediate') || c.includes('regional')) return { bg: '#fef9c3', color: '#ca8a04', label: cert };
    return { bg: '#dbeafe', color: '#2563eb', label: cert };
  };

  const runMatching = async () => {
    const gamesToMatch = selectedGames.length > 0
      ? games.filter(g => selectedGames.includes(g.id || g._id))
      : unassignedGames;

    if (gamesToMatch.length === 0) {
      toast.warning('No games selected for referee matching');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.post('/ai/referee-matcher', {
        referees,
        games: gamesToMatch,
      });
      const aiResult = res.data.result || res.data.analysis || res.data.message || JSON.stringify(res.data);
      setResult(aiResult);
      setHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        gameCount: gamesToMatch.length,
        refereeCount: referees.length,
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Referee matching complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run referee matching');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaUserTie style={{ marginRight: 10 }} /> AI Referee Matcher</h1>
          <p>Match referees to games based on experience and availability</p>
        </div>
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading referees and games...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title"><FaUserTie style={{ marginRight: 10 }} /> AI Referee Matcher</h1>
            <p>Match referees to games based on experience and availability</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={runMatching} disabled={analyzing}>
              {analyzing ? <><FaSpinner className="spin-animation" /> Matching...</> : <><FaRobot /> Auto-Assign Referees</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaUserTie style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{referees.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Available Referees</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaFutbol style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{upcomingGames.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Upcoming Games</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaExclamationTriangle style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{unassignedGames.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Need Referees</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaCheckCircle style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{assignedGames.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Already Assigned</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Referee Roster */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaUserTie style={{ color: '#8b5cf6' }} /> Referee Roster
            </h3>
            {referees.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-icon"><FaUserTie /></div>
                <h3>No Referees Found</h3>
                <p>Add referees to enable matching</p>
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {referees.map(r => {
                  const badge = certBadge(r.certification || r.certification_level);
                  const gamesAssigned = games.filter(g => g.referee_id === (r.id || r._id)).length;
                  return (
                    <div key={r.id || r._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 8, marginBottom: 6, background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 14,
                      }}>
                        {(r.first_name || 'R')[0]}{(r.last_name || '')[0] || ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {r.first_name || ''} {r.last_name || ''}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={{
                            padding: '1px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                            background: badge.bg, color: badge.color,
                          }}>{badge.label}</span>
                          {r.experience_level && (
                            <span style={{
                              padding: '1px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                              background: `${experienceColor(r.experience_level)}15`,
                              color: experienceColor(r.experience_level),
                            }}>{r.experience_level}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>{gamesAssigned}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>games</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Games List */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <FaCalendarAlt style={{ color: '#3b82f6' }} /> Games
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: filterUnassigned ? '#ef4444' : '#6b7280',
                  padding: '4px 10px', borderRadius: 6,
                  background: filterUnassigned ? '#fef2f2' : '#f9fafb',
                }}>
                  <input
                    type="checkbox"
                    checked={filterUnassigned}
                    onChange={e => setFilterUnassigned(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  {filterUnassigned ? <FaTimesCircle /> : <FaFutbol />}
                  {filterUnassigned ? 'Unassigned Only' : 'All Games'}
                </label>
              </div>
            </div>

            {selectedGames.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 8, background: '#eef2ff', marginBottom: 12,
                fontSize: 13,
              }}>
                <span style={{ fontWeight: 600, color: '#6366f1' }}>{selectedGames.length} game(s) selected</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={selectAllVisible} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Select All</button>
                  <button onClick={clearSelection} style={{ background: 'none', border: 'none', color: '#6b7280', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Clear</button>
                </div>
              </div>
            )}

            {displayGames.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-icon"><FaCalendarAlt /></div>
                <h3>{filterUnassigned ? 'All Games Have Referees' : 'No Upcoming Games'}</h3>
                <p>{filterUnassigned ? 'Toggle filter to see all games' : 'Schedule games to assign referees'}</p>
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {displayGames.map(g => {
                  const gid = g.id || g._id;
                  const isSelected = selectedGames.includes(gid);
                  const hasRef = g.referee_id || g.referee;
                  return (
                    <div key={gid} onClick={() => toggleGameSelection(gid)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                      background: isSelected ? '#eef2ff' : '#f9fafb',
                      border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                      transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isSelected ? '#6366f1' : '#d1d5db'}`,
                        background: isSelected ? '#6366f1' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <FaCheck style={{ color: '#fff', fontSize: 10 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {g.home_team || 'Home'} vs {g.away_team || 'Away'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <FaClock style={{ fontSize: 9 }} />
                            {g.date ? new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                          </span>
                          {g.facility_name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <FaMapMarkerAlt style={{ fontSize: 9 }} />
                              {g.facility_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: hasRef ? '#dcfce7' : '#fef2f2',
                        color: hasRef ? '#16a34a' : '#dc2626',
                      }}>
                        {hasRef ? getRefereeName(g.referee_id) : 'UNASSIGNED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      {analyzing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <FaUserTie style={{ fontSize: 48, color: '#8b5cf6', animation: 'pulse 1.5s infinite' }} />
              <FaSyncAlt style={{
                fontSize: 20, color: '#6366f1', position: 'absolute', top: -8, right: -12,
                animation: 'spin 1s linear infinite',
              }} />
            </div>
            <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Matching Referees to Games...</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Evaluating {referees.length} referees for {selectedGames.length || unassignedGames.length} game(s)
            </p>
            <div style={{ maxWidth: 300, margin: '16px auto', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', borderRadius: 2, animation: 'loading-bar 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* AI Results */}
      {result && !analyzing && (
        <div className="card" style={{ marginBottom: 24, borderTop: '4px solid #8b5cf6' }}>
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaRobot style={{ color: '#8b5cf6' }} /> AI Referee Matching Results
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
                <FaHistory style={{ color: '#8b5cf6' }} /> Matching History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}><FaTrash /> Clear</button>
            </div>
            {history.map(item => (
              <div key={item.id} style={{
                padding: 12, borderRadius: 8, background: '#f9fafb', marginBottom: 8, cursor: 'pointer',
              }} onClick={() => { setResult(item.result); setShowHistory(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{item.gameCount} games, {item.refereeCount} referees</span>
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

export default AIRefereeMatcher;
