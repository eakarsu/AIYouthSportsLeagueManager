import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaBrain, FaRobot, FaSyncAlt, FaSpinner, FaHistory, FaTrash,
  FaFutbol, FaTrophy, FaChartBar, FaPercentage, FaCalendarAlt,
  FaArrowRight, FaShieldAlt, FaClock, FaMapMarkerAlt,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AIGamePredictions() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [gamesRes, teamsRes, standingsRes] = await Promise.all([
        api.get('/games'),
        api.get('/teams'),
        api.get('/standings').catch(() => ({ data: [] })),
      ]);
      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : gamesRes.data.games || gamesRes.data.data || []);
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.teams || teamsRes.data.data || []);
      setStandings(Array.isArray(standingsRes.data) ? standingsRes.data : standingsRes.data.standings || standingsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTeam = (id) => teams.find(t => (t.id || t._id) === id);
  const getTeamName = (id) => { const t = getTeam(id); return t ? t.name : 'TBD'; };
  const getTeamStanding = (id) => standings.find(s => (s.team_id || s.teamId) === id);

  const upcomingGames = games
    .filter(g => !g.date || new Date(g.date) >= new Date())
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  const runPrediction = async () => {
    if (!selectedGame) {
      toast.warning('Please select a game to predict');
      return;
    }
    setAnalyzing(true);
    setResult(null);

    const homeTeamId = selectedGame.home_team_id || selectedGame.homeTeam;
    const awayTeamId = selectedGame.away_team_id || selectedGame.awayTeam;

    try {
      const res = await api.post('/ai/game-predictions', {
        game: selectedGame,
        homeTeam: getTeam(homeTeamId) || { name: getTeamName(homeTeamId) },
        awayTeam: getTeam(awayTeamId) || { name: getTeamName(awayTeamId) },
        standings,
      });
      const aiResult = res.data.result || res.data.analysis || res.data.message || JSON.stringify(res.data);
      setResult(aiResult);
      setHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        matchup: `${getTeamName(homeTeamId)} vs ${getTeamName(awayTeamId)}`,
        gameDate: selectedGame.date,
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Prediction generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate prediction');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaBrain style={{ marginRight: 10 }} /> AI Game Predictions</h1>
          <p>AI predictions for upcoming game outcomes</p>
        </div>
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading games and standings...</span></div>
      </div>
    );
  }

  const homeTeamId = selectedGame ? (selectedGame.home_team_id || selectedGame.homeTeam) : null;
  const awayTeamId = selectedGame ? (selectedGame.away_team_id || selectedGame.awayTeam) : null;
  const homeStanding = homeTeamId ? getTeamStanding(homeTeamId) : null;
  const awayStanding = awayTeamId ? getTeamStanding(awayTeamId) : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title"><FaBrain style={{ marginRight: 10 }} /> AI Game Predictions</h1>
            <p>AI predictions for upcoming game outcomes</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={runPrediction} disabled={analyzing || !selectedGame}>
              {analyzing ? <><FaSpinner className="spin-animation" /> Predicting...</> : <><FaRobot /> Predict Outcome</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaFutbol style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{upcomingGames.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Upcoming Games</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaShieldAlt style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{teams.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Teams</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaTrophy style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{standings.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Standings Records</div>
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: '#fff' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
            <FaChartBar style={{ fontSize: 24, marginBottom: 6, opacity: 0.9 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{history.length}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Predictions Made</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginBottom: 24 }}>
        {/* Game Selector */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaCalendarAlt style={{ color: '#ec4899' }} /> Select Game to Predict
            </h3>
            {upcomingGames.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-icon"><FaFutbol /></div>
                <h3>No Upcoming Games</h3>
                <p>Schedule games to generate predictions</p>
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {upcomingGames.map(g => {
                  const gid = g.id || g._id;
                  const isSelected = selectedGame && (selectedGame.id || selectedGame._id) === gid;
                  const hid = g.home_team_id || g.homeTeam;
                  const aid = g.away_team_id || g.awayTeam;
                  return (
                    <div key={gid} onClick={() => setSelectedGame(g)} style={{
                      padding: 14, borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(135deg, #fdf2f8, #fce7f3)' : '#f9fafb',
                      border: `2px solid ${isSelected ? '#ec4899' : '#e5e7eb'}`,
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <FaClock style={{ fontSize: 10, color: '#6b7280' }} />
                        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                          {g.date ? new Date(g.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{getTeamName(hid)}</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>HOME</div>
                        </div>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? '#ec4899' : '#e5e7eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? '#fff' : '#6b7280', fontSize: 10, fontWeight: 800,
                        }}>VS</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{getTeamName(aid)}</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>AWAY</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Preview & Results */}
        <div>
          {!selectedGame ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 64 }}>
                <FaBrain style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
                <h3 style={{ color: '#6b7280', marginBottom: 8 }}>Select a Game</h3>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Choose an upcoming game from the list to generate an AI prediction</p>
              </div>
            </div>
          ) : (
            <>
              {/* Matchup Preview */}
              <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                  padding: 32, color: '#fff', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 12, color: '#a5b4fc', marginBottom: 8, fontWeight: 600 }}>
                    <FaCalendarAlt style={{ marginRight: 6 }} />
                    {selectedGame.date ? new Date(selectedGame.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 16 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800,
                      }}>
                        {getTeamName(homeTeamId).substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{getTeamName(homeTeamId)}</div>
                      <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4 }}>HOME</div>
                      {homeStanding && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#c7d2fe' }}>
                          W{homeStanding.wins || 0} - L{homeStanding.losses || 0} - D{homeStanding.draws || homeStanding.ties || 0}
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 14,
                    }}>VS</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800, color: '#1f2937',
                      }}>
                        {getTeamName(awayTeamId).substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{getTeamName(awayTeamId)}</div>
                      <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4 }}>AWAY</div>
                      {awayStanding && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#c7d2fe' }}>
                          W{awayStanding.wins || 0} - L{awayStanding.losses || 0} - D{awayStanding.draws || awayStanding.ties || 0}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Comparison Bars */}
                {(homeStanding || awayStanding) && (
                  <div className="card-body" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
                      <FaChartBar style={{ marginRight: 6 }} /> Team Comparison
                    </h4>
                    {['wins', 'losses'].map(stat => {
                      const homeVal = homeStanding ? (homeStanding[stat] || 0) : 0;
                      const awayVal = awayStanding ? (awayStanding[stat] || 0) : 0;
                      const total = homeVal + awayVal || 1;
                      return (
                        <div key={stat} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                            <span style={{ color: '#6366f1' }}>{homeVal}</span>
                            <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{stat}</span>
                            <span style={{ color: '#f59e0b' }}>{awayVal}</span>
                          </div>
                          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                            <div style={{ width: `${(homeVal / total) * 100}%`, background: '#6366f1', borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
                            <div style={{ width: `${(awayVal / total) * 100}%`, background: '#f59e0b', borderRadius: '0 4px 4px 0', transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Loading */}
              {analyzing && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                      <FaBrain style={{ fontSize: 48, color: '#ec4899', animation: 'pulse 1.5s infinite' }} />
                      <FaSyncAlt style={{
                        fontSize: 20, color: '#db2777', position: 'absolute', top: -8, right: -12,
                        animation: 'spin 1s linear infinite',
                      }} />
                    </div>
                    <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Analyzing Matchup...</h3>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>
                      {getTeamName(homeTeamId)} vs {getTeamName(awayTeamId)}
                    </p>
                    <div style={{ maxWidth: 300, margin: '16px auto', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #ec4899, #db2777)', borderRadius: 2, animation: 'loading-bar 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && !analyzing && (
                <div className="card" style={{ marginBottom: 24, borderTop: '4px solid #ec4899' }}>
                  <div className="card-body">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaRobot style={{ color: '#ec4899' }} /> Prediction: {getTeamName(homeTeamId)} vs {getTeamName(awayTeamId)}
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
                <FaHistory style={{ color: '#ec4899' }} /> Prediction History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}><FaTrash /> Clear</button>
            </div>
            {history.map(item => (
              <div key={item.id} style={{
                padding: 12, borderRadius: 8, background: '#f9fafb', marginBottom: 8, cursor: 'pointer',
              }} onClick={() => { setResult(item.result); setShowHistory(false); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{item.matchup}</span>
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

export default AIGamePredictions;
