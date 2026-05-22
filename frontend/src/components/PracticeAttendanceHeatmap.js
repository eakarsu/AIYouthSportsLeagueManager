import React, { useEffect, useState } from 'react';
import api from '../services/api';

const COLORS = ['#fee2e2', '#fde68a', '#86efac']; // absent, partial, full
const LABELS = ['Absent', 'Partial', 'Full'];

function PracticeAttendanceHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/practice-attendance-heatmap?weeks=8')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading attendance heatmap…</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data || !data.players) return null;

  const weeks = data.weeks;

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Practice Attendance Heatmap</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Player x Week ({weeks} weeks). Hover for details.
      </p>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
        {LABELS.map((lab, i) => (
          <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: COLORS[i], display: 'inline-block', border: '1px solid #d1d5db', borderRadius: 3 }} />
            {lab}
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Player</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Team</th>
              {Array.from({ length: weeks }, (_, i) => (
                <th key={i} style={{ width: 28, textAlign: 'center', color: '#6b7280' }}>W{i + 1}</th>
              ))}
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.players.map((p) => (
              <tr key={`${p.team_id}-${p.player_name}`}>
                <td style={{ padding: '2px 8px', fontWeight: 600 }}>{p.player_name}</td>
                <td style={{ padding: '2px 8px', color: '#6b7280' }}>{p.team_name}</td>
                {p.cells.map((c) => (
                  <td key={c.week} style={{ padding: 0 }}>
                    <div
                      title={`Week ${c.week}: ${LABELS[c.status]}`}
                      style={{
                        width: 24,
                        height: 24,
                        background: COLORS[c.status],
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '2px 8px', textAlign: 'right', fontWeight: 700 }}>
                  {p.attendance_rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PracticeAttendanceHeatmap;
