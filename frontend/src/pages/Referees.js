import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaFlag, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort,
  FaUser, FaEnvelope, FaPhone, FaStar, FaRegStar, FaCalendarAlt, FaCertificate
} from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const CERTIFICATION_LEVELS = ['grassroots', 'regional', 'national', 'fifa'];
const STATUSES = ['active', 'inactive', 'suspended', 'on_leave'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '',
  certification_level: '', years_experience: '', max_games_per_week: '',
  availability_days: [], specializations: '', rating: 3, status: 'active',
};

function Referees() {
  const [referees, setReferees] = useState([]);
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

  const fetchReferees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/referees');
      setReferees(Array.isArray(res.data) ? res.data : res.data.referees || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load referees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReferees(); }, [fetchReferees]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filtered = referees
    .filter(r => {
      const term = search.toLowerCase();
      const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
      return name.includes(term) || (r.email || '').toLowerCase().includes(term)
        || (r.certification_level || '').toLowerCase().includes(term)
        || (r.status || '').toLowerCase().includes(term);
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

  const statusBadge = (status) => {
    const map = { active: 'badge-success', inactive: 'badge-warning', suspended: 'badge-danger' };
    return map[status] || 'badge-neutral';
  };

  const certColor = (level) => {
    const map = { Grassroots: '#6b7280', District: '#3b82f6', Regional: '#8b5cf6', National: '#f59e0b', FIFA: '#22c55e' };
    return map[level] || '#6b7280';
  };

  const renderStars = (rating, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating
          ? <FaStar key={i} style={{ color: '#f59e0b', fontSize: size }} />
          : <FaRegStar key={i} style={{ color: '#d1d5db', fontSize: size }} />
      );
    }
    return <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>;
  };

  const openAdd = () => { setForm(emptyForm); setEditing(false); setShowForm(true); };
  const openDetail = (r) => { setSelected(r); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      first_name: selected.first_name || '',
      last_name: selected.last_name || '',
      email: selected.email || '',
      phone: selected.phone || '',
      certification_level: selected.certification_level || '',
      years_experience: selected.years_experience || '',
      max_games_per_week: selected.max_games_per_week || '',
      availability_days: selected.availability_days || [],
      specializations: selected.specializations || '',
      rating: selected.rating || 3,
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
      const payload = {
        ...form,
        years_experience: form.years_experience ? Number(form.years_experience) : undefined,
        max_games_per_week: form.max_games_per_week ? Number(form.max_games_per_week) : undefined,
        rating: Number(form.rating),
      };
      if (editing && selected) {
        await api.put(`/referees/${selected.id || selected._id}`, payload);
        toast.success('Referee updated successfully');
      } else {
        await api.post('/referees', payload);
        toast.success('Referee created successfully');
      }
      setShowForm(false);
      fetchReferees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save referee');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selected.first_name} ${selected.last_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/referees/${selected.id || selected._id}`);
      toast.success('Referee deleted');
      setShowDetail(false);
      fetchReferees();
    } catch (err) {
      toast.error('Failed to delete referee');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      availability_days: f.availability_days.includes(day)
        ? f.availability_days.filter(d => d !== day)
        : [...f.availability_days, day]
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Referees</h1>
            <p>Manage referee assignments and certifications</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Referee</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search referees by name, email, certification..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading referees...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaFlag /></div>
          <h3>{search ? 'No referees match your search' : 'No Referees Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Add your first referee to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name <SortIcon field="name" /></th>
                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>Email <SortIcon field="email" /></th>
                <th onClick={() => handleSort('certification_level')} style={{ cursor: 'pointer' }}>Certification <SortIcon field="certification_level" /></th>
                <th onClick={() => handleSort('years_experience')} style={{ cursor: 'pointer' }}>Experience <SortIcon field="years_experience" /></th>
                <th>Rating</th>
                <th onClick={() => handleSort('max_games_per_week')} style={{ cursor: 'pointer' }}>Max Games/Wk <SortIcon field="max_games_per_week" /></th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id || r._id} onClick={() => openDetail(r)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{r.first_name} {r.last_name}</td>
                  <td>{r.email || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                      fontSize: 12, fontWeight: 600, color: '#fff',
                      background: certColor(r.certification_level)
                    }}>
                      {r.certification_level || '—'}
                    </span>
                  </td>
                  <td>{r.years_experience != null ? `${r.years_experience} yrs` : '—'}</td>
                  <td>{renderStars(r.rating || 0)}</td>
                  <td>{r.max_games_per_week != null ? r.max_games_per_week : '—'}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status || 'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Referee' : 'Add New Referee'} size="lg">
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
              <label>Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => onChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" type="tel" value={form.phone} onChange={e => onChange('phone', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Certification Level</label>
              <select className="form-control" value={form.certification_level} onChange={e => onChange('certification_level', e.target.value)}>
                <option value="">Select level</option>
                {CERTIFICATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Years of Experience</label>
              <input className="form-control" type="number" min="0" value={form.years_experience} onChange={e => onChange('years_experience', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Max Games per Week</label>
              <input className="form-control" type="number" min="1" max="20" value={form.max_games_per_week} onChange={e => onChange('max_games_per_week', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Rating ({form.rating}/5)</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => onChange('rating', n)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {n <= form.rating
                      ? <FaStar style={{ color: '#f59e0b', fontSize: 24 }} />
                      : <FaRegStar style={{ color: '#d1d5db', fontSize: 24 }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Availability Days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {DAYS_OF_WEEK.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`btn ${form.availability_days.includes(day) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 12, padding: '4px 12px' }}>
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Specializations</label>
            <input className="form-control" value={form.specializations} onChange={e => onChange('specializations', e.target.value)} placeholder="e.g., Youth leagues, Indoor soccer, Futsal..." />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status} onChange={e => onChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Referee' : 'Create Referee')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Referee Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            {/* Personal Info */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaUser /> Personal Info</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Full Name</label><p style={{ fontWeight: 600 }}>{selected.first_name} {selected.last_name}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Status</label><p><span className={`badge ${statusBadge(selected.status)}`}>{selected.status || 'active'}</span></p></div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaEnvelope /> Contact</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Email</label><p>{selected.email || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Phone</label><p>{selected.phone || '—'}</p></div>
                </div>
              </div>
            </div>

            {/* Certification & Experience */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaCertificate /> Certification & Experience</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Certification Level</label>
                    <p>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                        fontSize: 12, fontWeight: 600, color: '#fff',
                        background: certColor(selected.certification_level)
                      }}>
                        {selected.certification_level || '—'}
                      </span>
                    </p>
                  </div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Years of Experience</label><p style={{ fontWeight: 600 }}>{selected.years_experience != null ? `${selected.years_experience} years` : '—'}</p></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af' }}>Rating</label>
                    <div style={{ marginTop: 4 }}>{renderStars(selected.rating || 0, 20)}</div>
                  </div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Max Games per Week</label><p style={{ fontWeight: 600 }}>{selected.max_games_per_week != null ? selected.max_games_per_week : '—'}</p></div>
                </div>
              </div>
            </div>

            {/* Availability & Specializations */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendarAlt /> Availability & Specializations</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Available Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {(selected.availability_days && selected.availability_days.length > 0)
                      ? selected.availability_days.map(d => (
                        <span key={d} className="badge badge-success" style={{ fontSize: 11 }}>{d}</span>
                      ))
                      : <span style={{ color: '#9ca3af' }}>No days specified</span>}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Specializations</label>
                  <p>{selected.specializations || 'None specified'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Referees;
