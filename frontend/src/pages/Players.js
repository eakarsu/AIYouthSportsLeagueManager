import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaUsers, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort, FaUser, FaPhone, FaMedkit, FaFutbol } from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['active', 'inactive', 'injured'];

const emptyForm = {
  first_name: '', last_name: '', age: '', date_of_birth: '', gender: '',
  skill_level: 5, position: '', team_id: '', parent_email: '', parent_phone: '',
  emergency_contact: '', medical_notes: '', status: 'active',
};

function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('last_name');
  const [sortDir, setSortDir] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/players');
      setPlayers(Array.isArray(res.data) ? res.data : res.data.players || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await api.get('/teams');
      setTeams(Array.isArray(res.data) ? res.data : res.data.teams || res.data.data || []);
    } catch { /* teams optional */ }
  }, []);

  useEffect(() => { fetchPlayers(); fetchTeams(); }, [fetchPlayers, fetchTeams]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filtered = players
    .filter(p => {
      const term = search.toLowerCase();
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      return name.includes(term) || (p.position || '').toLowerCase().includes(term)
        || (p.status || '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'name') { aVal = `${a.first_name} ${a.last_name}`; bVal = `${b.first_name} ${b.last_name}`; }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const getTeamName = (id) => {
    const t = teams.find(t => t.id === id || t._id === id);
    return t ? t.name : '—';
  };

  const skillColor = (level) => {
    if (level <= 3) return '#ef4444';
    if (level <= 6) return '#f59e0b';
    return '#22c55e';
  };

  const statusBadge = (status) => {
    const map = { active: 'badge-success', inactive: 'badge-neutral', injured: 'badge-danger' };
    return map[status] || 'badge-neutral';
  };

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (p) => { setSelected(p); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      first_name: selected.first_name || '', last_name: selected.last_name || '',
      age: selected.age || '', date_of_birth: selected.date_of_birth ? selected.date_of_birth.substring(0, 10) : '',
      gender: selected.gender || '', skill_level: selected.skill_level || 5,
      position: selected.position || '', team_id: selected.team_id || '',
      parent_email: selected.parent_email || '', parent_phone: selected.parent_phone || '',
      emergency_contact: selected.emergency_contact || '', medical_notes: selected.medical_notes || '',
      status: selected.status || 'active',
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) { toast.warning('First and last name are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : undefined, skill_level: Number(form.skill_level) };
      if (editing && selected) {
        await api.put(`/players/${selected.id || selected._id}`, payload);
        toast.success('Player updated successfully');
      } else {
        await api.post('/players', payload);
        toast.success('Player created successfully');
      }
      setShowForm(false);
      fetchPlayers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save player');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selected.first_name} ${selected.last_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/players/${selected.id || selected._id}`);
      toast.success('Player deleted');
      setShowDetail(false);
      fetchPlayers();
    } catch (err) {
      toast.error('Failed to delete player');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Players</h1>
            <p>Manage player registrations, profiles, and skill assessments</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Player</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search players by name, position, status..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading players...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaUsers /></div>
          <h3>{search ? 'No players match your search' : 'No Players Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Add your first player to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name <SortIcon field="name" /></th>
                <th onClick={() => handleSort('age')} style={{ cursor: 'pointer' }}>Age <SortIcon field="age" /></th>
                <th onClick={() => handleSort('position')} style={{ cursor: 'pointer' }}>Position <SortIcon field="position" /></th>
                <th>Skill Level</th>
                <th onClick={() => handleSort('team_id')} style={{ cursor: 'pointer' }}>Team <SortIcon field="team_id" /></th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id || p._id} onClick={() => openDetail(p)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                  <td>{p.age || '—'}</td>
                  <td>{p.position || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, maxWidth: 100 }}>
                        <div style={{ width: `${(p.skill_level || 0) * 10}%`, height: '100%', borderRadius: 4, background: skillColor(p.skill_level), transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: skillColor(p.skill_level) }}>{p.skill_level || 0}/10</span>
                    </div>
                  </td>
                  <td>{getTeamName(p.team_id)}</td>
                  <td><span className={`badge ${statusBadge(p.status)}`}>{p.status || 'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Player' : 'Add New Player'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input className="form-control" value={form.first_name} onChange={e => onChange('first_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input className="form-control" value={form.last_name} onChange={e => onChange('last_name', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input className="form-control" type="number" min="4" max="18" value={form.age} onChange={e => onChange('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input className="form-control" type="date" value={form.date_of_birth} onChange={e => onChange('date_of_birth', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" value={form.gender} onChange={e => onChange('gender', e.target.value)}>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Position</label>
              <select className="form-control" value={form.position} onChange={e => onChange('position', e.target.value)}>
                <option value="">Select position</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Skill Level ({form.skill_level}/10)</label>
              <input type="range" min="1" max="10" value={form.skill_level} onChange={e => onChange('skill_level', e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                <span>Beginner</span><span>Intermediate</span><span>Advanced</span>
              </div>
            </div>
            <div className="form-group">
              <label>Team</label>
              <select className="form-control" value={form.team_id} onChange={e => onChange('team_id', e.target.value)}>
                <option value="">No team</option>
                {teams.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status} onChange={e => onChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <hr style={{ margin: '20px 0', borderColor: '#e5e7eb' }} />
          <h4 style={{ fontSize: 14, marginBottom: 12, color: '#374151' }}>Contact Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Parent Email</label>
              <input className="form-control" type="email" value={form.parent_email} onChange={e => onChange('parent_email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Parent Phone</label>
              <input className="form-control" type="tel" value={form.parent_phone} onChange={e => onChange('parent_phone', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Emergency Contact</label>
            <input className="form-control" value={form.emergency_contact} onChange={e => onChange('emergency_contact', e.target.value)} />
          </div>
          <hr style={{ margin: '20px 0', borderColor: '#e5e7eb' }} />
          <h4 style={{ fontSize: 14, marginBottom: 12, color: '#374151' }}>Medical Information</h4>
          <div className="form-group">
            <label>Medical Notes</label>
            <textarea className="form-control" value={form.medical_notes} onChange={e => onChange('medical_notes', e.target.value)} placeholder="Allergies, conditions, medications..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Player' : 'Create Player')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Player Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            {/* Personal */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaUser /> Personal Info</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Full Name</label><p style={{ fontWeight: 600 }}>{selected.first_name} {selected.last_name}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Age</label><p>{selected.age || '—'}</p></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Date of Birth</label><p>{selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString() : '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Gender</label><p>{selected.gender || '—'}</p></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={{ fontSize: 11, color: '#9ca3af' }}>Status</label><p><span className={`badge ${statusBadge(selected.status)}`}>{selected.status || 'active'}</span></p></div>
              </div>
            </div>

            {/* Team */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaFutbol /> Team & Performance</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Position</label><p>{selected.position || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Team</label><p>{getTeamName(selected.team_id)}</p></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Skill Level</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 10, background: '#e5e7eb', borderRadius: 5 }}>
                      <div style={{ width: `${(selected.skill_level || 0) * 10}%`, height: '100%', borderRadius: 5, background: skillColor(selected.skill_level), transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontWeight: 700, color: skillColor(selected.skill_level) }}>{selected.skill_level || 0}/10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaPhone /> Contact Info</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Parent Email</label><p>{selected.parent_email || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Parent Phone</label><p>{selected.parent_phone || '—'}</p></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={{ fontSize: 11, color: '#9ca3af' }}>Emergency Contact</label><p>{selected.emergency_contact || '—'}</p></div>
              </div>
            </div>

            {/* Medical */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaMedkit /> Medical Info</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <label style={{ fontSize: 11, color: '#9ca3af' }}>Medical Notes</label>
                <p>{selected.medical_notes || 'No medical notes on file'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Players;
