import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaMagic, FaRobot, FaSyncAlt, FaSpinner, FaHistory, FaTrash,
  FaEnvelope, FaCopy, FaSave, FaPaperPlane, FaUsers, FaBullhorn,
  FaCheckCircle, FaCloudSun, FaCalendarAlt, FaRegNewspaper,
  FaUserFriends, FaExclamationTriangle,
} from 'react-icons/fa';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const COMM_TYPES = [
  { key: 'welcome-letter', label: 'Welcome Letter', icon: <FaEnvelope />, color: '#6366f1', desc: 'Welcome new families to the league' },
  { key: 'schedule-update', label: 'Schedule Update', icon: <FaCalendarAlt />, color: '#3b82f6', desc: 'Notify about schedule changes' },
  { key: 'game-reminder', label: 'Game Reminder', icon: <FaBullhorn />, color: '#10b981', desc: 'Remind about upcoming games' },
  { key: 'season-summary', label: 'Season Summary', icon: <FaRegNewspaper />, color: '#f59e0b', desc: 'Summarize season highlights' },
  { key: 'weather-cancellation', label: 'Weather Cancellation', icon: <FaCloudSun />, color: '#ef4444', desc: 'Announce weather-related cancellations' },
  { key: 'registration-reminder', label: 'Registration Reminder', icon: <FaUserFriends />, color: '#8b5cf6', desc: 'Remind about registration deadlines' },
];

