// // === Batch 09 Gaps & Frontend Mounts ===
import React, { useState } from 'react';
import AIReport from '../../components/AIReport';
import NativeAIPresets from '../../components/NativeAIPresets';

export default function SpectatorExperienceOptimizationConcessionsSeatingPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const samplePrompts = ['Plan seating and snack flow for a Saturday U12 doubleheader with 150 spectators.', 'Improve accessible seating and concessions at a three-field weekend tournament.', 'Suggest queue management for a rainy evening match with limited covered space.'];
  const samplePresets = [{ label: 'League scenario' }, { label: 'Player scenario' }, { label: 'Event scenario' }];

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const r = await fetch('/api/custom/spectator-experience-optimization-concessions-seating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt: input })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (e) { setError(e.message || 'Error'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Spectator experience optimization (concessions, seating)</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>Generated gap feature for AIYouthSportsLeagueManager.</p>
      <NativeAIPresets presets={samplePresets} onSelect={index => setInput(samplePrompts[index])} />
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Describe what you need..."
        rows={6}
        style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 6, marginBottom: 12 }}
      />
      <button
        onClick={run}
        disabled={loading}
        style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        {loading ? 'Running...' : 'Run AI'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {result !== null && <AIReport response={result} title="AI analysis" />}
    </div>
  );
}
