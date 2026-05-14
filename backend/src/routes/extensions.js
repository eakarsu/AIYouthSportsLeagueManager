// Apply pass 5 — Backlog implementation for AIYouthSportsLeagueManager
//
// Implements remaining backlog items from _AUDIT_NOTE.md (cap 10):
//   1. Volunteer matching          (NEEDS-PRODUCT-DECISION) — registry + score
//   2. Fundraising tracking        (NEEDS-PRODUCT-DECISION) — campaigns + donations
//   3. Tournament support          (NEEDS-PRODUCT-DECISION) — tournament + bracket entries
//   4. College recruitment pipeline (NEEDS-PRODUCT-DECISION) — opt-in profiles
//   5. Fair play / bias monitoring (TOO-RISKY → AI text)    — text-grounded review
//   6. LTAD framework              (TOO-RISKY → AI text)    — stage progression report
//
// Env vars consumed (NEEDS-CREDS): none new — AI endpoints reuse OPENROUTER_API_KEY (503 + missing if unset).
// Tables created idempotently via CREATE TABLE IF NOT EXISTS using the existing knex `db` raw runner.

const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

function isMissingKeyError(err) {
  const msg = err && err.message ? String(err.message) : '';
  return msg.includes('OPENROUTER_API_KEY is not configured');
}

