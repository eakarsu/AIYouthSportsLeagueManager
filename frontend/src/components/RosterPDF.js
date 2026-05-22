import React, { useEffect, useState } from 'react';
import api from '../services/api';

function RosterPDF() {
  const [meta, setMeta] = useState(null);
  const [teamId, setTeamId] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = (id) => {
    setLoading(true);
    api.get(`/custom-views/roster-pdf?team_id=${id}&format=json`)
      .then((r) => setMeta(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(teamId); }, [teamId]);

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:3001/api/custom-views/roster-pdf?team_id=${teamId}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `roster-${teamId}.pdf`;
    a.click();
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Roster PDF Export</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Generate an official roster sheet for any team.
      </p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Team:</label>
        <select
          className="form-control"
          style={{ width: 200 }}
          value={teamId}
          onChange={(e) => setTeamId(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <option key={id} value={id}>Team {id}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={handleDownload} disabled={loading}>
          Download PDF
        </button>
      </div>
      {meta && (
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{meta.team_name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            {meta.player_count} players · {meta.size_bytes} bytes
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {(meta.players || []).map((p) => (
              <li key={p} style={{ fontSize: 13, padding: '2px 0' }}>{p}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default RosterPDF;
