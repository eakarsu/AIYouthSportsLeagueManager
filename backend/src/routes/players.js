const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/players - list all players with team name
router.get('/', async (req, res) => {
  try {
    const players = await db('players')
      .leftJoin('teams', 'players.team_id', 'teams.id')
      .select(
        'players.*',
        'teams.name as team_name'
      )
      .orderBy('players.last_name');

    res.json(players);
  } catch (err) {
    console.error('Get players error:', err.message);
    res.status(500).json({ error: 'Failed to fetch players.' });
  }
});

// GET /api/players/:id - single player with details
router.get('/:id', async (req, res) => {
  try {
    const player = await db('players')
      .leftJoin('teams', 'players.team_id', 'teams.id')
      .leftJoin('seasons', 'players.season_id', 'seasons.id')
      .select(
        'players.*',
        'teams.name as team_name',
        'seasons.name as season_name'
      )
      .where('players.id', req.params.id)
      .first();

    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    res.json(player);
  } catch (err) {
    console.error('Get player error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player.' });
  }
});

// POST /api/players - create player
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      first_name, last_name, age, date_of_birth, gender,
      skill_level, position, team_id, parent_email, parent_phone,
      emergency_contact, medical_notes, status, season_id,
    } = req.body;

    if (!first_name || !last_name || !age || !date_of_birth || !gender || !parent_email) {
      return res.status(400).json({ error: 'Missing required fields: first_name, last_name, age, date_of_birth, gender, parent_email.' });
    }

    const [player] = await db('players')
      .insert({
        first_name, last_name, age, date_of_birth, gender,
        skill_level: skill_level || 5,
        position, team_id, parent_email, parent_phone,
        emergency_contact, medical_notes,
        status: status || 'active',
        season_id,
      })
      .returning('*');

    res.status(201).json(player);
  } catch (err) {
    console.error('Create player error:', err.message);
    res.status(500).json({ error: 'Failed to create player.' });
  }
});

// PUT /api/players/:id - update player
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('players')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update player error:', err.message);
    res.status(500).json({ error: 'Failed to update player.' });
  }
});

// DELETE /api/players/:id - delete player
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('players').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    res.json({ message: 'Player deleted successfully.' });
  } catch (err) {
    console.error('Delete player error:', err.message);
    res.status(500).json({ error: 'Failed to delete player.' });
  }
});

module.exports = router;