async function ensureTables() {
  try {
    await db.raw(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name VARCHAR(150),
        contact VARCHAR(150),
        skills TEXT[],
        availability JSONB,
        background_check_status VARCHAR(40) DEFAULT 'unknown',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS volunteer_assignments (
        id SERIAL PRIMARY KEY,
        volunteer_id INTEGER,
        team_id INTEGER,
        role VARCHAR(80),
        match_score INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS fundraising_campaigns (
        id SERIAL PRIMARY KEY,
        season_id INTEGER,
        name VARCHAR(150),
        goal_amount NUMERIC(12,2),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS fundraising_donations (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER,
        donor_name VARCHAR(150),
        amount NUMERIC(12,2),
        anonymous BOOLEAN DEFAULT FALSE,
        notes TEXT,
        received_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150),
        season_id INTEGER,
        format VARCHAR(40),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tournament_brackets (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER,
        round INTEGER,
        seed_a INTEGER,
        seed_b INTEGER,
        team_a INTEGER,
        team_b INTEGER,
        winner_team_id INTEGER,
        scheduled_for TIMESTAMP,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS recruitment_profiles (
        id SERIAL PRIMARY KEY,
        player_id INTEGER,
        opt_in BOOLEAN DEFAULT FALSE,
        academic_gpa NUMERIC(4,2),
        graduation_year INTEGER,
        target_division VARCHAR(20),
        contact_email VARCHAR(120),
        consent_recorded_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS fair_play_reports (
        id SERIAL PRIMARY KEY,
        game_id INTEGER,
        ai_summary JSONB,
        flags TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ltad_progressions (
        id SERIAL PRIMARY KEY,
        player_id INTEGER,
        ai_summary JSONB,
        stage VARCHAR(40),
        next_focus TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.error('extensions ensureTables (youth-sports) failed (non-fatal):', e.message);
  }
}
ensureTables();

// ───────────────────────────────────────────────────────────────────────────
// 1. Volunteer matching (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: simple skill-overlap score (0-100). Background-check
//   status defaults to 'unknown' until external integration exists.
// ───────────────────────────────────────────────────────────────────────────
router.post('/volunteers', authenticate, async (req, res) => {
  try {
    const { name, contact, skills, availability, background_check_status } = req.body;
    const [row] = await db('volunteers').insert({
      user_id: req.user?.id || null,
      name, contact,
      skills: skills || [],
      availability: availability ? JSON.stringify(availability) : null,
      background_check_status: background_check_status || 'unknown',
    }).returning('*');
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/volunteers', authenticate, async (req, res) => {
  try {
    const rows = await db('volunteers').select('*').orderBy('created_at', 'desc').limit(200);
    res.json({ volunteers: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/volunteers/match', authenticate, async (req, res) => {
  try {
    const { team_id, required_skills, role } = req.body;
    if (!Array.isArray(required_skills) || !required_skills.length) {
      return res.status(400).json({ error: 'required_skills array required' });
    }
    const reqSet = new Set(required_skills.map(s => String(s).toLowerCase()));
    const vols = await db('volunteers').select('*');
    const scored = vols.map(v => {
      const have = new Set((v.skills || []).map(s => String(s).toLowerCase()));
      const overlap = [...reqSet].filter(s => have.has(s)).length;
      const score = Math.round((overlap / reqSet.size) * 100);
      return { volunteer_id: v.id, name: v.name, score, missing_skills: [...reqSet].filter(s => !have.has(s)) };
    }).sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5);
    // Persist top-scoring assignment (non-binding) for audit
    if (top.length && team_id) {
      await db('volunteer_assignments').insert({
        volunteer_id: top[0].volunteer_id, team_id, role: role || 'unassigned',
        match_score: top[0].score, notes: 'auto-suggested by /volunteers/match',
      }).catch(() => {});
    }
    res.json({ top, total_candidates: vols.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Fundraising tracking (NEEDS-PRODUCT-DECISION)
// ───────────────────────────────────────────────────────────────────────────
router.post('/fundraising/campaigns', authenticate, async (req, res) => {
  try {
    const { season_id, name, goal_amount, start_date, end_date, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const [row] = await db('fundraising_campaigns').insert({
      season_id: season_id || null, name, goal_amount: goal_amount || 0,
      start_date: start_date || null, end_date: end_date || null,
      status: status || 'active',
    }).returning('*');
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/fundraising/campaigns', authenticate, async (req, res) => {
  try {
    const rows = await db('fundraising_campaigns').select('*').orderBy('created_at', 'desc');
    res.json({ campaigns: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fundraising/campaigns/:id/donations', authenticate, async (req, res) => {
  try {
    const { donor_name, amount, anonymous, notes } = req.body;
    if (amount == null) return res.status(400).json({ error: 'amount required' });
    const [row] = await db('fundraising_donations').insert({
      campaign_id: parseInt(req.params.id, 10),
      donor_name: anonymous ? null : (donor_name || null),
      amount, anonymous: !!anonymous, notes: notes || null,
    }).returning('*');
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/fundraising/campaigns/:id/summary', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const camp = await db('fundraising_campaigns').where({ id }).first();
    if (!camp) return res.status(404).json({ error: 'Not found' });
    const totals = await db('fundraising_donations').where({ campaign_id: id })
      .sum({ raised: 'amount' }).count({ donations: 'id' }).first();
    res.json({ campaign: camp, raised: Number(totals.raised || 0), donations: Number(totals.donations || 0), goal: Number(camp.goal_amount || 0) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Tournament support (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: store tournament metadata + bracket rows; scheduling +
//   live scoring delegated to existing /api/games endpoints.
// ───────────────────────────────────────────────────────────────────────────
router.post('/tournaments', authenticate, async (req, res) => {
  try {
    const { name, season_id, format, start_date, end_date, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const [row] = await db('tournaments').insert({
      name, season_id: season_id || null, format: format || 'single-elimination',
      start_date: start_date || null, end_date: end_date || null,
      status: status || 'planned',
    }).returning('*');
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tournaments', authenticate, async (req, res) => {
  try {
    const rows = await db('tournaments').select('*').orderBy('created_at', 'desc');
    res.json({ tournaments: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tournaments/:id/brackets', authenticate, async (req, res) => {
  try {
    const { round, seed_a, seed_b, team_a, team_b, scheduled_for, notes } = req.body;
    const [row] = await db('tournament_brackets').insert({
      tournament_id: parseInt(req.params.id, 10),
      round: round || 1,
      seed_a: seed_a || null, seed_b: seed_b || null,
      team_a: team_a || null, team_b: team_b || null,
      scheduled_for: scheduled_for || null, notes: notes || null,
    }).returning('*');
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tournaments/:id/brackets', authenticate, async (req, res) => {
  try {
    const rows = await db('tournament_brackets').where({ tournament_id: parseInt(req.params.id, 10) }).orderBy('round', 'asc');
    res.json({ brackets: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────────────────
// 4. College recruitment pipeline (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: opt_in MUST be true to surface in queries; consent timestamp
//   is captured; minor-protection guidance left to org policy.
// ───────────────────────────────────────────────────────────────────────────
router.post('/recruitment/profiles', authenticate, async (req, res) => {
  try {
    const { player_id, opt_in, academic_gpa, graduation_year, target_division, contact_email, notes } = req.body;
    if (!player_id) return res.status(400).json({ error: 'player_id required' });
    const [row] = await db('recruitment_profiles').insert({
      player_id, opt_in: !!opt_in,
      academic_gpa: academic_gpa || null, graduation_year: graduation_year || null,
      target_division: target_division || null, contact_email: contact_email || null,
      consent_recorded_at: opt_in ? db.fn.now() : null,
      notes: notes || null,
    }).returning('*');
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recruitment/profiles', authenticate, async (req, res) => {
  try {
    const rows = await db('recruitment_profiles').where({ opt_in: true }).select('*').orderBy('created_at', 'desc');
    res.json({ profiles: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Fair play / bias monitoring (TOO-RISKY → AI text-grounded)
// 503 if OPENROUTER_API_KEY missing.
// ───────────────────────────────────────────────────────────────────────────
router.post('/fair-play/review', authenticate, async (req, res) => {
  try {
    const { game_id, playing_time_minutes_by_player, referee_calls, incidents } = req.body;
    const systemPrompt = `You are a fair-play and bias auditor for a youth sports league. Review playing-time distribution, referee calls, and reported incidents to flag potential bias or inequity. Be conservative; emphasize that flags are signals not verdicts. Return JSON: { fairness_score (0-100), flags: [string], playing_time_review: object, referee_pattern_review: object, recommendations: [string], disclaimer: string }`;
    const userPrompt = `Playing time minutes by player:\n${JSON.stringify(playing_time_minutes_by_player || {}, null, 2)}\n\nReferee calls:\n${JSON.stringify(referee_calls || [], null, 2)}\n\nIncidents:\n${JSON.stringify(incidents || [], null, 2)}`;
    let aiResponse;
    try {
      aiResponse = await callOpenRouter(systemPrompt, userPrompt);
    } catch (err) {
      if (isMissingKeyError(err)) return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
      throw err;
    }
    try {
      await db('fair_play_reports').insert({
        game_id: game_id || null,
        ai_summary: JSON.stringify(aiResponse.result || {}),
        flags: (aiResponse.result && aiResponse.result.flags) || [],
      });
    } catch (_) { /* non-fatal */ }
    res.json({ ...aiResponse.result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ───────────────────────────────────────────────────────────────────────────
// 6. LTAD framework integration (TOO-RISKY → AI text)
// 503 if OPENROUTER_API_KEY missing.
// ───────────────────────────────────────────────────────────────────────────
router.post('/ltad/progression', authenticate, async (req, res) => {
  try {
    const { player } = req.body;
    if (!player) return res.status(400).json({ error: 'player required' });
    const systemPrompt = `You are a Long-Term Athlete Development (LTAD) coach. Given player age, history, and recent metrics, suggest the LTAD stage (Active Start, FUNdamentals, Learn to Train, Train to Train, Train to Compete, Train to Win, Active for Life) and the next-90-day developmental focus. Reply ONLY with JSON: { stage: string, rationale: string, next_focus: string, drills: [string], milestones: [string], cautions: [string] }`;
    const userPrompt = `Player profile:\n${JSON.stringify(player, null, 2)}`;
    let aiResponse;
    try {
      aiResponse = await callOpenRouter(systemPrompt, userPrompt);
    } catch (err) {
      if (isMissingKeyError(err)) return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
      throw err;
    }
    try {
      await db('ltad_progressions').insert({
        player_id: player.id || null,
        ai_summary: JSON.stringify(aiResponse.result || {}),
        stage: (aiResponse.result && aiResponse.result.stage) || null,
        next_focus: (aiResponse.result && aiResponse.result.next_focus) || null,
      });
    } catch (_) { /* non-fatal */ }
    res.json({ ...aiResponse.result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
