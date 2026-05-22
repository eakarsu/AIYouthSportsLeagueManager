import React, { useEffect, useState } from 'react';
import api from '../services/api';

function TeamStandingsChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/team-standings-chart')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading standings chart…</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data || !data.teams) return null;

  const maxPts = Math.max(...data.teams.map((t) => t.points), 1);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Team Standings Chart</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Leader: <strong>{data.leader}</strong>
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 220, marginTop: 16, padding: '0 4px', borderBottom: '2px solid #d1d5db' }}>
        {data.teams.map((t, idx) => {
          const h = (t.points / maxPts) * 180;
          const colors = ['#f59e0b', '#9ca3af', '#cd7f32', '#3b82f6', '#3b82f6', '#3b82f6'];
          return (
            <div key={t.team_id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.points}</div>
              <div
                data-testid={`bar-${t.team_id}`}
                style={{
                  width: '100%',
                  height: h,
                  background: colors[idx] || '#3b82f6',
                  borderRadius: '6px 6px 0 0',
                  marginTop: 4,
                }}
              />
              <div style={{ fontSize: 11, marginTop: 6, textAlign: 'center', color: '#374151' }}>
                {t.team_name}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>
                {t.wins}-{t.losses}-{t.draws}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamStandingsChart;
