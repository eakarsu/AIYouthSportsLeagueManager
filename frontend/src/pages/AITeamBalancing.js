import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaBalanceScale, FaUsers, FaRobot, FaSyncAlt, FaChevronDown, FaChevronUp,
  FaTrophy, FaExchangeAlt, FaCheckCircle, FaSpinner, FaHistory, FaTrash,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AITeamBalancing() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [playersRes, teamsRes] = await Promise.all([
        api.get('/players'),
        api.get('/teams'),
      ]);
      const p = Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.players || playersRes.data.data || [];
      const t = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.teams || teamsRes.data.data || [];
      setPlayers(p);
      setTeams(t);
      setSelectedTeams(t.map(team => team.id || team._id));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
  };

  const getAvgSkill = (teamPlayers) => {
    if (teamPlayers.length === 0) return 0;
    return (teamPlayers.reduce((sum, p) => sum + (p.skill_level || 0), 0) / teamPlayers.length).toFixed(1);
  };

  const getPositionCounts = (teamPlayers) => {
    const counts = {};
    teamPlayers.forEach(p => {
      const pos = p.position || 'Unassigned';
      counts[pos] = (counts[pos] || 0) + 1;
    });
    return counts;
  };

  const getOverallBalance = () => {
    const teamAvgs = teams.map(t => parseFloat(getAvgSkill(getTeamPlayers(t.id || t._id))));
    if (teamAvgs.length < 2) return 100;
    const max = Math.max(...teamAvgs);
    const min = Math.min(...teamAvgs);
    if (max === 0) return 100;
    return Math.round((1 - (max - min) / max) * 100);
  };

  const toggleTeamSelection = (teamId) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const skillColor = (level) => {
    if (level <= 3) return '#ef4444';
    if (level <= 6) return '#f59e0b';
    return '#22c55e';
  };

  const balanceColor = (score) => {
    if (score >= 85) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const runAnalysis = async () => {
    if (selectedTeams.length < 2) {
      toast.warning('Select at least 2 teams for balancing analysis');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const filteredTeams = teams.filter(t => selectedTeams.includes(t.id || t._id));
      const filteredPlayers = players.filter(p => selectedTeams.includes(p.team_id) || !p.team_id);
      const res = await api.post('/ai/team-balancing', {
        players: filteredPlayers,
        teams: filteredTeams,
      });
      const aiResult = res.data.result || res.data.analysis || res.data.message || JSON.stringify(res.data);
      setResult(aiResult);
      setHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        teamCount: filteredTeams.length,
        playerCount: filteredPlayers.length,
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Team balancing analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run AI analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const balanceScore = getOverallBalance();
  const unassignedPlayers = players.filter(p => !p.team_id);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaBalanceScale style={{ marginRight: 10 }} /> AI Team Balancing</h1>
          <p>Analyze and optimize team composition for competitive balance</p>
        </div>
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading teams and players...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title"><FaBalanceScale style={{ marginRight: 10 }} /> AI Team Balancing</h1>
            <p>Analyze and optimize team composition for competitive balance</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowHistory(!showHistory)}
              style={{ position: 'relative' }}
            >
              <FaHistory /> History
              {history.length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6, background: '#6366f1',
                  color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{history.length}</span>
              )}
            </button>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? <><FaSpinner className="spin-animation" /> Analyzing...</> : <><FaRobot /> Run AI Team Balancing</>}
            </button>
          </div>
        </div>
      </div>

      {/* Balance Score Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaBalanceScale style={{ fontSize: 28, marginBottom: 8, opacity: 0.9 }} />
            <div style={{ fontSize: 36, fontWeight: 800 }}>{balanceScore}%</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Overall Balance Score</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaUsers style={{ fontSize: 28, marginBottom: 8, color: '#3b82f6' }} />
            <div style={{ fontSize: 36, fontWeight: 800, color: '#1f2937' }}>{teams.length}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Teams</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaTrophy style={{ fontSize: 28, marginBottom: 8, color: '#f59e0b' }} />
            <div style={{ fontSize: 36, fontWeight: 800, color: '#1f2937' }}>{players.length}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Players</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaExchangeAlt style={{ fontSize: 28, marginBottom: 8, color: '#ef4444' }} />
            <div style={{ fontSize: 36, fontWeight: 800, color: '#1f2937' }}>{unassignedPlayers.length}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Unassigned Players</div>
          </div>
        </div>
      </div>

      {/* Team Selection */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCheckCircle style={{ color: '#6366f1' }} /> Select Teams for Analysis
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {teams.map(t => {
              const tid = t.id || t._id;
              const isSelected = selectedTeams.includes(tid);
              return (
                <button
                  key={tid}
                  onClick={() => toggleTeamSelection(tid)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, border: '2px solid',
                    borderColor: isSelected ? '#6366f1' : '#e5e7eb',
                    background: isSelected ? '#eef2ff' : '#fff',
                    color: isSelected ? '#6366f1' : '#6b7280',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSelected && <FaCheckCircle style={{ marginRight: 6, fontSize: 11 }} />}
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Composition Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {teams.map(t => {
          const tid = t.id || t._id;
          const teamPlayers = getTeamPlayers(tid);
          const avgSkill = getAvgSkill(teamPlayers);
          const positions = getPositionCounts(teamPlayers);
          const isExpanded = expandedTeam === tid;

          return (
            <div key={tid} className="card" style={{
              border: selectedTeams.includes(tid) ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              <div className="card-body" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', margin: 0 }}>{t.name}</h3>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{teamPlayers.length} players</span>
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: `conic-gradient(${skillColor(avgSkill)} ${avgSkill * 10}%, #e5e7eb 0)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: skillColor(avgSkill),
                    }}>{avgSkill}</div>
                  </div>
                </div>

                {/* Skill Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                    <span>Avg Skill Level</span>
                    <span style={{ fontWeight: 700, color: skillColor(avgSkill) }}>{avgSkill}/10</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                    <div style={{ width: `${avgSkill * 10}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${skillColor(avgSkill)}, ${skillColor(avgSkill)}dd)`, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Position Distribution */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {Object.entries(positions).map(([pos, count]) => (
                    <span key={pos} style={{
                      padding: '2px 8px', borderRadius: 10, background: '#f3f4f6',
                      fontSize: 11, fontWeight: 600, color: '#4b5563',
                    }}>{pos}: {count}</span>
                  ))}
                </div>

                {/* Expandable Player List */}
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : tid)}
                  style={{
                    width: '100%', padding: '8px 0', background: 'none', border: 'none',
                    color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {isExpanded ? <><FaChevronUp /> Hide Players</> : <><FaChevronDown /> Show Players</>}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                    {teamPlayers.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No players assigned</p>
                    ) : teamPlayers.map(p => (
                      <div key={p.id || p._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 8px', borderRadius: 6, marginBottom: 4,
                        background: '#f9fafb', fontSize: 13,
                      }}>
                        <span style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{p.position || '—'}</span>
                          <span style={{
                            padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                            background: `${skillColor(p.skill_level)}20`, color: skillColor(p.skill_level),
                          }}>{p.skill_level || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #f59e0b' }}>
          <div className="card-body">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>
              <FaExchangeAlt style={{ marginRight: 8 }} />
              {unassignedPlayers.length} Unassigned Player{unassignedPlayers.length > 1 ? 's' : ''}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {unassignedPlayers.map(p => (
                <span key={p.id || p._id} style={{
                  padding: '4px 12px', borderRadius: 16, background: '#fef3c7',
                  fontSize: 12, fontWeight: 600, color: '#92400e',
                }}>
                  {p.first_name} {p.last_name} (Skill: {p.skill_level || 0})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Animation */}
      {analyzing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <FaRobot style={{ fontSize: 48, color: '#6366f1', animation: 'pulse 1.5s infinite' }} />
              <FaSyncAlt style={{
                fontSize: 20, color: '#8b5cf6', position: 'absolute', top: -8, right: -12,
                animation: 'spin 1s linear infinite',
              }} />
            </div>
            <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Analyzing Team Composition...</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Evaluating {players.length} players across {selectedTeams.length} teams for optimal balance
            </p>
            <div style={{ maxWidth: 300, margin: '16px auto', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: '60%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: 2, animation: 'loading-bar 1.5s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* AI Results */}
      {result && !analyzing && (
        <div className="card" style={{ marginBottom: 24, borderTop: '4px solid #6366f1' }}>
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaRobot style={{ color: '#6366f1' }} /> AI Team Balancing Results
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
                <FaHistory style={{ color: '#6366f1' }} /> Analysis History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}>
                <FaTrash /> Clear
              </button>
            </div>
            {history.map((item) => (
              <div key={item.id} style={{
                padding: 12, borderRadius: 8, background: '#f9fafb',
                marginBottom: 8, cursor: 'pointer',
              }} onClick={() => { setResult(item.result); setShowHistory(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{item.teamCount} teams, {item.playerCount} players</span>
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

export default AITeamBalancing;
