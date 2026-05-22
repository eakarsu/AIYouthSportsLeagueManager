import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

function LeagueRulesEditor() {
  const [state, setState] = useState({ rules: {}, age_divisions: [] });
  const [loading, setLoading] = useState(true);
  const [newDiv, setNewDiv] = useState({ name: '', min_age: 0, max_age: 0, max_players: 12, game_length_min: 50 });

  const refresh = () => {
    setLoading(true);
    api.get('/custom-views/league-rules')
      .then((r) => setState(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const saveRules = async () => {
    try {
      await api.post('/custom-views/league-rules', { rules: state.rules });
      toast.success('Schedule & rules saved');
      refresh();
    } catch {
      toast.error('Save failed');
    }
  };

  const addDivision = async () => {
    if (!newDiv.name) return toast.warning('Division name required');
    await api.post('/custom-views/league-rules', { add_division: newDiv });
    setNewDiv({ name: '', min_age: 0, max_age: 0, max_players: 12, game_length_min: 50 });
    toast.success('Division added');
    refresh();
  };

  const updateDivision = async (d) => {
    await api.post('/custom-views/league-rules', { update_division: d });
    toast.success('Division updated');
    refresh();
  };

  const deleteDivision = async (id) => {
    if (!window.confirm('Delete this division?')) return;
    await api.post('/custom-views/league-rules', { delete_division_id: id });
    toast.success('Division removed');
    refresh();
  };

  if (loading) return <div style={{ padding: 16 }}>Loading league rules…</div>;

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>League Rules Editor</h3>

      <h4 style={{ fontSize: 14, color: '#374151' }}>Season Schedule</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Season Start</label>
          <input className="form-control" type="date"
            value={state.rules.season_start || ''}
            onChange={(e) => setState({ ...state, rules: { ...state.rules, season_start: e.target.value } })}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Season End</label>
          <input className="form-control" type="date"
            value={state.rules.season_end || ''}
            onChange={(e) => setState({ ...state, rules: { ...state.rules, season_end: e.target.value } })}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Practices/Week</label>
          <input className="form-control" type="number" min="0"
            value={state.rules.practices_per_week || 0}
            onChange={(e) => setState({ ...state, rules: { ...state.rules, practices_per_week: Number(e.target.value) } })}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Games/Week</label>
          <input className="form-control" type="number" min="0"
            value={state.rules.games_per_week || 0}
            onChange={(e) => setState({ ...state, rules: { ...state.rules, games_per_week: Number(e.target.value) } })}
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: '#6b7280' }}>Forfeit Rule</label>
        <textarea className="form-control" rows="2"
          value={state.rules.forfeit_rule || ''}
          onChange={(e) => setState({ ...state, rules: { ...state.rules, forfeit_rule: e.target.value } })}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: '#6b7280' }}>Weather Policy</label>
        <textarea className="form-control" rows="2"
          value={state.rules.weather_policy || ''}
          onChange={(e) => setState({ ...state, rules: { ...state.rules, weather_policy: e.target.value } })}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={saveRules}>Save Schedule & Rules</button>
      </div>

      <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />

      <h4 style={{ fontSize: 14, color: '#374151' }}>Age Divisions</h4>
      <table style={{ width: '100%', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Min Age</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Max Age</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Max Players</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Game Length (min)</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.age_divisions.map((d) => (
            <tr key={d.id}>
              <td style={{ padding: 6 }}><input className="form-control" defaultValue={d.name} onBlur={(e) => updateDivision({ ...d, name: e.target.value })} /></td>
              <td style={{ padding: 6 }}><input className="form-control" type="number" defaultValue={d.min_age} onBlur={(e) => updateDivision({ ...d, min_age: Number(e.target.value) })} /></td>
              <td style={{ padding: 6 }}><input className="form-control" type="number" defaultValue={d.max_age} onBlur={(e) => updateDivision({ ...d, max_age: Number(e.target.value) })} /></td>
              <td style={{ padding: 6 }}><input className="form-control" type="number" defaultValue={d.max_players} onBlur={(e) => updateDivision({ ...d, max_players: Number(e.target.value) })} /></td>
              <td style={{ padding: 6 }}><input className="form-control" type="number" defaultValue={d.game_length_min} onBlur={(e) => updateDivision({ ...d, game_length_min: Number(e.target.value) })} /></td>
              <td style={{ padding: 6, textAlign: 'center' }}>
                <button className="btn btn-danger btn-sm" onClick={() => deleteDivision(d.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Add New Division</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px 120px auto', gap: 8 }}>
          <input className="form-control" placeholder="Name (e.g. U16)" value={newDiv.name} onChange={(e) => setNewDiv({ ...newDiv, name: e.target.value })} />
          <input className="form-control" type="number" placeholder="Min" value={newDiv.min_age} onChange={(e) => setNewDiv({ ...newDiv, min_age: Number(e.target.value) })} />
          <input className="form-control" type="number" placeholder="Max" value={newDiv.max_age} onChange={(e) => setNewDiv({ ...newDiv, max_age: Number(e.target.value) })} />
          <input className="form-control" type="number" placeholder="Max players" value={newDiv.max_players} onChange={(e) => setNewDiv({ ...newDiv, max_players: Number(e.target.value) })} />
          <input className="form-control" type="number" placeholder="Game min" value={newDiv.game_length_min} onChange={(e) => setNewDiv({ ...newDiv, game_length_min: Number(e.target.value) })} />
          <button className="btn btn-primary" onClick={addDivision}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default LeagueRulesEditor;
