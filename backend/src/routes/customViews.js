// Custom Views routes - in-memory state for league rules + computed analytics
const express = require('express');
const router = express.Router();

// ---- In-memory state ----
let ageDivisions = [
  { id: 1, name: 'U8', min_age: 6, max_age: 8, max_players: 10, game_length_min: 40 },
  { id: 2, name: 'U10', min_age: 9, max_age: 10, max_players: 12, game_length_min: 50 },
  { id: 3, name: 'U12', min_age: 11, max_age: 12, max_players: 14, game_length_min: 60 },
  { id: 4, name: 'U14', min_age: 13, max_age: 14, max_players: 16, game_length_min: 70 },
];
let nextDivId = 5;

let leagueRules = {
  season_start: '2026-03-01',
  season_end: '2026-06-30',
  practices_per_week: 2,
  games_per_week: 1,
  forfeit_rule: 'A team forfeits if fewer than 6 players arrive within 10 minutes of game start.',
  weather_policy: 'Games cancelled at lightning within 6 miles. Field decisions made by referees.',
  conduct_code: 'Players, parents, and coaches must adhere to the league code of conduct.',
};

// Seeded teams and weekly attendance grid (player x week)
const teams = [
  { id: 1, name: 'Lightning Bolts', wins: 8, losses: 2, draws: 1, goals_for: 24, goals_against: 11 },
  { id: 2, name: 'Thunder Hawks', wins: 7, losses: 3, draws: 1, goals_for: 22, goals_against: 14 },
  { id: 3, name: 'Storm Eagles', wins: 6, losses: 4, draws: 1, goals_for: 19, goals_against: 17 },
  { id: 4, name: 'Comet Tigers', wins: 5, losses: 5, draws: 1, goals_for: 16, goals_against: 18 },
  { id: 5, name: 'Galaxy Wolves', wins: 4, losses: 6, draws: 1, goals_for: 13, goals_against: 19 },
  { id: 6, name: 'Nova Bears', wins: 2, losses: 8, draws: 1, goals_for: 9, goals_against: 24 },
];

const rosterByTeam = {
  1: ['Aiden Park', 'Noah Brown', 'Lucas Kim', 'Mia Patel', 'Liam Chen'],
  2: ['Emma Davis', 'Olivia Singh', 'Ethan Wong', 'Sofia Garcia'],
  3: ['Mason Lee', 'Ava Lopez', 'Logan Brooks', 'Isabella Reyes', 'Jackson Ng'],
  4: ['Charlotte Diaz', 'Sebastian Cruz', 'Amelia Tran'],
  5: ['Henry Patel', 'Ella Murphy', 'Daniel Foster', 'Grace Hill'],
  6: ['Owen Watts', 'Lily Carter', 'Wyatt Bell'],
};

