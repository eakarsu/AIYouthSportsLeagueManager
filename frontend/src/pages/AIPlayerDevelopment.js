import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaChartLine, FaRobot, FaSyncAlt, FaSpinner, FaHistory, FaTrash,
  FaUser, FaFutbol, FaStar, FaBullseye, FaRunning, FaDumbbell,
  FaTrophy, FaArrowUp, FaSearch,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AIPlayerDevelopment() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search, setSearch] = useState('');
  const [focusArea, setFocusArea] = useState('overall');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/players');
      const p = Array.isArray(res.data) ? res.data : res.data.players || res.data.data || [];
      setPlayers(p);
    } catch (err) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPlayers = players.filter(p => {
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const skillColor = (level) => {
    if (level <= 3) return '#ef4444';
    if (level <= 6) return '#f59e0b';
    return '#22c55e';
  };

  const getSkillLabel = (level) => {
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Developing';
    if (level <= 6) return 'Intermediate';
    if (level <= 8) return 'Advanced';
    return 'Expert';
  };

  const runDevelopmentPlan = async () => {
    if (!selectedPlayer) {
      toast.warning('Please select a player first');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await api.post('/ai/player-development', {
        player: selectedPlayer,
        focusArea,
      });
      const aiResult = res.data.result || res.data.analysis || res.data.message || JSON.stringify(res.data);
      setResult(aiResult);
      setHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        playerName: `${selectedPlayer.first_name} ${selectedPlayer.last_name}`,
        focusArea,
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Development plan generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate development plan');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaChartLine style={{ marginRight: 10 }} /> AI Player Development</h1>
          <p>Track and predict player growth trajectories</p>
        </div>
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading players...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title"><FaChartLine style={{ marginRight: 10 }} /> AI Player Development</h1>
            <p>Track and predict player growth trajectories</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={runDevelopmentPlan} disabled={analyzing || !selectedPlayer}>
              {analyzing ? <><FaSpinner className="spin-animation" /> Generating...</> : <><FaRobot /> Generate Development Plan</>}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginBottom: 24 }}>
        {/* Player Selector */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUser style={{ color: '#10b981' }} /> Select Player
              </h3>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <FaSearch style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af', fontSize: 13 }} />
                <input
                  className="form-control"
                  placeholder="Search players..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {filteredPlayers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 20 }}>No players found</p>
                ) : filteredPlayers.map(p => {
                  const pid = p.id || p._id;
                  const isSelected = selectedPlayer && (selectedPlayer.id || selectedPlayer._id) === pid;
                  return (
                    <div key={pid} onClick={() => setSelectedPlayer(p)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                      background: isSelected ? '#ecfdf5' : '#f9fafb',
                      border: `2px solid ${isSelected ? '#10b981' : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: isSelected ? 'linear-gradient(135deg, #10b981, #059669)' : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? '#fff' : '#6b7280', fontWeight: 700, fontSize: 13,
                      }}>
                        {(p.first_name || '?')[0]}{(p.last_name || '')[0] || ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{p.position || 'No position'} | Age {p.age || '?'}</div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: `${skillColor(p.skill_level)}15`,
                        color: skillColor(p.skill_level),
                      }}>{p.skill_level || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Focus Area */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaBullseye style={{ color: '#f59e0b' }} /> Focus Area
              </h3>
              {[
                { key: 'overall', label: 'Overall Development', icon: <FaStar />, color: '#6366f1' },
                { key: 'technical', label: 'Technical Skills', icon: <FaFutbol />, color: '#3b82f6' },
                { key: 'physical', label: 'Physical Fitness', icon: <FaDumbbell />, color: '#ef4444' },
                { key: 'tactical', label: 'Tactical Awareness', icon: <FaBullseye />, color: '#f59e0b' },
                { key: 'mental', label: 'Mental & Leadership', icon: <FaTrophy />, color: '#8b5cf6' },
              ].map(area => (
                <div key={area.key} onClick={() => setFocusArea(area.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                  background: focusArea === area.key ? `${area.color}10` : '#f9fafb',
                  border: `2px solid ${focusArea === area.key ? area.color : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ color: area.color, fontSize: 16 }}>{area.icon}</span>
                  <span style={{
                    fontWeight: 600, fontSize: 13,
                    color: focusArea === area.key ? area.color : '#4b5563',
                  }}>{area.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Profile & Results */}
        <div>
          {!selectedPlayer ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 64 }}>
                <FaUser style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
                <h3 style={{ color: '#6b7280', marginBottom: 8 }}>Select a Player</h3>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Choose a player from the list to view their profile and generate a development plan</p>
              </div>
            </div>
          ) : (
            <>
              {/* Player Profile Card */}
              <div className="card" style={{ marginBottom: 24, borderTop: '4px solid #10b981' }}>
                <div className="card-body" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 16, flexShrink: 0,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 28,
                    }}>
                      {(selectedPlayer.first_name || '?')[0]}{(selectedPlayer.last_name || '')[0] || ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1f2937', margin: 0 }}>
                        {selectedPlayer.first_name} {selectedPlayer.last_name}
                      </h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {selectedPlayer.position && (
                          <span style={{ padding: '4px 12px', borderRadius: 16, background: '#eef2ff', color: '#6366f1', fontSize: 12, fontWeight: 600 }}>
                            <FaFutbol style={{ marginRight: 4 }} />{selectedPlayer.position}
                          </span>
                        )}
                        {selectedPlayer.age && (
                          <span style={{ padding: '4px 12px', borderRadius: 16, background: '#f3f4f6', color: '#4b5563', fontSize: 12, fontWeight: 600 }}>
                            Age {selectedPlayer.age}
                          </span>
                        )}
                        {selectedPlayer.status && (
                          <span style={{
                            padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                            background: selectedPlayer.status === 'active' ? '#dcfce7' : '#fef2f2',
                            color: selectedPlayer.status === 'active' ? '#16a34a' : '#dc2626',
                          }}>{selectedPlayer.status}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skill Level Display */}
                  <div style={{
                    marginTop: 24, padding: 20, borderRadius: 12,
                    background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
                        <FaChartLine style={{ marginRight: 6 }} /> Skill Level
                      </span>
                      <span style={{
                        fontSize: 18, fontWeight: 800, color: skillColor(selectedPlayer.skill_level),
                      }}>
                        {selectedPlayer.skill_level || 0}/10 - {getSkillLabel(selectedPlayer.skill_level || 0)}
                      </span>
                    </div>
                    <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(selectedPlayer.skill_level || 0) * 10}%`,
                        height: '100%', borderRadius: 6,
                        background: `linear-gradient(90deg, ${skillColor(selectedPlayer.skill_level)}, ${skillColor(selectedPlayer.skill_level)}cc)`,
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                      <span>Beginner</span><span>Developing</span><span>Intermediate</span><span>Advanced</span><span>Expert</span>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                    <div style={{
                      padding: 14, borderRadius: 10, textAlign: 'center',
                      background: '#eef2ff', border: '1px solid #c7d2fe',
                    }}>
                      <FaRunning style={{ fontSize: 20, color: '#6366f1', marginBottom: 4 }} />
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Position</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{selectedPlayer.position || 'N/A'}</div>
                    </div>
                    <div style={{
                      padding: 14, borderRadius: 10, textAlign: 'center',
                      background: '#fef9c3', border: '1px solid #fde68a',
                    }}>
                      <FaArrowUp style={{ fontSize: 20, color: '#ca8a04', marginBottom: 4 }} />
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Potential</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                        {Math.min(10, (selectedPlayer.skill_level || 0) + 2)}/10
                      </div>
                    </div>
                    <div style={{
                      padding: 14, borderRadius: 10, textAlign: 'center',
                      background: '#dcfce7', border: '1px solid #bbf7d0',
                    }}>
                      <FaStar style={{ fontSize: 20, color: '#16a34a', marginBottom: 4 }} />
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Focus</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', textTransform: 'capitalize' }}>{focusArea}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading Animation */}
              {analyzing && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                      <FaChartLine style={{ fontSize: 48, color: '#10b981', animation: 'pulse 1.5s infinite' }} />
                      <FaSyncAlt style={{
                        fontSize: 20, color: '#059669', position: 'absolute', top: -8, right: -12,
                        animation: 'spin 1s linear infinite',
                      }} />
                    </div>
                    <h3 style={{ color: '#1f2937', marginBottom: 8 }}>
                      Generating Development Plan for {selectedPlayer.first_name}...
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>
                      Analyzing skill level, position, and age to create a personalized plan
                    </p>
                    <div style={{ maxWidth: 300, margin: '16px auto', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 2, animation: 'loading-bar 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* AI Results */}
              {result && !analyzing && (
                <div className="card" style={{ marginBottom: 24, borderTop: '4px solid #10b981' }}>
                  <div className="card-body">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaRobot style={{ color: '#10b981' }} /> Development Plan for {selectedPlayer.first_name} {selectedPlayer.last_name}
                    </h3>
                    <AIResultDisplay result={result} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaHistory style={{ color: '#10b981' }} /> Development Plan History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}><FaTrash /> Clear</button>
            </div>
            {history.map(item => (
              <div key={item.id} style={{
                padding: 12, borderRadius: 8, background: '#f9fafb', marginBottom: 8, cursor: 'pointer',
              }} onClick={() => { setResult(item.result); setShowHistory(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.playerName}</span>
                    <span style={{
                      marginLeft: 8, padding: '1px 8px', borderRadius: 8,
                      background: '#eef2ff', color: '#6366f1', fontSize: 11, fontWeight: 600,
                    }}>{item.focusArea}</span>
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

export default AIPlayerDevelopment;