const TONES = [
  { key: 'formal', label: 'Formal', desc: 'Professional and official' },
  { key: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { key: 'urgent', label: 'Urgent', desc: 'Time-sensitive and important' },
];

function AICommunicationGenerator() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    type: 'welcome-letter',
    audience: 'all-parents',
    teamId: '',
    tone: 'friendly',
    keyPoints: '',
    subject: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams');
      setTeams(Array.isArray(res.data) ? res.data : res.data.teams || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedType = COMM_TYPES.find(t => t.key === form.type);

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const generateCommunication = async () => {
    if (!form.keyPoints.trim()) {
      toast.warning('Please enter at least some key points for the communication');
      return;
    }
    setGenerating(true);
    setResult(null);
    setCopied(false);

    const teamData = form.teamId ? teams.find(t => (t.id || t._id) === form.teamId) : null;

    try {
      const res = await api.post('/ai/communication-generator', {
        type: form.type,
        audience: form.audience,
        tone: form.tone,
        keyPoints: form.keyPoints,
        subject: form.subject,
        teamData,
      });
      const aiResult = res.data.result || res.data.analysis || res.data.message || JSON.stringify(res.data);
      setResult(aiResult);
      setHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        type: form.type,
        tone: form.tone,
        audience: form.audience === 'all-parents' ? 'All Parents' : (teamData ? teamData.name : 'Specific Team'),
        result: aiResult,
      }, ...prev].slice(0, 10));
      toast.success('Communication generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate communication');
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
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const saveToCommunications = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      await api.post('/communications', {
        subject: form.subject || `${selectedType?.label || 'Communication'} - ${new Date().toLocaleDateString()}`,
        body: text,
        type: form.type,
        audience: form.audience,
        status: 'draft',
      });
      toast.success('Saved to communications as draft!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save communication');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title"><FaMagic style={{ marginRight: 10 }} /> AI Communication Generator</h1>
          <p>Auto-generate emails, announcements, and reports</p>
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
            <h1 className="page-title"><FaMagic style={{ marginRight: 10 }} /> AI Communication Generator</h1>
            <p>Auto-generate emails, announcements, and reports</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
              <FaHistory /> History {history.length > 0 && `(${history.length})`}
            </button>
            <button className="btn btn-primary" onClick={generateCommunication} disabled={generating}>
              {generating ? <><FaSpinner className="spin-animation" /> Generating...</> : <><FaRobot /> Generate Communication</>}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Form */}
        <div>
          {/* Communication Type */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaEnvelope style={{ color: '#6366f1' }} /> Communication Type
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {COMM_TYPES.map(ct => (
                  <div key={ct.key} onClick={() => onChange('type', ct.key)} style={{
                    padding: 14, borderRadius: 10, cursor: 'pointer',
                    background: form.type === ct.key ? `${ct.color}10` : '#f9fafb',
                    border: `2px solid ${form.type === ct.key ? ct.color : '#e5e7eb'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: ct.color, fontSize: 16 }}>{ct.icon}</span>
                      <span style={{
                        fontWeight: 700, fontSize: 13,
                        color: form.type === ct.key ? ct.color : '#374151',
                      }}>{ct.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{ct.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audience & Tone */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUsers style={{ color: '#3b82f6' }} /> Audience & Tone
              </h3>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Recipient Audience</label>
                <select className="form-control" value={form.audience} onChange={e => onChange('audience', e.target.value)}>
                  <option value="all-parents">All Parents & Families</option>
                  <option value="specific-team">Specific Team</option>
                  <option value="coaches">Coaches Only</option>
                  <option value="referees">Referees</option>
                  <option value="volunteers">Volunteers</option>
                </select>
              </div>

              {form.audience === 'specific-team' && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Select Team</label>
                  <select className="form-control" value={form.teamId} onChange={e => onChange('teamId', e.target.value)}>
                    <option value="">Choose a team...</option>
                    {teams.map(t => (
                      <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 8 }}>Tone</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TONES.map(tone => (
                  <button key={tone.key} onClick={() => onChange('tone', tone.key)} style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8, border: '2px solid',
                    borderColor: form.tone === tone.key ? '#6366f1' : '#e5e7eb',
                    background: form.tone === tone.key ? '#eef2ff' : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{
                      fontWeight: 700, fontSize: 13,
                      color: form.tone === tone.key ? '#6366f1' : '#374151',
                    }}>{tone.label}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{tone.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Details */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaPaperPlane style={{ color: '#10b981' }} /> Content Details
              </h3>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>Subject Line (optional)</label>
                <input
                  className="form-control"
                  placeholder="e.g., Welcome to the 2026 Spring Season!"
                  value={form.subject}
                  onChange={e => onChange('subject', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  Key Points <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder={"Enter the main points to include in the communication...\n\nFor example:\n- Season starts March 15\n- Games every Saturday at 10am\n- Bring water and shin guards\n- Volunteer signup needed"}
                  value={form.keyPoints}
                  onChange={e => onChange('keyPoints', e.target.value)}
                  style={{ resize: 'vertical', minHeight: 120 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    Tip: Be specific with dates, times, and details
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {form.keyPoints.length} characters
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Results */}
        <div>
          {/* Current Config Summary */}
          <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${selectedType?.color || '#6366f1'}` }}>
            <div className="card-body" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, color: selectedType?.color }}>{selectedType?.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedType?.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {TONES.find(t => t.key === form.tone)?.label} tone |{' '}
                    {form.audience === 'all-parents' ? 'All Parents' :
                     form.audience === 'specific-team' ? (teams.find(t => (t.id || t._id) === form.teamId)?.name || 'Select team') :
                     form.audience}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading */}
          {generating && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <FaMagic style={{ fontSize: 48, color: '#6366f1', animation: 'pulse 1.5s infinite' }} />
                  <FaSyncAlt style={{
                    fontSize: 20, color: '#8b5cf6', position: 'absolute', top: -8, right: -12,
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>
                <h3 style={{ color: '#1f2937', marginBottom: 8 }}>Crafting Your Communication...</h3>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                  Writing a {form.tone} {selectedType?.label?.toLowerCase()} for {form.audience === 'all-parents' ? 'all parents' : 'your audience'}
                </p>
                <div style={{ maxWidth: 300, margin: '16px auto', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: `linear-gradient(90deg, ${selectedType?.color || '#6366f1'}, #8b5cf6)`, borderRadius: 2, animation: 'loading-bar 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !generating && (
            <div className="card" style={{ marginBottom: 16, borderTop: `4px solid ${selectedType?.color || '#6366f1'}` }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <FaRobot style={{ color: selectedType?.color || '#6366f1' }} /> Generated Communication
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm"
                      onClick={copyToClipboard}
                      style={{
                        background: copied ? '#dcfce7' : '#f3f4f6',
                        color: copied ? '#16a34a' : '#374151',
                        border: `1px solid ${copied ? '#bbf7d0' : '#e5e7eb'}`,
                        fontWeight: 600, fontSize: 12,
                      }}
                    >
                      {copied ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy</>}
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={saveToCommunications}
                      disabled={saving}
                      style={{
                        background: '#eef2ff', color: '#6366f1',
                        border: '1px solid #c7d2fe', fontWeight: 600, fontSize: 12,
                      }}
                    >
                      {saving ? <><FaSpinner className="spin-animation" /> Saving...</> : <><FaSave /> Save as Draft</>}
                    </button>
                  </div>
                </div>
                <AIResultDisplay result={result} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && !generating && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 64 }}>
                <FaMagic style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
                <h3 style={{ color: '#6b7280', marginBottom: 8 }}>Ready to Generate</h3>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>
                  Fill in the details on the left and click "Generate Communication" to create AI-powered content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaHistory style={{ color: '#6366f1' }} /> Generation History
              </h3>
              <button className="btn btn-sm" onClick={() => setHistory([])} style={{ color: '#ef4444', fontSize: 12 }}><FaTrash /> Clear</button>
            </div>
            {history.map(item => {
              const ct = COMM_TYPES.find(c => c.key === item.type);
              return (
                <div key={item.id} style={{
                  padding: 12, borderRadius: 8, background: '#f9fafb', marginBottom: 8, cursor: 'pointer',
                }} onClick={() => { setResult(item.result); setShowHistory(false); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: ct?.color || '#6b7280' }}>{ct?.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{ct?.label || item.type}</span>
                      <span style={{
                        padding: '1px 8px', borderRadius: 8, background: '#eef2ff',
                        color: '#6366f1', fontSize: 11, fontWeight: 600,
                      }}>{item.tone}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{item.audience}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{item.timestamp}</span>
                  </div>
                </div>
              );
            })}
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

export default AICommunicationGenerator;
