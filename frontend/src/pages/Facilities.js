import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaBuilding, FaPlus, FaSearch, FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort, FaMapMarkerAlt, FaClock, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import Modal from '../components/Modal';

const TYPES = ['Field', 'Court', 'Gym', 'Stadium'];
const SURFACES = ['Grass', 'Turf', 'Hardwood', 'Concrete'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyForm = {
  name: '', address: '', type: '', capacity: '', has_lights: false, has_parking: false,
  indoor: false, surface_type: '', available_days: [], available_hours_start: '08:00',
  available_hours_end: '22:00', hourly_rate: '', contact_phone: '', status: 'active',
};

function Facilities() {
  const [facilities, setFacilities] = useState([]);
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

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities');
      setFacilities(Array.isArray(res.data) ? res.data : res.data.facilities || res.data.data || []);
    } catch (err) {
      toast.error('Failed to load facilities');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const filtered = facilities
    .filter(f => {
      const term = search.toLowerCase();
      return (f.name || '').toLowerCase().includes(term)
        || (f.type || '').toLowerCase().includes(term)
        || (f.surface_type || '').toLowerCase().includes(term)
        || (f.address || '').toLowerCase().includes(term);
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
  const openDetail = (f) => { setSelected(f); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      name: selected.name || '', address: selected.address || '', type: selected.type || '',
      capacity: selected.capacity || '', has_lights: !!selected.has_lights, has_parking: !!selected.has_parking,
      indoor: !!selected.indoor, surface_type: selected.surface_type || '',
      available_days: selected.available_days || [],
      available_hours_start: selected.available_hours_start || '08:00',
      available_hours_end: selected.available_hours_end || '22:00',
      hourly_rate: selected.hourly_rate || '', contact_phone: selected.contact_phone || '',
      status: selected.status || 'active',
    });
    setEditing(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.warning('Facility name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : undefined, hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined };
      if (editing && selected) {
        await api.put(`/facilities/${selected.id || selected._id}`, payload);
        toast.success('Facility updated successfully');
      } else {
        await api.post('/facilities', payload);
        toast.success('Facility created successfully');
      }
      setShowForm(false);
      fetchFacilities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save facility');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete facility "${selected.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/facilities/${selected.id || selected._id}`);
      toast.success('Facility deleted');
      setShowDetail(false);
      fetchFacilities();
    } catch (err) {
      toast.error('Failed to delete facility');
    }
  };

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter(d => d !== day)
        : [...f.available_days, day],
    }));
  };

  const statusBadge = (status) => {
    const map = { active: 'badge-success', inactive: 'badge-neutral', maintenance: 'badge-warning' };
    return map[status] || 'badge-neutral';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 className="page-title">Facilities</h1>
            <p>Track fields, courts, and venue availability</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FaPlus /> Add Facility</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input placeholder="Search facilities by name, type, surface..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /><span className="spinner-text">Loading facilities...</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <div className="empty-icon"><FaBuilding /></div>
          <h3>{search ? 'No facilities match your search' : 'No Facilities Yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Add your first facility to get started'}</p>
        </div></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name <SortIcon field="name" /></th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type <SortIcon field="type" /></th>
                <th onClick={() => handleSort('capacity')} style={{ cursor: 'pointer' }}>Capacity <SortIcon field="capacity" /></th>
                <th onClick={() => handleSort('surface_type')} style={{ cursor: 'pointer' }}>Surface <SortIcon field="surface_type" /></th>
                <th>Indoor/Outdoor</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon field="status" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id || f._id} onClick={() => openDetail(f)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td>{f.type || '—'}</td>
                  <td>{f.capacity || '—'}</td>
                  <td>{f.surface_type || '—'}</td>
                  <td><span className={`badge ${f.indoor ? 'badge-info' : 'badge-success'}`}>{f.indoor ? 'Indoor' : 'Outdoor'}</span></td>
                  <td><span className={`badge ${statusBadge(f.status)}`}>{f.status || 'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Facility' : 'Add New Facility'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Facility Name *</label>
            <input className="form-control" value={form.name} onChange={e => onChange('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input className="form-control" value={form.address} onChange={e => onChange('address', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={form.type} onChange={e => onChange('type', e.target.value)}>
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Surface Type</label>
              <select className="form-control" value={form.surface_type} onChange={e => onChange('surface_type', e.target.value)}>
                <option value="">Select surface</option>
                {SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capacity</label>
              <input className="form-control" type="number" min="0" value={form.capacity} onChange={e => onChange('capacity', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Hourly Rate ($)</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.hourly_rate} onChange={e => onChange('hourly_rate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Phone</label>
              <input className="form-control" type="tel" value={form.contact_phone} onChange={e => onChange('contact_phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => onChange('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.has_lights} onChange={e => onChange('has_lights', e.target.checked)} /> Has Lights
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.has_parking} onChange={e => onChange('has_parking', e.target.checked)} /> Has Parking
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.indoor} onChange={e => onChange('indoor', e.target.checked)} /> Indoor
            </label>
          </div>
          <div className="form-group">
            <label>Available Days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {DAYS.map(day => (
                <button key={day} type="button"
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                    background: form.available_days.includes(day) ? '#dbeafe' : 'white',
                    color: form.available_days.includes(day) ? '#2563eb' : '#6b7280',
                    borderColor: form.available_days.includes(day) ? '#3b82f6' : '#d1d5db',
                  }}
                >{day.substring(0, 3)}</button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Available Hours Start</label>
              <input className="form-control" type="time" value={form.available_hours_start} onChange={e => onChange('available_hours_start', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Available Hours End</label>
              <input className="form-control" type="time" value={form.available_hours_end} onChange={e => onChange('available_hours_end', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update Facility' : 'Create Facility')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Facility Details" size="lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={openEdit}><FaEdit /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaBuilding /> General Info</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Name</label><p style={{ fontWeight: 600, fontSize: 16 }}>{selected.name}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Type</label><p>{selected.type || '—'}</p></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Surface</label><p>{selected.surface_type || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Capacity</label><p>{selected.capacity || '—'}</p></div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Environment</label><p><span className={`badge ${selected.indoor ? 'badge-info' : 'badge-success'}`}>{selected.indoor ? 'Indoor' : 'Outdoor'}</span></p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Status</label><p><span className={`badge ${statusBadge(selected.status)}`}>{selected.status || 'active'}</span></p></div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  {selected.has_lights && <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCheck /> Lights</span>}
                  {selected.has_parking && <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCheck /> Parking</span>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaMapMarkerAlt /> Location & Contact</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Address</label><p>{selected.address || '—'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Contact Phone</label><p>{selected.contact_phone || '—'}</p></div>
                </div>
                {selected.hourly_rate && <div style={{ marginTop: 12 }}><label style={{ fontSize: 11, color: '#9ca3af' }}>Hourly Rate</label><p style={{ fontWeight: 600, color: '#22c55e' }}>${selected.hourly_rate}/hr</p></div>}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><FaClock /> Availability Schedule</h4>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af' }}>Available Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {DAYS.map(day => {
                      const available = (selected.available_days || []).includes(day);
                      return (
                        <span key={day} style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: available ? '#dcfce7' : '#f3f4f6',
                          color: available ? '#15803d' : '#9ca3af',
                        }}>{day.substring(0, 3)}</span>
                      );
                    })}
                  </div>
                </div>
                <div className="form-row">
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Opens</label><p>{selected.available_hours_start || '08:00'}</p></div>
                  <div><label style={{ fontSize: 11, color: '#9ca3af' }}>Closes</label><p>{selected.available_hours_end || '22:00'}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Facilities;