function deterministicAttendance(playerName, week) {
  // Stable pseudo-random value 0..1
  let h = 0;
  const s = `${playerName}-${week}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  const v = Math.abs(h % 1000) / 1000; // 0..1
  // 0 absent, 1 partial, 2 full
  if (v < 0.15) return 0;
  if (v < 0.35) return 1;
  return 2;
}

// ---- 1. VIZ: Team standings chart data ----
router.get('/team-standings-chart', (req, res) => {
  const data = teams
    .map((t) => {
      const gp = t.wins + t.losses + t.draws;
      const points = t.wins * 3 + t.draws;
      const gd = t.goals_for - t.goals_against;
      return {
        team_id: t.id,
        team_name: t.name,
        wins: t.wins,
        losses: t.losses,
        draws: t.draws,
        games_played: gp,
        points,
        goal_difference: gd,
        goals_for: t.goals_for,
        goals_against: t.goals_against,
      };
    })
    .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference);

  res.json({
    type: 'team-standings-chart',
    generated_at: new Date().toISOString(),
    leader: data[0]?.team_name || null,
    teams: data,
  });
});

// ---- 2. VIZ: Practice attendance heatmap (player x week) ----
router.get('/practice-attendance-heatmap', (req, res) => {
  const weeks = Number(req.query.weeks) || 8;
  const teamId = req.query.team_id ? Number(req.query.team_id) : null;
  const rosterEntries = teamId
    ? [[teamId, rosterByTeam[teamId] || []]]
    : Object.entries(rosterByTeam);

  const players = [];
  rosterEntries.forEach(([tid, names]) => {
    const teamName = teams.find((t) => t.id === Number(tid))?.name || `Team ${tid}`;
    names.forEach((name) => {
      const cells = [];
      let attendedFull = 0;
      let attendedPartial = 0;
      let absent = 0;
      for (let w = 1; w <= weeks; w++) {
        const status = deterministicAttendance(name, w);
        cells.push({ week: w, status });
        if (status === 2) attendedFull++;
        else if (status === 1) attendedPartial++;
        else absent++;
      }
      players.push({
        player_name: name,
        team_id: Number(tid),
        team_name: teamName,
        cells,
        attendance_rate: Math.round(((attendedFull + attendedPartial * 0.5) / weeks) * 100),
        full: attendedFull,
        partial: attendedPartial,
        absent,
      });
    });
  });

  res.json({
    type: 'practice-attendance-heatmap',
    generated_at: new Date().toISOString(),
    weeks,
    legend: { 0: 'absent', 1: 'partial', 2: 'full' },
    players,
  });
});

// ---- 3. NON-VIZ: Roster PDF (returns a simple PDF document) ----
router.get('/roster-pdf', (req, res) => {
  const teamId = Number(req.query.team_id) || 1;
  const team = teams.find((t) => t.id === teamId) || teams[0];
  const players = rosterByTeam[team.id] || [];

  // Minimal hand-built PDF (no external deps required)
  const lines = [];
  lines.push(`AI YOUTH SPORTS LEAGUE - OFFICIAL ROSTER`);
  lines.push(``);
  lines.push(`Team: ${team.name}`);
  lines.push(`Record: ${team.wins}W - ${team.losses}L - ${team.draws}D`);
  lines.push(`Goals For/Against: ${team.goals_for} / ${team.goals_against}`);
  lines.push(``);
  lines.push(`PLAYERS (${players.length}):`);
  players.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);

  // Build a minimal PDF
  const escape = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const textOps = lines
    .map((line, idx) => `BT /F1 ${idx === 0 ? 16 : 12} Tf 50 ${760 - idx * 22} Td (${escape(line)}) Tj ET`)
    .join('\n');
  const streamContent = textOps;
  const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objs.push(`<< /Length ${Buffer.byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream`);
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // If client asks for JSON (probe), return metadata. Otherwise serve PDF.
  if (req.query.format === 'json' || (req.headers.accept || '').includes('application/json')) {
    return res.json({
      type: 'roster-pdf',
      team_id: team.id,
      team_name: team.name,
      player_count: players.length,
      players,
      size_bytes: Buffer.byteLength(pdf),
      download_url: `/api/custom-views/roster-pdf?team_id=${team.id}`,
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="roster-${team.name.replace(/\s+/g, '_')}.pdf"`);
  res.send(Buffer.from(pdf, 'binary'));
});

// ---- 4. NON-VIZ: League rules editor (CRUD age divisions, schedule) ----
router.get('/league-rules', (req, res) => {
  res.json({
    type: 'league-rules',
    rules: leagueRules,
    age_divisions: ageDivisions,
  });
});

router.post('/league-rules', (req, res) => {
  const body = req.body || {};
  if (body.rules && typeof body.rules === 'object') {
    leagueRules = { ...leagueRules, ...body.rules };
  }
  if (body.add_division && typeof body.add_division === 'object') {
    const d = body.add_division;
    if (d.name) {
      ageDivisions.push({
        id: nextDivId++,
        name: String(d.name),
        min_age: Number(d.min_age) || 0,
        max_age: Number(d.max_age) || 0,
        max_players: Number(d.max_players) || 12,
        game_length_min: Number(d.game_length_min) || 50,
      });
    }
  }
  if (body.update_division && typeof body.update_division === 'object') {
    const u = body.update_division;
    ageDivisions = ageDivisions.map((d) =>
      d.id === Number(u.id) ? { ...d, ...u, id: d.id } : d
    );
  }
  if (body.delete_division_id != null) {
    ageDivisions = ageDivisions.filter((d) => d.id !== Number(body.delete_division_id));
  }
  res.json({
    type: 'league-rules',
    ok: true,
    rules: leagueRules,
    age_divisions: ageDivisions,
  });
});

module.exports = router;
