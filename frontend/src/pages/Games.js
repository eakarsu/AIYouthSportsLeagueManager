import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort, FaFutbol, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const GAME_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'];

const emptyForm = {
  home_team_id: '', away_team_id: '', facility_id: '', game_date: '', game_time: '',
  duration_minutes: 60, status: 'scheduled', home_score: '', away_score: '',
  referee_id: '', notes: '',
};

function Games() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('game_date');
  const [sortDir, setSortDir] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/games');
      setGames(Array.isArray(res.data) ? res.data : res.data.games || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load games');
    } finally { setLoading(false); }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await api.get('/teams');
      setTeams(Array.isArray(res.data) ? res.data : res.data.teams || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await api.get('/facilities');
      setFacilities(Array.isArray(res.data) ? res.data : res.data.facilities || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  const fetchReferees = useCallback(async () => {
    try {
      const res = await api.get('/referees');
      setReferees(Array.isArray(res.data) ? res.data : res.data.referees || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  useEffect(() => { fetchGames(); fetchTeams(); fetchFacilities(); fetchReferees(); }, [fetchGames, fetchTeams, fetchFacilities, fetchReferees]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const getTeamName = (id) => {
    const t = teams.find(t => (t.id || t._id) === id);
    return t ? t.name : '—';
  };

  const getFacilityName = (id) => {
    const f = facilities.find(f => (f.id || f._id) === id);
    return f ? f.name : '—';
  };

  const getRefereeName = (id) => {
    const r = referees.find(r => (r.id || r._id) === id);
    return r ? `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.name || '—' : '—';
  };

  const statusBadgeClass = (status) => {
    const map = {
      scheduled: 'badge-info', in_progress: 'badge-success', completed: 'badge-neutral',
      cancelled: 'badge-danger', postponed: 'badge-warning',
    };
    return map[status] || 'badge-neutral';
  };

  const statusLabel = (status) => {
    const map = { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled', postponed: 'Postponed' };
    return map[status] || status;
  };

  const filtered = games
    .filter(g => {
      const term = search.toLowerCase();
      const home = getTeamName(g.home_team_id).toLowerCase();
      const away = getTeamName(g.away_team_id).toLowerCase();
      const facility = getFacilityName(g.facility_id).toLowerCase();
      return home.includes(term) || away.includes(term) || facility.includes(term)
        || (g.status || '').toLowerCase().includes(term)
        || (g.game_date || '').includes(term);
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (g) => { setSelected(g); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      home_team_id: selected.home_team_id || '', away_team_id: selected.away_team_id || '',
      facility_id: selected.facility_id || '',
      game_date: selected.game_date ? selected.game_date.substring(0, 10) : '',
      game_time: selected.game_time || '', duration_minutes: selected.duration_minutes || 60,
      status: selected.status || 'scheduled',
      home_score: selected.home_score ?? '', away_score: selected.away_score ?? '',
      referee_id: selected.referee_id || '', notes: selected.notes || '',
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.home_team_id || !form.away_team_id) { toast.warning('Both teams are required'); return; }
    if (form.home_team_id === form.away_team_id) { toast.warning('Home and away teams must be different'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        home_score: form.home_score !== '' ? Number(form.home_score) : undefined,
        away_score: form.away_score !== '' ? Number(form.away_score) : undefined,
      };
      if (editing && selected) {
        await api.put(`/games/${selected.id || selected._id}`, payload);
        toast.success('Game updated successfully');
      } else {
        await api.post('/games', payload);
        toast.success('Game created successfully');
      }
      setShowForm(false);
      fetchGames();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save game');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this game? This cannot be undone.')) return;
    try {
      await api.delete(`/games/${selected.id || selected._id}`);
      toast.success('Game deleted');
      setShowDetail(false);
      fetchGames();
    } catch (err) {
      toast.error('Failed to delete game');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Games</h1>
            <p>Schedule and manage game results and scores</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Game</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search games by team, facility, date, status..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading games...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaCalendarAlt /></div>
          <h3>{search ? 'No games match your search' : 'No Games Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Schedule your first game to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('game_date')} style={{ cursor: 'pointer' }}>Date <SortIcon field="game_date" /></th>
                <th>Time</th>
                <th>Match</th>
                <th>Facility</th>
                <th>Score</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id || g._id} onClick={() => openDetail(g)} style={{ cursor: 'pointer' }}>
                  <td>{formatDate(g.game_date)}</td>
                  <td>{g.game_time || '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {getTeamName(g.home_team_id)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>vs</span> {getTeamName(g.away_team_id)}
                  </td>
                  <td>{getFacilityName(g.facility_id)}</td>
                  <td>
                    {g.status === 'completed' || g.status === 'in_progress'
                      ? <span style={{ fontWeight: 700 }}>{g.home_score ?? 0} - {g.away_score ?? 0}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>
                    }
                  </td>
                  <td><span className={`badge ${statusBadgeClass(g.status)}`}>{statusLabel(g.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Game' : 'Schedule New Game'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Home Team *</label>
              <select className="form-control" value={form.home_team_id} onChange={e => onChange('home_team_id', e.target.value)} required>
                <option value="">Select home team</option>
                {teams.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Away Team *</label>
              <select className="form-control" value={form.away_team_id} onChange={e => onChange('away_team_id', e.target.value)} required>
                <option value="">Select away team</option>
                {teams.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Game Date</label>
              <input className="form-control" type="date" value={form.game_date} onChange={e => onChange('game_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Game Time</label>
              <input className="form-control" type="time" value={form.game_time} onChange={e => onChange('game_time', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Facility</label>
              <select className="form-control" value={form.facility_id} onChange={e => onChange('facility_id', e.target.value)}>
                <option value="">Select facility</option>
                {facilities.map(f => <option key={f.id || f._id} value={f.id || f._id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input className="form-control" type="number" min="1" value={form.duration_minutes} onChange={e => onChange('duration_minutes', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => onChange('status', e.target.value)}>
                {GAME_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Referee</label>
              <select className="form-control" value={form.referee_id} onChange={e => onChange('referee_id', e.target.value)}>
                <option value="">Select referee</option>
                {referees.map(r => <option key={r.id || r._id} value={r.id || r._id}>{r.first_name || r.name} {r.last_name || ''}</option>)}
              </select>
            </div>
          </div>
          {(form.status === 'completed' || form.status === 'in_progress') && (
            <div className="form-row">
              <div className="form-group">
                <label>Home Score</label>
                <input className="form-control" type="number" min="0" value={form.home_score} onChange={e => onChange('home_score', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Away Score</label>
                <input className="form-control" type="number" min="0" value={form.away_score} onChange={e => onChange('away_score', e.target.value)} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" value={form.notes} onChange={e => onChange('notes', e.target.value)} placeholder="Game notes, weather conditions, etc." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Game' : 'Schedule Game')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Game Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            {/* Score display for completed/in-progress */}
            {(selected.status === 'completed' || selected.status === 'in_progress') && (
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>{getTeamName(selected.home_team_id)}</p>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>HOME</span>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: 4, minWidth: 100, textAlign: 'center' }}>
                    {selected.home_score ?? 0} - {selected.away_score ?? 0}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>{getTeamName(selected.away_team_id)}</p>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>AWAY</span>
                  </div>
                </div>
                <span className={`badge ${statusBadgeClass(selected.status)}`} style={{ marginTop: 12 }}>{statusLabel(selected.status)}</span>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaFutbol /> Match Info</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Home Team</label><p style={{ fontWeight: 600 }}>{getTeamName(selected.home_team_id)}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Away Team</label><p style={{ fontWeight: 600 }}>{getTeamName(selected.away_team_id)}</p></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Status</label>
                  <p><span className={`badge ${statusBadgeClass(selected.status)}`}>{statusLabel(selected.status)}</span></p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaClock /> Schedule</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Date</label><p>{formatDate(selected.game_date)}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Time</label><p>{selected.game_time || '—'}</p></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={{ fontSize: 11, color: '#9ca3af' }}>Duration</label><p>{selected.duration_minutes ? `${selected.duration_minutes} minutes` : '—'}</p></div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaMapMarkerAlt /> Venue & Officials</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Facility</label><p>{getFacilityName(selected.facility_id)}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Referee</label><p>{getRefereeName(selected.referee_id)}</p></div>
                </div>
              </div>
            </div>

            {selected.notes && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Notes</h4>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                  <p>{selected.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Games;
