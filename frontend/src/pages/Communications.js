import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaComments, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort,
  FaBullhorn, FaExclamationTriangle, FaBell, FaEnvelope, FaNewspaper,
  FaInfoCircle, FaPaperPlane
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const TYPES = ['announcement', 'alert', 'reminder', 'message', 'newsletter'];
const PRIORITIES = ['high', 'medium', 'low'];
const RECIPIENT_TYPES = ['all', 'team', 'individual'];
const COMM_STATUSES = ['draft', 'sent', 'archived'];

const emptyForm = {
  title: '', message: '', type: 'announcement', priority: 'medium',
  recipient_type: 'all', team_id: '', status: 'draft',
};

function Communications() {
  const [communications, setCommunications] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCommunications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/communications');
      setCommunications(Array.isArray(res.data) ? res.data : res.data.communications || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load communications');
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

  useEffect(() => { fetchCommunications(); fetchTeams(); }, [fetchCommunications, fetchTeams]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filtered = communications
    .filter(c => {
      const term = search.toLowerCase();
      return (c.title || '').toLowerCase().includes(term)
        || (c.type || '').toLowerCase().includes(term)
        || (c.priority || '').toLowerCase().includes(term)
        || (c.status || '').toLowerCase().includes(term);
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

  const typeBadge = (type) => {
    const map = {
      announcement: { bg: '#3b82f6', icon: <FaBullhorn style={{ fontSize: 10 }} /> },
      alert: { bg: '#ef4444', icon: <FaExclamationTriangle style={{ fontSize: 10 }} /> },
      reminder: { bg: '#f59e0b', icon: <FaBell style={{ fontSize: 10 }} /> },
      message: { bg: '#6b7280', icon: <FaEnvelope style={{ fontSize: 10 }} /> },
      newsletter: { bg: '#8b5cf6', icon: <FaNewspaper style={{ fontSize: 10 }} /> },
    };
    const cfg = map[type] || { bg: '#6b7280', icon: null };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px',
        borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: cfg.bg
      }}>
        {cfg.icon} {type || '—'}
      </span>
    );
  };

  const priorityBadge = (priority) => {
    const map = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };
    return map[priority] || 'badge-neutral';
  };

  const statusBadge = (status) => {
    const map = { draft: 'badge-warning', sent: 'badge-success', archived: 'badge-neutral' };
    return map[status] || 'badge-neutral';
  };

  const typeIcon = (type) => {
    const map = {
      announcement: <FaBullhorn />, alert: <FaExclamationTriangle />,
      reminder: <FaBell />, message: <FaEnvelope />, newsletter: <FaNewspaper />,
    };
    return map[type] || <FaEnvelope />;
  };

  const getTeamName = (id) => {
    const t = teams.find(t => t.id === id || t._id === id);
    return t ? t.name : '—';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (c) => { setSelected(c); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      title: selected.title || '',
      message: selected.message || '',
      type: selected.type || 'announcement',
      priority: selected.priority || 'medium',
      recipient_type: selected.recipient_type || 'all',
      team_id: selected.team_id || '',
      status: selected.status || 'draft',
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.warning('Title is required'); return; }
    if (!form.message) { toast.warning('Message is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.recipient_type !== 'team') delete payload.team_id;
      if (editing && selected) {
        await api.put(`/communications/${selected.id || selected._id}`, payload);
        toast.success('Communication updated successfully');
      } else {
        await api.post('/communications', payload);
        toast.success('Communication created successfully');
      }
      setShowForm(false);
      fetchCommunications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save communication');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/communications/${selected.id || selected._id}`);
      toast.success('Communication deleted');
      setShowDetail(false);
      fetchCommunications();
    } catch (err) {
      toast.error('Failed to delete communication');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Communications</h1>
            <p>Parent portal and messaging center</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> New Communication</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search by title, type, priority, status..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading communications...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaComments /></div>
          <h3>{search ? 'No communications match your search' : 'No Communications Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Create your first communication to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>Title <SortIcon field="title" /></th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type <SortIcon field="type" /></th>
                <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>Priority <SortIcon field="priority" /></th>
                <th onClick={() => handleSort('recipient_type')} style={{ cursor: 'pointer' }}>Recipient <SortIcon field="recipient_type" /></th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
                <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>Date <SortIcon field="created_at" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id || c._id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>{typeBadge(c.type)}</td>
                  <td><span className={`badge ${priorityBadge(c.priority)}`}>{c.priority || 'medium'}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{c.recipient_type || 'all'}</td>
                  <td><span className={`badge ${statusBadge(c.status)}`}>{c.status || 'draft'}</span></td>
                  <td>{formatDate(c.created_at || c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Communication' : 'New Communication'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" value={form.title} onChange={e => onChange('title', e.target.value)} required placeholder="Communication title..." />
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea className="form-control" value={form.message} onChange={e => onChange('message', e.target.value)}
              required rows={6} placeholder="Write your message here..." style={{ resize: 'vertical', minHeight: 120 }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={form.type} onChange={e => onChange('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={e => onChange('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Recipient Type</label>
              <select className="form-control" value={form.recipient_type} onChange={e => onChange('recipient_type', e.target.value)}>
                {RECIPIENT_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            {form.recipient_type === 'team' && (
              <div className="form-group">
                <label>Team</label>
                <select className="form-control" value={form.team_id} onChange={e => onChange('team_id', e.target.value)}>
                  <option value="">Select team</option>
                  {teams.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status} onChange={e => onChange('status', e.target.value)}>
              {COMM_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (editing ? 'Update Communication' : 'Create Communication')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Communication Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: '#3b82f6' }}>{typeIcon(selected.type)}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{selected.title}</h3>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {typeBadge(selected.type)}
                    <span className={`badge ${priorityBadge(selected.priority)}`}>{selected.priority || 'medium'} priority</span>
                    <span className={`badge ${statusBadge(selected.status)}`}>{selected.status || 'draft'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaInfoCircle /> Details</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Recipient Type</label><p style={{ textTransform: 'capitalize', fontWeight: 600 }}>{selected.recipient_type || 'all'}</p></div>
                  {selected.recipient_type === 'team' && (
                    <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Team</label><p>{getTeamName(selected.team_id)}</p></div>
                  )}
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Date</label><p>{formatDate(selected.created_at || selected.createdAt)}</p></div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaPaperPlane /> Message</h4>
              <div style={{
                background: '#f9fafb', borderRadius: 8, padding: 20,
                lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14, color: '#374151',
                border: '1px solid #e5e7eb'
              }}>
                {selected.message || 'No message content'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Communications;
