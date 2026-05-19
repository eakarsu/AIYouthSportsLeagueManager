// Custom feature endpoints (batch_09 audit suggestions)
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

function parseJSON(t) {
  if (!t) return null;
  const c = String(t).replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const m = c.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function ask(system, user, label, res) {
  try {
    const r = await callOpenRouter(system, user);
    const content = typeof r === 'string' ? r : (r?.content || r?.choices?.[0]?.message?.content || '');
    res.json({ type: label, result: parseJSON(content) || { raw: content } });
  } catch (e) {
    if (/OPENROUTER_API_KEY/i.test(e.message)) return res.status(503).json({ error: 'AI not configured' });
    console.error(`${label} error:`, e.message);
    res.status(500).json({ error: e.message });
  }
}

// 1. Predictive injury risk based on play patterns
router.post('/injury-risk', authenticate, async (req, res) => {
  const { player, recent_games, training_load } = req.body || {};
  if (!player) return res.status(400).json({ error: 'player required' });
  return ask(
    'You evaluate youth athlete injury risk from play patterns and training load. Conservative, age-appropriate. JSON only.',
    `PLAYER: ${JSON.stringify(player)}\nRECENT_GAMES: ${JSON.stringify(recent_games || []).slice(0,2500)}\nTRAINING_LOAD: ${JSON.stringify(training_load || {})}\nReturn JSON {"injury_risk":"low|moderate|high","contributing_signals":[""],"recommended_rest_days":0,"warm_up_protocol":[""],"flag_for_parent_conversation":false}`,
    'injury-risk', res
  );
});

// 2. Parent volunteer matching with league needs
router.post('/volunteer-match', authenticate, async (req, res) => {
  const { volunteers, league_needs } = req.body || {};
  if (!Array.isArray(volunteers) || !Array.isArray(league_needs)) return res.status(400).json({ error: 'volunteers and league_needs arrays required' });
  return ask(
    'You match parent volunteers to league needs by skill and availability. JSON only.',
    `VOLUNTEERS: ${JSON.stringify(volunteers.slice(0,40))}\nNEEDS: ${JSON.stringify(league_needs)}\nReturn JSON {"matches":[{"volunteer_id":"","role":"","why":""}],"unfilled_roles":[""],"recommended_outreach":[""]}`,
    'volunteer-match', res
  );
});

// 3. College recruitment pipeline identification
router.post('/recruitment-pipeline', authenticate, async (req, res) => {
  const { player, performance_stats, academic_signals } = req.body || {};
  if (!player) return res.status(400).json({ error: 'player required' });
  return ask(
    'You evaluate youth-athlete college recruitment readiness — sensitive, age-appropriate, no premature pressure. JSON only.',
    `PLAYER: ${JSON.stringify(player)}\nSTATS: ${JSON.stringify(performance_stats || {})}\nACADEMICS: ${JSON.stringify(academic_signals || {})}\nReturn JSON {"recruitment_stage":"explore|develop|target","strength_areas":[""],"development_priorities":[""],"next_milestones":[{"name":"","by_date":""}]}`,
    'recruitment-pipeline', res
  );
});

// 4. Fair-play monitoring with bias detection
router.post('/fair-play-bias', authenticate, async (req, res) => {
  const { game_logs, referee, demographics } = req.body || {};
  if (!Array.isArray(game_logs)) return res.status(400).json({ error: 'game_logs required' });
  return ask(
    'You scan game logs for fair-play and potential referee bias. JSON only.',
    `LOGS: ${JSON.stringify(game_logs.slice(0,40))}\nREFEREE: ${JSON.stringify(referee || {})}\nDEMO: ${JSON.stringify(demographics || {})}\nReturn JSON {"bias_indicators":[{"signal":"","severity":"low|med|high"}],"fair_play_score":0,"recommendations":[""]}`,
    'fair-play-bias', res
  );
});

// 5. Spectator experience optimization
router.post('/spectator-experience', authenticate, async (req, res) => {
  const { venue, expected_attendance, concessions, parking } = req.body || {};
  if (!venue) return res.status(400).json({ error: 'venue required' });
  return ask(
    'You optimize spectator experience at youth-sports games. JSON only.',
    `VENUE: ${venue}\nATTENDANCE: ${expected_attendance || 'unknown'}\nCONCESSIONS: ${JSON.stringify(concessions || {})}\nPARKING: ${JSON.stringify(parking || {})}\nReturn JSON {"staffing_plan":[{"role":"","count":0}],"concession_menu":[{"item":"","qty":0,"price_usd":0}],"parking_flow":"","family_amenities":[""]}`,
    'spectator-experience', res
  );
});

// 6. Postgame summary generation for parents
router.post('/postgame-summary', authenticate, async (req, res) => {
  const { game, players_highlights } = req.body || {};
  if (!game) return res.status(400).json({ error: 'game required' });
  return ask(
    'You write a positive, age-appropriate postgame summary for parents. JSON only.',
    `GAME: ${JSON.stringify(game)}\nHIGHLIGHTS: ${JSON.stringify(players_highlights || [])}\nReturn JSON {"headline":"","body":"","per_player_shoutouts":[{"player_id":"","note":""}],"share_friendly_copy":""}`,
    'postgame-summary', res
  );
});

// 7. Integration with youth development frameworks (LTAD)
router.post('/ltad-alignment', authenticate, async (req, res) => {
  const { player_age, current_training_plan } = req.body || {};
  if (!player_age) return res.status(400).json({ error: 'player_age required' });
  return ask(
    'You align a training plan with Long-Term Athlete Development (LTAD) stages. JSON only.',
    `AGE: ${player_age}\nPLAN: ${JSON.stringify(current_training_plan || {})}\nReturn JSON {"ltad_stage":"","fit_with_stage":"good|partial|misaligned","adjustments":[""],"recommended_focus_areas":[""]}`,
    'ltad-alignment', res
  );
});

// 8. Fundraising automation with sponsor matching
// TODO: configure credentials for SPONSORSHIP_DB_API_KEY (local sponsor directory).
router.post('/sponsor-match', authenticate, async (req, res) => {
  const { league, budget_target_usd, community_profile } = req.body || {};
  if (!budget_target_usd) return res.status(400).json({ error: 'budget_target_usd required' });
  return ask(
    `You suggest local sponsors and outreach copy. Sponsor DB: ${Boolean(process.env.SPONSORSHIP_DB_API_KEY)}. JSON only.`,
    `LEAGUE: ${JSON.stringify(league || {})}\nBUDGET: ${budget_target_usd}\nCOMMUNITY: ${JSON.stringify(community_profile || {})}\nReturn JSON {"target_sponsors":[{"name":"","industry":"","fit_score":0,"ask_usd":0}],"outreach_template":"","tiered_packages":[{"tier":"","price_usd":0,"benefits":[""]}]}`,
    'sponsor-match', res
  );
});

module.exports = router;
