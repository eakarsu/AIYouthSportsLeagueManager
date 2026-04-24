const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/games - list all games with team names, facility name, referee name
router.get('/', async (req, res) => {
  try {
    const games = await db('games')
      .leftJoin('teams as home', 'games.home_team_id', 'home.id')
      .leftJoin('teams as away', 'games.away_team_id', 'away.id')
      .leftJoin('facilities', 'games.facility_id', 'facilities.id')
      .leftJoin('referees', 'games.referee_id', 'referees.id')
      .leftJoin('seasons', 'games.season_id', 'seasons.id')
      .select(
        'games.*',
        'home.name as home_team_name',
        'away.name as away_team_name',
        'facilities.name as facility_name',
        db.raw("CONCAT(referees.first_name, ' ', referees.last_name) as referee_name"),
        'seasons.name as season_name'
      )
      .orderBy('games.game_date', 'desc');

    res.json(games);
  } catch (err) {
    console.error('Get games error:', err.message);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
});

// GET /api/games/:id
router.get('/:id', async (req, res) => {
  try {
    const game = await db('games')
      .leftJoin('teams as home', 'games.home_team_id', 'home.id')
      .leftJoin('teams as away', 'games.away_team_id', 'away.id')
      .leftJoin('facilities', 'games.facility_id', 'facilities.id')
      .leftJoin('referees', 'games.referee_id', 'referees.id')
      .leftJoin('seasons', 'games.season_id', 'seasons.id')
      .select(
        'games.*',
        'home.name as home_team_name',
        'away.name as away_team_name',
        'facilities.name as facility_name',
        db.raw("CONCAT(referees.first_name, ' ', referees.last_name) as referee_name"),
        'seasons.name as season_name'
      )
      .where('games.id', req.params.id)
      .first();

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json(game);
  } catch (err) {
    console.error('Get game error:', err.message);
    res.status(500).json({ error: 'Failed to fetch game.' });
  }
});

// POST /api/games
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      home_team_id, away_team_id, facility_id, game_date, game_time,
      duration_minutes, status, home_score, away_score, season_id,
      referee_id, notes,
    } = req.body;

    if (!home_team_id || !away_team_id || !game_date || !game_time) {
      return res.status(400).json({ error: 'Missing required fields: home_team_id, away_team_id, game_date, game_time.' });
    }

    const [game] = await db('games')
      .insert({
        home_team_id, away_team_id, facility_id, game_date, game_time,
        duration_minutes: duration_minutes || 60,
        status: status || 'scheduled',
        home_score: home_score || 0,
        away_score: away_score || 0,
        season_id, referee_id, notes,
      })
      .returning('*');

    res.status(201).json(game);
  } catch (err) {
    console.error('Create game error:', err.message);
    res.status(500).json({ error: 'Failed to create game.' });
  }
});

// PUT /api/games/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('games')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update game error:', err.message);
    res.status(500).json({ error: 'Failed to update game.' });
  }
});

// DELETE /api/games/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('games').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json({ message: 'Game deleted successfully.' });
  } catch (err) {
    console.error('Delete game error:', err.message);
    res.status(500).json({ error: 'Failed to delete game.' });
  }
});

module.exports = router;
