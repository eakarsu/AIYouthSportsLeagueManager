const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/teams - list all teams with facility name and player count
router.get('/', async (req, res) => {
  try {
    const teams = await db('teams')
      .leftJoin('facilities', 'teams.home_facility_id', 'facilities.id')
      .leftJoin('seasons', 'teams.season_id', 'seasons.id')
      .select(
        'teams.*',
        'facilities.name as facility_name',
        'seasons.name as season_name'
      )
      .orderBy('teams.name');

    // Get player counts
    const playerCounts = await db('players')
      .select('team_id')
      .count('id as player_count')
      .whereNotNull('team_id')
      .groupBy('team_id');

    const countMap = {};
    playerCounts.forEach((row) => {
      countMap[row.team_id] = parseInt(row.player_count, 10);
    });

    const result = teams.map((team) => ({
      ...team,
      player_count: countMap[team.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get teams error:', err.message);
    res.status(500).json({ error: 'Failed to fetch teams.' });
  }
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  try {
    const team = await db('teams')
      .leftJoin('facilities', 'teams.home_facility_id', 'facilities.id')
      .leftJoin('seasons', 'teams.season_id', 'seasons.id')
      .select(
        'teams.*',
        'facilities.name as facility_name',
        'seasons.name as season_name'
      )
      .where('teams.id', req.params.id)
      .first();

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const playerCount = await db('players')
      .where({ team_id: team.id })
      .count('id as count')
      .first();

    team.player_count = parseInt(playerCount.count, 10);

    res.json(team);
  } catch (err) {
    console.error('Get team error:', err.message);
    res.status(500).json({ error: 'Failed to fetch team.' });
  }
});

// POST /api/teams
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, division, age_group, head_coach, assistant_coach,
      max_players, home_facility_id, season_id,
    } = req.body;

    if (!name || !division || !age_group) {
      return res.status(400).json({ error: 'Missing required fields: name, division, age_group.' });
    }

    const [team] = await db('teams')
      .insert({
        name, division, age_group, head_coach, assistant_coach,
        max_players: max_players || 18,
        home_facility_id, season_id,
      })
      .returning('*');

    res.status(201).json(team);
  } catch (err) {
    console.error('Create team error:', err.message);
    res.status(500).json({ error: 'Failed to create team.' });
  }
});

// PUT /api/teams/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('teams')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update team error:', err.message);
    res.status(500).json({ error: 'Failed to update team.' });
  }
});

// DELETE /api/teams/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('teams').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.json({ message: 'Team deleted successfully.' });
  } catch (err) {
    console.error('Delete team error:', err.message);
    res.status(500).json({ error: 'Failed to delete team.' });
  }
});

module.exports = router;
