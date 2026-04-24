const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/standings - list all standings with team name
router.get('/', async (req, res) => {
  try {
    const standings = await db('standings')
      .leftJoin('teams', 'standings.team_id', 'teams.id')
      .leftJoin('seasons', 'standings.season_id', 'seasons.id')
      .select(
        'standings.*',
        'teams.name as team_name',
        'seasons.name as season_name'
      )
      .orderBy('standings.points', 'desc');

    res.json(standings);
  } catch (err) {
    console.error('Get standings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch standings.' });
  }
});

// GET /api/standings/:id
router.get('/:id', async (req, res) => {
  try {
    const standing = await db('standings')
      .leftJoin('teams', 'standings.team_id', 'teams.id')
      .leftJoin('seasons', 'standings.season_id', 'seasons.id')
      .select(
        'standings.*',
        'teams.name as team_name',
        'seasons.name as season_name'
      )
      .where('standings.id', req.params.id)
      .first();

    if (!standing) {
      return res.status(404).json({ error: 'Standing not found.' });
    }

    res.json(standing);
  } catch (err) {
    console.error('Get standing error:', err.message);
    res.status(500).json({ error: 'Failed to fetch standing.' });
  }
});

// POST /api/standings
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      team_id, season_id, wins, losses, draws,
      points, goals_for, goals_against, goal_difference,
    } = req.body;

    if (!team_id || !season_id) {
      return res.status(400).json({ error: 'Missing required fields: team_id, season_id.' });
    }

    const [standing] = await db('standings')
      .insert({
        team_id, season_id,
        wins: wins || 0,
        losses: losses || 0,
        draws: draws || 0,
        points: points || 0,
        goals_for: goals_for || 0,
        goals_against: goals_against || 0,
        goal_difference: goal_difference || 0,
      })
      .returning('*');

    res.status(201).json(standing);
  } catch (err) {
    console.error('Create standing error:', err.message);
    res.status(500).json({ error: 'Failed to create standing.' });
  }
});

// PUT /api/standings/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('standings')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Standing not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update standing error:', err.message);
    res.status(500).json({ error: 'Failed to update standing.' });
  }
});

// DELETE /api/standings/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('standings').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Standing not found.' });
    }

    res.json({ message: 'Standing deleted successfully.' });
  } catch (err) {
    console.error('Delete standing error:', err.message);
    res.status(500).json({ error: 'Failed to delete standing.' });
  }
});

module.exports = router;
