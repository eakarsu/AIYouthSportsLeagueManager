import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaTrophy, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort,
  FaFutbol, FaChartBar, FaMedal
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const emptyForm = {
  team_id: '', season_id: '', wins: 0, losses: 0, draws: 0,
  goals_for: 0, goals_against: 0,
};

function Standings() {
  const [standings, setStandings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeason, setFilterSeason] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStandings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/standings');
      setStandings(Array.isArray(res.data) ? res.data : res.data.standings || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load standings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await api.get('/teams');
      setTeams(Array.isArray(res.data) ? res.data : res.data.teams || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await api.get('/seasons');
      setSeasons(Array.isArray(res.data) ? res.data : res.data.seasons || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  useEffect(() => { fetchStandings(); fetchTeams(); fetchSeasons(); }, [fetchStandings, fetchTeams, fetchSeasons]);

  const getTeamName = (id) => {
    const t = teams.find(t => (t.id || t._id) === id);
    return t ? t.name : (id || '—');
  };

  const getSeasonName = (id) => {
    const s = seasons.find(s => (s.id || s._id) === id);
    return s ? s.name : (id || '—');
  };

  const calcPoints = (w, d) => (w * 3) + (d * 1);
  const calcGD = (gf, ga) => gf - ga;
  const calcGamesPlayed = (w, l, d) => w + l + d;

  const enriched = standings.map(s => ({
    ...s,
    points: s.points != null ? s.points : calcPoints(s.wins || 0, s.draws || 0),
    goal_difference: s.goal_difference != null ? s.goal_difference : calcGD(s.goals_for || 0, s.goals_against || 0),
    games_played: s.games_played != null ? s.games_played : calcGamesPlayed(s.wins || 0, s.losses || 0, s.draws || 0),
    team_name: s.team_name || getTeamName(s.team_id),
    season_name: s.season_name || getSeasonName(s.season_id),
  }));

  const filtered = enriched
    .filter(s => {
      const term = search.toLowerCase();
      const matchSearch = (s.team_name || '').toLowerCase().includes(term)
        || (s.season_name || '').toLowerCase().includes(term);
      const matchSeason = !filterSeason || s.season_id === filterSeason;
      return matchSearch && matchSeason;
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
      return (a.team_name || '').localeCompare(b.team_name || '');
    });

  const rankBorder = (rank) => {
    if (rank === 1) return '4px solid #f59e0b'; // gold
    if (rank === 2) return '4px solid #9ca3af'; // silver
    if (rank === 3) return '4px solid #cd7f32'; // bronze
    return '4px solid transparent';
  };

  const rankIcon = (rank) => {
    if (rank === 1) return <FaMedal style={{ color: '#f59e0b', fontSize: 16 }} />;
    if (rank === 2) return <FaMedal style={{ color: '#9ca3af', fontSize: 16 }} />;
    if (rank === 3) return <FaMedal style={{ color: '#cd7f32', fontSize: 16 }} />;
    return <span style={{ fontWeight: 600, color: '#6b7280' }}>{rank}</span>;
  };

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (s) => { setSelected(s); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      team_id: selected.team_id || '',
      season_id: selected.season_id || '',
      wins: selected.wins || 0,
      losses: selected.losses || 0,
      draws: selected.draws || 0,
      goals_for: selected.goals_for || 0,
      goals_against: selected.goals_against || 0,
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.team_id) { toast.warning('Team is required'); return; }
    setSaving(true);
    try {
      const w = Number(form.wins) || 0;
      const l = Number(form.losses) || 0;
      const d = Number(form.draws) || 0;
      const gf = Number(form.goals_for) || 0;
      const ga = Number(form.goals_against) || 0;
      const payload = {
        ...form,
        wins: w, losses: l, draws: d,
        goals_for: gf, goals_against: ga,
        points: calcPoints(w, d),
        goal_difference: calcGD(gf, ga),
        games_played: calcGamesPlayed(w, l, d),
      };
      if (editing && selected) {
        await api.put(`/standings/${selected.id || selected._id}`, payload);
        toast.success('Standing updated successfully');
      } else {
        await api.post('/standings', payload);
        toast.success('Standing created successfully');
      }
      setShowForm(false);
      fetchStandings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save standing');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this standing entry? This cannot be undone.`)) return;
    try {
      await api.delete(`/standings/${selected.id || selected._id}`);
      toast.success('Standing deleted');
      setShowDetail(false);
      fetchStandings();
    } catch (err) {
      toast.error('Failed to delete standing');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const formPoints = calcPoints(Number(form.wins) || 0, Number(form.draws) || 0);
  const formGD = calcGD(Number(form.goals_for) || 0, Number(form.goals_against) || 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Standings</h1>
            <p>View league standings and team rankings</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Entry</button>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input" style={{ flex: 1 }}>
          <FaSearch className="search-icon" />
          <input placeholder="Search by team name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {seasons.length > 0 && (
          <select className="form-control" value={filterSeason} onChange={e => setFilterSeason(e.target.value)}
            style={{ width: 'auto', minWidth: 180 }}>
            <option value="">All Seasons</option>
            {seasons.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading standings...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaTrophy /></div>
          <h3>{search || filterSeason ? 'No standings match your filters' : 'No Standings Yet'}</h3>
          <p>{search || filterSeason ? 'Try different filters' : 'Add your first standings entry to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>#</th>
                <th>Team</th>
                <th style={{ textAlign: 'center', width: 50 }}>W</th>
                <th style={{ textAlign: 'center', width: 50 }}>L</th>
                <th style={{ textAlign: 'center', width: 50 }}>D</th>
                <th style={{ textAlign: 'center', width: 60, fontWeight: 700 }}>Pts</th>
                <th style={{ textAlign: 'center', width: 50 }}>GF</th>
                <th style={{ textAlign: 'center', width: 50 }}>GA</th>
                <th style={{ textAlign: 'center', width: 50 }}>GD</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={s.id || s._id} onClick={() => openDetail(s)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: rankBorder(rank),
                      background: rank <= 3 ? (rank === 1 ? '#fffbeb' : rank === 2 ? '#f9fafb' : '#fef3e2') : undefined,
                    }}>
                    <td style={{ textAlign: 'center' }}>{rankIcon(rank)}</td>
                    <td style={{ fontWeight: 700, fontSize: 14 }}>{s.team_name}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#22c55e' }}>{s.wins || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#ef4444' }}>{s.losses || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>{s.draws || 0}</td>
                    <td style={{
                      textAlign: 'center', fontWeight: 800, fontSize: 16,
                      color: rank === 1 ? '#f59e0b' : '#111827'
                    }}>
                      {s.points}
                    </td>
                    <td style={{ textAlign: 'center' }}>{s.goals_for || 0}</td>
                    <td style={{ textAlign: 'center' }}>{s.goals_against || 0}</td>
                    <td style={{
                      textAlign: 'center', fontWeight: 600,
                      color: s.goal_difference > 0 ? '#22c55e' : s.goal_difference < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Standing' : 'Add Standing Entry'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Team *</label>
              <select className="form-control" value={form.team_id} onChange={e => onChange('team_id', e.target.value)} required>
                <option value="">Select team</option>
                {teams.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Season</label>
              <select className="form-control" value={form.season_id} onChange={e => onChange('season_id', e.target.value)}>
                <option value="">Select season</option>
                {seasons.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />
          <h4 style={{ fontSize: 14, marginBottom: 12, color: '#374151' }}>Match Results</h4>

          <div className="form-row">
            <div className="form-group">
              <label>Wins</label>
              <input className="form-control" type="number" min="0" value={form.wins} onChange={e => onChange('wins', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Losses</label>
              <input className="form-control" type="number" min="0" value={form.losses} onChange={e => onChange('losses', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Draws</label>
              <input className="form-control" type="number" min="0" value={form.draws} onChange={e => onChange('draws', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Goals For</label>
              <input className="form-control" type="number" min="0" value={form.goals_for} onChange={e => onChange('goals_for', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Goals Against</label>
              <input className="form-control" type="number" min="0" value={form.goals_against} onChange={e => onChange('goals_against', e.target.value)} />
            </div>
          </div>

          {/* Auto-calculated preview */}
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16, marginTop: 8,
            display: 'flex', justifyContent: 'space-around', textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Points</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0369a1' }}>{formPoints}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>W x3 + D x1</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Goal Diff</div>
              <div style={{
                fontSize: 24, fontWeight: 800,
                color: formGD > 0 ? '#22c55e' : formGD < 0 ? '#ef4444' : '#6b7280'
              }}>
                {formGD > 0 ? '+' : ''}{formGD}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>GF - GA</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Games</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#374151' }}>
                {(Number(form.wins) || 0) + (Number(form.losses) || 0) + (Number(form.draws) || 0)}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>W + L + D</div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Standing' : 'Create Standing')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Team Standing Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            {/* Team Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <FaTrophy style={{ fontSize: 40, color: '#f59e0b', marginBottom: 8 }} />
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{selected.team_name}</h3>
              {selected.season_name && <p style={{ color: '#6b7280', marginTop: 4 }}>{selected.season_name}</p>}
            </div>

            {/* Stats Cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24
            }}>
              <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Points</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0369a1' }}>{selected.points}</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Wins</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>{selected.wins || 0}</div>
              </div>
              <div style={{ background: '#fef2f2', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Losses</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{selected.losses || 0}</div>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Draws</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#6b7280' }}>{selected.draws || 0}</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaFutbol /> Goal Statistics</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Goals For</label><p style={{ fontWeight: 700, fontSize: 20, color: '#22c55e' }}>{selected.goals_for || 0}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Goals Against</label><p style={{ fontWeight: 700, fontSize: 20, color: '#ef4444' }}>{selected.goals_against || 0}</p></div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Goal Difference</label>
                    <p style={{
                      fontWeight: 700, fontSize: 20,
                      color: selected.goal_difference > 0 ? '#22c55e' : selected.goal_difference < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {selected.goal_difference > 0 ? '+' : ''}{selected.goal_difference}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaChartBar /> Performance</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Games Played</label>
                    <p style={{ fontWeight: 600 }}>{selected.games_played}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Win Rate</label>
                    <p style={{ fontWeight: 600 }}>
                      {selected.games_played > 0
                        ? `${Math.round(((selected.wins || 0) / selected.games_played) * 100)}%`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Avg Goals/Game</label>
                    <p style={{ fontWeight: 600 }}>
                      {selected.games_played > 0
                        ? ((selected.goals_for || 0) / selected.games_played).toFixed(1)
                        : '—'}
                    </p>
                  </div>
                </div>
                {selected.games_played > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Win / Draw / Loss Ratio</label>
                    <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden' }}>
                      {selected.wins > 0 && (
                        <div style={{
                          width: `${((selected.wins || 0) / selected.games_played) * 100}%`,
                          background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700
                        }}>
                          {selected.wins}W
                        </div>
                      )}
                      {selected.draws > 0 && (
                        <div style={{
                          width: `${((selected.draws || 0) / selected.games_played) * 100}%`,
                          background: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700
                        }}>
                          {selected.draws}D
                        </div>
                      )}
                      {selected.losses > 0 && (
                        <div style={{
                          width: `${((selected.losses || 0) / selected.games_played) * 100}%`,
                          background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700
                        }}>
                          {selected.losses}L
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Standings;
