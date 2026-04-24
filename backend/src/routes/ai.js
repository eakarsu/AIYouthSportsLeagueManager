const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// POST /api/ai/team-balancing
router.post('/team-balancing', authenticate, async (req, res) => {
  try {
    const { teams, players } = req.body;

    if (!teams || !players || !teams.length || !players.length) {
      return res.status(400).json({ error: 'Teams and players arrays are required.' });
    }

    const systemPrompt = `You are an expert youth sports league coordinator specializing in team balancing. Your goal is to create fair and balanced teams that ensure competitive and enjoyable games for all players.

When balancing teams, consider:
- Skill level distribution (each team should have a similar average skill level)
- Age distribution (spread ages evenly across teams)
- Position coverage (each team needs players for key positions)
- Team size limits (respect max_players per team)

Return a JSON object with this structure:
{
  "assignments": [
    { "player_id": <number>, "player_name": "<string>", "recommended_team_id": <number>, "recommended_team_name": "<string>", "reason": "<string>" }
  ],
  "team_summaries": [
    { "team_id": <number>, "team_name": "<string>", "avg_skill": <number>, "player_count": <number>, "age_range": "<string>" }
  ],
  "balance_score": <number between 0-100>,
  "notes": "<string with overall analysis>"
}`;

    const userPrompt = `Please analyze the following teams and players, then suggest optimal team assignments for balanced competition.

Teams:
${JSON.stringify(teams, null, 2)}

Players (unassigned or to be rebalanced):
${JSON.stringify(players, null, 2)}

Provide balanced team assignments that minimize skill disparity between teams while considering age groups and positions.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    // Save to ai_analyses
    const [analysis] = await db('ai_analyses')
      .insert({
        type: 'team_balance',
        input_data: JSON.stringify({ teams, players }),
        output_data: JSON.stringify(aiResponse.result),
        model_used: aiResponse.model_used,
      })
      .returning('*');

    res.json({ analysis_id: analysis.id, ...aiResponse.result });
  } catch (err) {
    console.error('Team balancing error:', err.message);
    res.status(500).json({ error: 'Failed to generate team balancing analysis.' });
  }
});

// POST /api/ai/schedule-optimizer
router.post('/schedule-optimizer', authenticate, async (req, res) => {
  try {
    const { games, facilities, constraints } = req.body;

    if (!games || !facilities) {
      return res.status(400).json({ error: 'Games and facilities arrays are required.' });
    }

    const systemPrompt = `You are an expert sports schedule optimizer for a youth sports league. Your goal is to create optimal game schedules that maximize facility usage, minimize conflicts, and ensure fair scheduling for all teams.

Consider:
- Facility availability (days, hours, type)
- No team should play back-to-back games on the same day
- Even distribution of home/away games per team
- Travel time and facility proximity when possible
- Referee availability and assignment limits
- Rest days between games for youth players

Return a JSON object with this structure:
{
  "optimized_schedule": [
    { "game_id": <number>, "recommended_date": "<YYYY-MM-DD>", "recommended_time": "<HH:MM>", "facility_id": <number>, "facility_name": "<string>", "reason": "<string>" }
  ],
  "conflicts_resolved": [ "<description of each conflict resolved>" ],
  "facility_utilization": [
    { "facility_id": <number>, "facility_name": "<string>", "usage_percentage": <number> }
  ],
  "optimization_score": <number between 0-100>,
  "notes": "<string with overall analysis>"
}`;

    const userPrompt = `Optimize the following game schedule given these facilities and constraints.

Games to schedule:
${JSON.stringify(games, null, 2)}

Available facilities:
${JSON.stringify(facilities, null, 2)}

Constraints:
${JSON.stringify(constraints || { min_rest_days: 2, max_games_per_day_per_team: 1 }, null, 2)}

Provide an optimized schedule that minimizes conflicts and maximizes facility usage.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    const [analysis] = await db('ai_analyses')
      .insert({
        type: 'schedule_optimization',
        input_data: JSON.stringify({ games, facilities, constraints }),
        output_data: JSON.stringify(aiResponse.result),
        model_used: aiResponse.model_used,
      })
      .returning('*');

    res.json({ analysis_id: analysis.id, ...aiResponse.result });
  } catch (err) {
    console.error('Schedule optimizer error:', err.message);
    res.status(500).json({ error: 'Failed to generate schedule optimization.' });
  }
});

