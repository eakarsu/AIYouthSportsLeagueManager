import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaRegNewspaper, FaRobot, FaSpinner, FaHistory, FaTrash,
  FaFutbol, FaTrophy, FaCopy, FaCheckCircle,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AIPostgameSummary() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [form, setForm] = useState({
    homeScore: '',
    awayScore: '',
    highlights: '',
    audience: 'parents and players',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [gamesRes, teamsRes] = await Promise.all([
        api.get('/games').catch(() => ({ data: [] })),
        api.get('/teams').catch(() => ({ data: [] })),
      ]);
      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : gamesRes.data.games || gamesRes.data.data || []);
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.teams || teamsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load games/teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTeam = (id) => teams.find((t) => (t.id || t._id) === id);
  const getTeamName = (id) => { const t = getTeam(id); return t ? t.name : 'TBD'; };

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const selectedGame = games.find((g) => String(g.id || g._id) === String(selectedGameId));

  const generate = async () => {
    if (!selectedGame) {
      toast.warning('Please select a game first');
      return;
    }
    setGenerating(true);
    setResult(null);
    setCopied(false);

    const homeTeamId = selectedGame.home_team_id || selectedGame.homeTeam;
    const awayTeamId = selectedGame.away_team_id || selectedGame.awayTeam;

    try {
      const res = await api.post('/ai/postgame-summary', {
        game: {
          ...selectedGame,
          home_score: form.homeScore ? Number(form.homeScore) : selectedGame.home_score,
          away_score: form.awayScore ? Number(form.awayScore) : selectedGame.away_score,
        },
        home_team: getTeam(homeTeamId) || { name: getTeamName(homeTeamId) },
        away_team: getTeam(awayTeamId) || { name: getTeamName(awayTeamId) },
        highlights: form.highlights ? form.highlights.split('\n').filter((s) => s.trim()) : undefined,
        audience: form.audience,
      });
      const aiResult = res.data;
      setResult(aiResult);
      setHistory((prev) => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        matchup: `${getTeamName(homeTeamId)} vs ${getTeamName(awayTeamId)}`,
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Postgame summary generated!');
    } catch (err) {
      if (err.response && err.response.status === 503) {
        toast.error('AI service unavailable. OPENROUTER_API_KEY is not configured on the backend.');
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to generate summary');
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => toast.error('Failed to copy'));
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaRegNewspaper style={{ marginRight: 10 }} /> AI Postgame Summary</h1>
          <p>Generate friendly, age-appropriate game recaps</p>
        </div>
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading...</span></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title"><FaRegNewspaper style={{ marginRight: 10 }} /> AI Postgame Summary</h1>
            <p>Generate friendly, age-appropriate game recaps</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={generate} disabled={generating || !selectedGameId}>
              {generating ? <><FaSpinner className="spin-animation" /> Generating...</> : <><FaRobot /> Generate Summary</>}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaFutbol style={{ color: '#10b981' }} /> Select Game
              </h3>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Game</label>
                <select className="form-control" value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
                  <option value="">Choose a game...</option>
                  {games.map((g) => {
                    const id = g.id || g._id;
                    const homeId = g.home_team_id || g.homeTeam;
                    const awayId = g.away_team_id || g.awayTeam;
                    const date = g.date ? new Date(g.date).toLocaleDateString() : '';
                    return (
                      <option key={id} value={id}>
                        {date ? `${date} — ` : ''}{getTeamName(homeId)} vs {getTeamName(awayId)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Home Score</label>
                  <input type="number" className="form-control" value={form.homeScore}
                    onChange={(e) => onChange('homeScore', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Away Score</label>
                  <input type="number" className="form-control" value={form.awayScore}
                    onChange={(e) => onChange('awayScore', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Audience</label>
                <select className="form-control" value={form.audience} onChange={(e) => onChange('audience', e.target.value)}>
                  <option value="parents and players">Parents & Players</option>
                  <option value="players">Players only</option>
                  <option value="parents">Parents only</option>
                  <option value="coaches">Coaches</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaTrophy style={{ color: '#f59e0b' }} /> Highlights & Notes
              </h3>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Key moments (one per line)</label>
                <textarea className="form-control" rows={6} value={form.highlights}
                  onChange={(e) => onChange('highlights', e.target.value)}
                  placeholder={'e.g.\n- Sarah scored a hat-trick in the first half\n- Defense held strong in OT\n- Team came back from 0-2 down'} />
              </div>
            </div>
          </div>
        </div>

        <div>
          {generating && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
                <FaSpinner className="spin-animation" style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Writing the recap...</h3>
              </div>
            </div>
          )}
          {result && !generating && (
            <div className="card" style={{ marginBottom: 16, borderTop: '4px solid #10b981' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <FaRobot style={{ color: '#10b981' }} /> Generated Summary
                  </h3>
                  <button className="btn btn-sm" onClick={copyToClipboard} style={{
                    background: copied ? '#dcfce7' : '#f3f4f6',
                    color: copied ? '#16a34a' : '#374151',
                    border: `1px solid ${copied ? '#bbf7d0' : '#e5e7eb'}`,
                    fontWeight: 600, fontSize: 12,
                  }}>
                    {copied ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy</>}
                  </button>
                </div>
                <AIResultDisplay result={result} />
              </div>
            </div>
          )}
          {!result && !generating && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 64 }}>
                <FaRegNewspaper style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
                <h3 style={{ color: '#6b7280', marginBottom: 8 }}>Ready to recap</h3>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>
                  Select a game, optionally add scores and highlights, and click Generate Summary.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaHistory style={{ color: '#10b981' }} /> Generation History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}>
                <FaTrash /> Clear
              </button>
            </div>
            {history.map((item) => (
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
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default AIPostgameSummary;
