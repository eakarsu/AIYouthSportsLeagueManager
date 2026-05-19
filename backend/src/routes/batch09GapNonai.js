// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-nonai endpoints for AIYouthSportsLeagueManager.
// Calls OpenRouter via native fetch (no SDK); lazily creates gap_features table.
const express = require('express');
const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runAI(system, user) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY missing'); e.statusCode = 503; throw e;
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }
    ], max_tokens: 1500, temperature: 0.4 })
  });
  if (!r.ok) { const e = new Error(`AI ${r.status}`); e.statusCode = 502; throw e; }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '';
  let parsed = null;
  try { const m = content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
  return { raw: content, parsed, model: data?.model };
}

let _persistInit = false;
async function persist(feature, input, output) {
  // Lazy gap_features table — best-effort, swallow errors so AI still works.
  try {
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    if (!_persistInit) {
      await p.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS gap_features (id SERIAL PRIMARY KEY, feature TEXT, input JSONB, output JSONB, created_at TIMESTAMPTZ DEFAULT NOW())');
      _persistInit = true;
    }
    await p.$executeRawUnsafe('INSERT INTO gap_features(feature, input, output) VALUES ($1, $2::jsonb, $3::jsonb)', feature, JSON.stringify(input || {}), JSON.stringify(output || {}));
  } catch { /* swallow */ }
}

// POST /api/gap-nonai-aiyouthsportsleaguemanager/parent-volunteer-coordination
// Parent volunteer coordination
router.post('/parent-volunteer-coordination', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Parent volunteer coordination\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('parent-volunteer-coordination', req.body, ai);
    res.json({ feature: 'parent-volunteer-coordination', title: 'Parent volunteer coordination', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiyouthsportsleaguemanager/fundraising-and-sponsor-tracking
// Fundraising and sponsor tracking
router.post('/fundraising-and-sponsor-tracking', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Fundraising and sponsor tracking\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('fundraising-and-sponsor-tracking', req.body, ai);
    res.json({ feature: 'fundraising-and-sponsor-tracking', title: 'Fundraising and sponsor tracking', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiyouthsportsleaguemanager/facility-reservation-workflow
// Facility reservation workflow
router.post('/facility-reservation-workflow', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Facility reservation workflow\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('facility-reservation-workflow', req.body, ai);
    res.json({ feature: 'facility-reservation-workflow', title: 'Facility reservation workflow', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiyouthsportsleaguemanager/tournamentbracket-support
// Tournament/bracket support
router.post('/tournamentbracket-support', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Tournament/bracket support\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('tournamentbracket-support', req.body, ai);
    res.json({ feature: 'tournamentbracket-support', title: 'Tournament/bracket support', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiyouthsportsleaguemanager/skill-certification-coaching-credentials
// Skill certification / coaching credentials
router.post('/skill-certification-coaching-credentials', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Skill certification / coaching credentials\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('skill-certification-coaching-credentials', req.body, ai);
    res.json({ feature: 'skill-certification-coaching-credentials', title: 'Skill certification / coaching credentials', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiyouthsportsleaguemanager/registration-fee-payment-processing
// Registration / fee payment processing
router.post('/registration-fee-payment-processing', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Registration / fee payment processing\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('registration-fee-payment-processing', req.body, ai);
    res.json({ feature: 'registration-fee-payment-processing', title: 'Registration / fee payment processing', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiyouthsportsleaguemanager/photo-video-archive-per-game
// Photo / video archive per game
router.post('/photo-video-archive-per-game', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Photo / video archive per game\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('photo-video-archive-per-game', req.body, ai);
    res.json({ feature: 'photo-video-archive-per-game', title: 'Photo / video archive per game', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