// POST /api/ai/referee-matcher
router.post('/referee-matcher', authenticate, async (req, res) => {
  try {
    const { games, referees } = req.body;

    if (!games || !referees || !games.length || !referees.length) {
      return res.status(400).json({ error: 'Games and referees arrays are required.' });
    }

    const systemPrompt = `You are an expert referee assignment coordinator for a youth sports league. Your goal is to optimally match referees to games based on their qualifications, availability, and workload.

Consider:
- Referee certification level vs. game importance/division
- Referee availability days vs. game dates
- Max games per week limit for each referee
- Referee experience and rating
- Referee specializations matching the sport/division
- Fair distribution of assignments among referees
- Avoid assigning a referee to games where there may be a conflict of interest

Return a JSON object with this structure:
{
  "assignments": [
    { "game_id": <number>, "referee_id": <number>, "referee_name": "<string>", "match_score": <number 0-100>, "reasons": ["<reason1>", "<reason2>"] }
  ],
  "unassigned_games": [ { "game_id": <number>, "reason": "<why no referee could be matched>" } ],
  "referee_workloads": [
    { "referee_id": <number>, "referee_name": "<string>", "assigned_games": <number>, "max_games": <number> }
  ],
  "overall_match_quality": <number between 0-100>,
  "notes": "<string with overall analysis>"
}`;

    const userPrompt = `Match the following referees to games based on experience, availability, and certification.

Games needing referees:
${JSON.stringify(games, null, 2)}

Available referees:
${JSON.stringify(referees, null, 2)}

Provide optimal referee-to-game assignments.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    const [analysis] = await db('ai_analyses')
      .insert({
        type: 'referee_assignment',
        input_data: JSON.stringify({ games, referees }),
        output_data: JSON.stringify(aiResponse.result),
        model_used: aiResponse.model_used,
      })
      .returning('*');

    res.json({ analysis_id: analysis.id, ...aiResponse.result });
  } catch (err) {
    console.error('Referee matcher error:', err.message);
    res.status(500).json({ error: 'Failed to generate referee matching analysis.' });
  }
});

// POST /api/ai/player-development
router.post('/player-development', authenticate, async (req, res) => {
  try {
    const { player, game_history, team_context } = req.body;

    if (!player) {
      return res.status(400).json({ error: 'Player data is required.' });
    }

    const systemPrompt = `You are an expert youth sports development coach and analyst. Your goal is to analyze player performance data and provide personalized development plans that help young athletes improve while keeping sports fun and age-appropriate.

Consider:
- Player's current skill level, age, and position
- Strengths and areas for improvement
- Age-appropriate training recommendations
- Physical and mental development stages
- Team context and how the player fits
- Injury prevention for youth athletes
- Fun factor - keeping young players engaged and motivated

Return a JSON object with this structure:
{
  "player_summary": {
    "name": "<string>",
    "current_skill": <number>,
    "potential_skill": <number>,
    "strengths": ["<strength1>", "<strength2>"],
    "areas_to_improve": ["<area1>", "<area2>"]
  },
  "development_plan": {
    "short_term_goals": [ { "goal": "<string>", "timeframe": "<string>", "drills": ["<drill1>", "<drill2>"] } ],
    "long_term_goals": [ { "goal": "<string>", "timeframe": "<string>", "milestones": ["<milestone1>"] } ],
    "recommended_position": "<string>",
    "training_focus_areas": [ { "area": "<string>", "priority": "<high/medium/low>", "description": "<string>" } ]
  },
  "age_appropriate_notes": "<string>",
  "parent_tips": "<string>",
  "notes": "<string with overall analysis>"
}`;

    const userPrompt = `Analyze the following player and create a personalized development plan.

Player profile:
${JSON.stringify(player, null, 2)}

${game_history ? `Game history / recent performance:\n${JSON.stringify(game_history, null, 2)}` : 'No game history available.'}

${team_context ? `Team context:\n${JSON.stringify(team_context, null, 2)}` : 'No team context available.'}

Provide a detailed, age-appropriate development plan for this young athlete.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    const [analysis] = await db('ai_analyses')
      .insert({
        type: 'player_development',
        input_data: JSON.stringify({ player, game_history, team_context }),
        output_data: JSON.stringify(aiResponse.result),
        model_used: aiResponse.model_used,
      })
      .returning('*');

    res.json({ analysis_id: analysis.id, ...aiResponse.result });
  } catch (err) {
    console.error('Player development error:', err.message);
    res.status(500).json({ error: 'Failed to generate player development analysis.' });
  }
});

