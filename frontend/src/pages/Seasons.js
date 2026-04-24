import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaClock, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort,
  FaCalendarAlt, FaUsers, FaInfoCircle, FaTrophy
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const STATUSES = ['upcoming', 'active', 'completed', 'cancelled'];
const DIVISIONS = ['Recreational', 'Competitive', 'Premier', 'Elite'];
const AGE_GROUPS = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'U18'];

const emptyForm = {
  name: '', start_date: '', end_date: '', registration_deadline: '',
  status: 'upcoming', max_teams: '', division: '', age_group: '',
};

function Seasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('start_date');
  const [sortDir, setSortDir] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/seasons');
      setSeasons(Array.isArray(res.data) ? res.data : res.data.seasons || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filtered = seasons
    .filter(s => {
      const term = search.toLowerCase();
      return (s.name || '').toLowerCase().includes(term)
        || (s.division || '').toLowerCase().includes(term)
        || (s.age_group || '').toLowerCase().includes(term)
        || (s.status || '').toLowerCase().includes(term);
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

  const statusBadge = (status) => {
    const map = {
      upcoming: { cls: 'badge-info', bg: '#3b82f6' },
      active: { cls: 'badge-success', bg: '#22c55e' },
      completed: { cls: 'badge-neutral', bg: '#6b7280' },
      cancelled: { cls: 'badge-danger', bg: '#ef4444' },
    };
    const cfg = map[status] || { bg: '#6b7280' };
    return (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
        fontSize: 12, fontWeight: 600, color: '#fff', background: cfg.bg
      }}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
      </span>
    );
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const daysUntil = (d) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (s) => { setSelected(s); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      name: selected.name || '',
      start_date: selected.start_date ? selected.start_date.substring(0, 10) : '',
      end_date: selected.end_date ? selected.end_date.substring(0, 10) : '',
      registration_deadline: selected.registration_deadline ? selected.registration_deadline.substring(0, 10) : '',
      status: selected.status || 'upcoming',
      max_teams: selected.max_teams || '',
      division: selected.division || '',
      age_group: selected.age_group || '',
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.warning('Season name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_teams: form.max_teams ? Number(form.max_teams) : undefined,
      };
      if (editing && selected) {
        await api.put(`/seasons/${selected.id || selected._id}`, payload);
        toast.success('Season updated successfully');
      } else {
        await api.post('/seasons', payload);
        toast.success('Season created successfully');
      }
      setShowForm(false);
      fetchSeasons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save season');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete season "${selected.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/seasons/${selected.id || selected._id}`);
      toast.success('Season deleted');
      setShowDetail(false);
      fetchSeasons();
    } catch (err) {
      toast.error('Failed to delete season');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Seasons</h1>
            <p>Configure seasons, divisions, and age groups</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Season</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search seasons by name, division, age group, status..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading seasons...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaClock /></div>
          <h3>{search ? 'No seasons match your search' : 'No Seasons Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Add your first season to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name <SortIcon field="name" /></th>
                <th onClick={() => handleSort('division')} style={{ cursor: 'pointer' }}>Division <SortIcon field="division" /></th>
                <th onClick={() => handleSort('age_group')} style={{ cursor: 'pointer' }}>Age Group <SortIcon field="age_group" /></th>
                <th onClick={() => handleSort('start_date')} style={{ cursor: 'pointer' }}>Start Date <SortIcon field="start_date" /></th>
                <th onClick={() => handleSort('end_date')} style={{ cursor: 'pointer' }}>End Date <SortIcon field="end_date" /></th>
                <th>Registration Deadline</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
                <th onClick={() => handleSort('max_teams')} style={{ cursor: 'pointer' }}>Max Teams <SortIcon field="max_teams" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id || s._id} onClick={() => openDetail(s)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.division || '—'}</td>
                  <td><span className="badge badge-success" style={{ fontSize: 11 }}>{s.age_group || '—'}</span></td>
                  <td>{formatDate(s.start_date)}</td>
                  <td>{formatDate(s.end_date)}</td>
                  <td>
                    {formatDate(s.registration_deadline)}
                    {(() => {
                      const d = daysUntil(s.registration_deadline);
                      if (d !== null && d > 0 && d <= 14) {
                        return <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 6 }}>({d}d left)</span>;
                      }
                      return null;
                    })()}
                  </td>
                  <td>{statusBadge(s.status)}</td>
                  <td>{s.max_teams != null ? s.max_teams : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Season' : 'Add New Season'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Season Name *</label>
            <input className="form-control" value={form.name} onChange={e => onChange('name', e.target.value)} required placeholder="e.g., Spring 2026" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Division</label>
              <select className="form-control" value={form.division} onChange={e => onChange('division', e.target.value)}>
                <option value="">Select division</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Age Group</label>
              <select className="form-control" value={form.age_group} onChange={e => onChange('age_group', e.target.value)}>
                <option value="">Select age group</option>
                {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input className="form-control" type="date" value={form.start_date} onChange={e => onChange('start_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input className="form-control" type="date" value={form.end_date} onChange={e => onChange('end_date', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Registration Deadline</label>
              <input className="form-control" type="date" value={form.registration_deadline} onChange={e => onChange('registration_deadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Max Teams</label>
              <input className="form-control" type="number" min="2" value={form.max_teams} onChange={e => onChange('max_teams', e.target.value)} placeholder="e.g., 16" />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status} onChange={e => onChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Season' : 'Create Season')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Season Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 32, color: '#3b82f6' }}><FaTrophy /></span>
              <div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{selected.name}</h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {statusBadge(selected.status)}
                  {selected.division && <span className="badge badge-warning">{selected.division}</span>}
                  {selected.age_group && <span className="badge badge-success">{selected.age_group}</span>}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendarAlt /> Schedule</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Start Date</label><p style={{ fontWeight: 600 }}>{formatDate(selected.start_date)}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>End Date</label><p style={{ fontWeight: 600 }}>{formatDate(selected.end_date)}</p></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Registration Deadline</label>
                  <p style={{ fontWeight: 600 }}>
                    {formatDate(selected.registration_deadline)}
                    {(() => {
                      const d = daysUntil(selected.registration_deadline);
                      if (d !== null && d > 0) return <span style={{ color: d <= 7 ? '#ef4444' : '#f59e0b', marginLeft: 8, fontSize: 12 }}>({d} days remaining)</span>;
                      if (d !== null && d <= 0) return <span style={{ color: '#ef4444', marginLeft: 8, fontSize: 12 }}>(Closed)</span>;
                      return null;
                    })()}
                  </p>
                </div>
                {selected.start_date && selected.end_date && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Duration</label>
                    <p style={{ fontWeight: 600 }}>
                      {Math.ceil((new Date(selected.end_date) - new Date(selected.start_date)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaUsers /> Configuration</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Division</label><p style={{ fontWeight: 600 }}>{selected.division || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Age Group</label><p style={{ fontWeight: 600 }}>{selected.age_group || '—'}</p></div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Max Teams</label>
                  <p style={{ fontWeight: 600 }}>{selected.max_teams != null ? selected.max_teams : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Seasons;
