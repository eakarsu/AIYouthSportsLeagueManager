import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaShieldAlt, FaRobot, FaSpinner, FaHistory, FaTrash,
  FaUser, FaExclamationTriangle, FaCopy, FaCheckCircle,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AIInjuryRisk() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [form, setForm] = useState({
    gamesLastWeek: '',
    minutesLastWeek: '',
    practicesPerWeek: '',
    pastInjuries: '',
    currentSymptoms: '',
    intensity: 'moderate',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/players').catch(() => ({ data: [] }));
      setPlayers(Array.isArray(res.data) ? res.data : res.data.players || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const selectedPlayer = players.find((p) => String(p.id || p._id) === String(selectedPlayerId));

  const analyze = async () => {
    if (!selectedPlayer) {
      toast.warning('Please select a player first');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setCopied(false);

    try {
      const trainingLoad = {
        games_last_week: form.gamesLastWeek ? Number(form.gamesLastWeek) : undefined,
        minutes_last_week: form.minutesLastWeek ? Number(form.minutesLastWeek) : undefined,
        practices_per_week: form.practicesPerWeek ? Number(form.practicesPerWeek) : undefined,
        avg_intensity: form.intensity,
      };
      const res = await api.post('/ai/injury-risk', {
        player: selectedPlayer,
        training_load: trainingLoad,
        recent_games: form.pastInjuries
          ? [{ note: 'past injuries', detail: form.pastInjuries }]
          : undefined,
        season_context: form.currentSymptoms ? { current_symptoms: form.currentSymptoms } : undefined,
      });
      const aiResult = res.data;
      setResult(aiResult);
      setHistory((prev) => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        playerName: selectedPlayer.name || `${selectedPlayer.first_name || ''} ${selectedPlayer.last_name || ''}`.trim() || 'Player',
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Risk assessment generated!');
    } catch (err) {
      if (err.response && err.response.status === 503) {
        toast.error('AI service unavailable. OPENROUTER_API_KEY is not configured on the backend.');
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to analyze');
      }
    } finally {
      setAnalyzing(false);
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
          <h1 className="page-title"><FaShieldAlt style={{ marginRight: 10 }} /> AI Injury Risk</h1>
          <p>Conservative injury risk insights — informational only, not medical advice</p>
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
            <h1 className="page-title"><FaShieldAlt style={{ marginRight: 10 }} /> AI Injury Risk</h1>
            <p>Conservative injury risk insights — informational only, not medical advice</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={analyze} disabled={analyzing || !selectedPlayerId}>
              {analyzing ? <><FaSpinner className="spin-animation" /> Analyzing...</> : <><FaRobot /> Analyze Risk</>}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #f59e0b' }}>
        <div className="card-body" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaExclamationTriangle style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 13, color: '#92400e' }}>
            This tool produces informational insights only. It is <strong>not medical advice</strong>. Always consult a qualified medical professional for any injury concerns.
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUser style={{ color: '#6366f1' }} /> Select Player
              </h3>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Player</label>
                <select className="form-control" value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}>
                  <option value="">Choose a player...</option>
                  {players.map((p) => {
                    const id = p.id || p._id;
                    const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player ${id}`;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Training Load & Context
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Games last week</label>
                  <input type="number" min="0" className="form-control" value={form.gamesLastWeek}
                    onChange={(e) => onChange('gamesLastWeek', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Minutes last week</label>
                  <input type="number" min="0" className="form-control" value={form.minutesLastWeek}
                    onChange={(e) => onChange('minutesLastWeek', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Practices per week</label>
                  <input type="number" min="0" className="form-control" value={form.practicesPerWeek}
                    onChange={(e) => onChange('practicesPerWeek', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Avg intensity</label>
                  <select className="form-control" value={form.intensity}
                    onChange={(e) => onChange('intensity', e.target.value)}>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Past injuries (free text)</label>
                <textarea className="form-control" rows={2} value={form.pastInjuries}
                  onChange={(e) => onChange('pastInjuries', e.target.value)}
                  placeholder="e.g. ankle sprain 2 months ago, fully recovered" />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>Current symptoms (free text)</label>
                <textarea className="form-control" rows={2} value={form.currentSymptoms}
                  onChange={(e) => onChange('currentSymptoms', e.target.value)}
                  placeholder="e.g. mild knee soreness after games" />
              </div>
            </div>
          </div>
        </div>

        <div>
          {analyzing && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
                <FaSpinner className="spin-animation" style={{ fontSize: 48, color: '#6366f1', marginBottom: 16 }} />
                <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Analyzing risk factors...</h3>
              </div>
            </div>
          )}
          {result && !analyzing && (
            <div className="card" style={{ marginBottom: 16, borderTop: '4px solid #6366f1' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <FaRobot style={{ color: '#6366f1' }} /> Risk Assessment
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
          {!result && !analyzing && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 64 }}>
                <FaShieldAlt style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
                <h3 style={{ color: '#6b7280', marginBottom: 8 }}>Ready to analyze</h3>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>
                  Select a player and provide recent training context, then click Analyze Risk.
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
                <FaHistory style={{ color: '#6366f1' }} /> Analysis History
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
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{item.playerName}</span>
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

export default AIInjuryRisk;