// POST /api/ai/game-predictions
router.post('/game-predictions', authenticate, async (req, res) => {
  try {
    const { home_team, away_team, standings, head_to_head } = req.body;

    if (!home_team || !away_team) {
      return res.status(400).json({ error: 'Home team and away team data are required.' });
    }

    const systemPrompt = `You are an expert sports analyst specializing in youth league game predictions. Your predictions should be educational and fun, not used for gambling. Focus on helping coaches prepare and making games more exciting for players and parents.

Consider:
- Team win/loss records and recent form
- Head-to-head history
- Skill level averages of team rosters
- Home/away advantage
- Goal scoring and defensive records
- Team strengths and weaknesses

Return a JSON object with this structure:
{
  "prediction": {
    "favored_team": "<team_name>",
    "win_probability_home": <number 0-100>,
    "win_probability_away": <number 0-100>,
    "draw_probability": <number 0-100>,
    "predicted_score": { "home": <number>, "away": <number> },
    "confidence_level": "<high/medium/low>"
  },
  "key_factors": [
    { "factor": "<string>", "impact": "<positive/negative>", "affects_team": "<home/away>", "description": "<string>" }
  ],
  "matchup_analysis": {
    "home_strengths": ["<string>"],
    "home_weaknesses": ["<string>"],
    "away_strengths": ["<string>"],
    "away_weaknesses": ["<string>"]
  },
  "coaching_tips": {
    "home_team": "<string>",
    "away_team": "<string>"
  },
  "notes": "<string - remember this is youth sports, focus on development and fun>"
}`;

    const userPrompt = `Predict the outcome of the following youth league game and provide analysis.

Home Team:
${JSON.stringify(home_team, null, 2)}

Away Team:
${JSON.stringify(away_team, null, 2)}

${standings ? `Current Standings:\n${JSON.stringify(standings, null, 2)}` : 'No standings data available.'}

${head_to_head ? `Head-to-Head History:\n${JSON.stringify(head_to_head, null, 2)}` : 'No head-to-head history available.'}

Provide a fun and educational prediction with coaching insights.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    const [analysis] = await db('ai_analyses')
      .insert({
        type: 'matchup_prediction',
        input_data: JSON.stringify({ home_team, away_team, standings, head_to_head }),
        output_data: JSON.stringify(aiResponse.result),
        model_used: aiResponse.model_used,
      })
      .returning('*');

    res.json({ analysis_id: analysis.id, ...aiResponse.result });
  } catch (err) {
    console.error('Game predictions error:', err.message);
    res.status(500).json({ error: 'Failed to generate game predictions.' });
  }
});

// POST /api/ai/communication-generator
router.post('/communication-generator', authenticate, async (req, res) => {
  try {
    const { type, context, tone, audience, key_points } = req.body;

    if (!type || !context) {
      return res.status(400).json({ error: 'Communication type and context are required.' });
    }

    const systemPrompt = `You are a professional communications specialist for a youth sports league. You write clear, friendly, and professional communications to parents, coaches, referees, and other stakeholders.

Your writing style should be:
- Professional but warm and approachable
- Clear and concise, avoiding jargon
- Inclusive and respectful
- Age-appropriate when addressing young athletes
- Action-oriented with clear next steps when applicable

Return a JSON object with this structure:
{
  "communication": {
    "subject": "<string - email subject line or message title>",
    "body": "<string - the full formatted message>",
    "summary": "<string - one-line summary>"
  },
  "metadata": {
    "tone": "<formal/friendly/urgent/celebratory>",
    "audience": "<parents/coaches/all/team>",
    "suggested_type": "<announcement/alert/reminder/newsletter/message>",
    "suggested_priority": "<low/normal/high/urgent>"
  },
  "alternative_versions": {
    "short": "<string - SMS-length version>",
    "social_media": "<string - social media post version>"
  }
}`;

    const userPrompt = `Generate a professional communication for the youth sports league.

Communication type: ${type}
Audience: ${audience || 'parents'}
Tone: ${tone || 'friendly'}

Context / What this communication is about:
${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}

${key_points ? `Key points to include:\n${key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

Generate a polished, professional communication ready to send.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    const [analysis] = await db('ai_analyses')
      .insert({
        type: 'performance_trend',
        input_data: JSON.stringify({ type, context, tone, audience, key_points }),
        output_data: JSON.stringify(aiResponse.result),
        model_used: aiResponse.model_used,
      })
      .returning('*');

    res.json({ analysis_id: analysis.id, ...aiResponse.result });
  } catch (err) {
    console.error('Communication generator error:', err.message);
    res.status(500).json({ error: 'Failed to generate communication.' });
  }
});

module.exports = router;
