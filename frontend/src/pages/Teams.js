import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaFutbol, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort, FaUsers } from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const emptyForm = {
  name: '', division: '', age_group: '', head_coach: '', assistant_coach: '',
  max_players: '', home_facility_id: '', season_id: '',
};

function Teams() {
  const [teams, setTeams] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams');
      setTeams(Array.isArray(res.data) ? res.data : res.data.teams || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load teams');
    } finally { setLoading(false); }
  }, []);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await api.get('/facilities');
      setFacilities(Array.isArray(res.data) ? res.data : res.data.facilities || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  const fetchSeasons = useCallback(async () => {
    try {
      const res = await api.get('/seasons');
      setSeasons(Array.isArray(res.data) ? res.data : res.data.seasons || res.data.data || []);
    } catch { /* optional */ }
  }, []);

  useEffect(() => { fetchTeams(); fetchFacilities(); fetchSeasons(); }, [fetchTeams, fetchFacilities, fetchSeasons]);

  const fetchRoster = async (teamId) => {
    setRosterLoading(true);
    try {
      const res = await api.get(`/players?team_id=${teamId}`);
      setRoster(Array.isArray(res.data) ? res.data : res.data.players || res.data.data || []);
    } catch {
      setRoster([]);
    } finally { setRosterLoading(false); }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filtered = teams
    .filter(t => {
      const term = search.toLowerCase();
      return (t.name || '').toLowerCase().includes(term)
        || (t.division || '').toLowerCase().includes(term)
        || (t.age_group || '').toLowerCase().includes(term)
        || (t.head_coach || '').toLowerCase().includes(term);
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

  const getFacilityName = (id) => {
    const f = facilities.find(f => f.id === id || f._id === id);
    return f ? f.name : '—';
  };

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (t) => {
    setSelected(t);
    setShowDetail(true);
    fetchRoster(t.id || t._id);
  };
  const openEdit = () => {
    setForm({
      name: selected.name || '', division: selected.division || '', age_group: selected.age_group || '',
      head_coach: selected.head_coach || '', assistant_coach: selected.assistant_coach || '',
      max_players: selected.max_players || '', home_facility_id: selected.home_facility_id || '',
      season_id: selected.season_id || '',
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.warning('Team name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, max_players: form.max_players ? Number(form.max_players) : undefined };
      if (editing && selected) {
        await api.put(`/teams/${selected.id || selected._id}`, payload);
        toast.success('Team updated successfully');
      } else {
        await api.post('/teams', payload);
        toast.success('Team created successfully');
      }
      setShowForm(false);
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save team');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete team "${selected.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/teams/${selected.id || selected._id}`);
      toast.success('Team deleted');
      setShowDetail(false);
      fetchTeams();
    } catch (err) {
      toast.error('Failed to delete team');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Teams</h1>
            <p>Organize teams, rosters, and coaching assignments</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Team</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search teams by name, division, coach..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading teams...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaFutbol /></div>
          <h3>{search ? 'No teams match your search' : 'No Teams Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Create your first team to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name <SortIcon field="name" /></th>
                <th onClick={() => handleSort('division')} style={{ cursor: 'pointer' }}>Division <SortIcon field="division" /></th>
                <th onClick={() => handleSort('age_group')} style={{ cursor: 'pointer' }}>Age Group <SortIcon field="age_group" /></th>
                <th onClick={() => handleSort('head_coach')} style={{ cursor: 'pointer' }}>Coach <SortIcon field="head_coach" /></th>
                <th>Players</th>
                <th>Facility</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id || t._id} onClick={() => openDetail(t)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td>{t.division || '—'}</td>
                  <td>{t.age_group || '—'}</td>
                  <td>{t.head_coach || '—'}</td>
                  <td><span className="badge badge-info">{t.players_count ?? t.player_count ?? '—'}</span></td>
                  <td>{getFacilityName(t.home_facility_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Team' : 'Add New Team'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Team Name *</label>
            <input className="form-control" value={form.name} onChange={e => onChange('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Division</label>
              <input className="form-control" value={form.division} onChange={e => onChange('division', e.target.value)} placeholder="e.g., Division A" />
            </div>
            <div className="form-group">
              <label>Age Group</label>
              <input className="form-control" value={form.age_group} onChange={e => onChange('age_group', e.target.value)} placeholder="e.g., U12" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Head Coach</label>
              <input className="form-control" value={form.head_coach} onChange={e => onChange('head_coach', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Assistant Coach</label>
              <input className="form-control" value={form.assistant_coach} onChange={e => onChange('assistant_coach', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Max Players</label>
              <input className="form-control" type="number" min="1" value={form.max_players} onChange={e => onChange('max_players', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Home Facility</label>
              <select className="form-control" value={form.home_facility_id} onChange={e => onChange('home_facility_id', e.target.value)}>
                <option value="">Select facility</option>
                {facilities.map(f => <option key={f.id || f._id} value={f.id || f._id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Season</label>
            <select className="form-control" value={form.season_id} onChange={e => onChange('season_id', e.target.value)}>
              <option value="">Select season</option>
              {seasons.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Team' : 'Create Team')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Team Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Team Information</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Team Name</label><p style={{ fontWeight: 600, fontSize: 16 }}>{selected.name}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Division</label><p>{selected.division || '—'}</p></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Age Group</label><p>{selected.age_group || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Max Players</label><p>{selected.max_players || '—'}</p></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Head Coach</label><p>{selected.head_coach || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Assistant Coach</label><p>{selected.assistant_coach || '—'}</p></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={{ fontSize: 11, color: '#9ca3af' }}>Home Facility</label><p>{getFacilityName(selected.home_facility_id)}</p></div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaUsers /> Roster ({roster.length} players)</h4>
              {rosterLoading ? (
                <div className="spinner-container" style={{ padding: 20 }}><div className="spinner spinner-sm" /></div>
              ) : roster.length === 0 ? (
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 24, textAlign: 'center', color: '#9ca3af' }}>No players assigned to this team</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Name</th><th>Position</th><th>Skill</th><th>Status</th></tr></thead>
                    <tbody>
                      {roster.map(p => (
                        <tr key={p.id || p._id}>
                          <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                          <td>{p.position || '—'}</td>
                          <td>{p.skill_level || '—'}/10</td>
                          <td><span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'injured' ? 'badge-danger' : 'badge-neutral'}`}>{p.status || 'active'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Teams;
