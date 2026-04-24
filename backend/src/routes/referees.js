const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/referees
router.get('/', async (req, res) => {
  try {
    const referees = await db('referees').orderBy('last_name');
    res.json(referees);
  } catch (err) {
    console.error('Get referees error:', err.message);
    res.status(500).json({ error: 'Failed to fetch referees.' });
  }
});

// GET /api/referees/:id
router.get('/:id', async (req, res) => {
  try {
    const referee = await db('referees').where({ id: req.params.id }).first();

    if (!referee) {
      return res.status(404).json({ error: 'Referee not found.' });
    }

    res.json(referee);
  } catch (err) {
    console.error('Get referee error:', err.message);
    res.status(500).json({ error: 'Failed to fetch referee.' });
  }
});

// POST /api/referees
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, certification_level,
      years_experience, max_games_per_week, availability_days,
      specializations, rating, status,
    } = req.body;

    if (!first_name || !last_name || !email || !certification_level) {
      return res.status(400).json({ error: 'Missing required fields: first_name, last_name, email, certification_level.' });
    }

    const [referee] = await db('referees')
      .insert({
        first_name, last_name, email, phone, certification_level,
        years_experience: years_experience || 0,
        max_games_per_week: max_games_per_week || 3,
        availability_days, specializations, rating,
        status: status || 'active',
      })
      .returning('*');

    res.status(201).json(referee);
  } catch (err) {
    console.error('Create referee error:', err.message);
    res.status(500).json({ error: 'Failed to create referee.' });
  }
});

// PUT /api/referees/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('referees')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Referee not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update referee error:', err.message);
    res.status(500).json({ error: 'Failed to update referee.' });
  }
});

// DELETE /api/referees/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('referees').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Referee not found.' });
    }

    res.json({ message: 'Referee deleted successfully.' });
  } catch (err) {
    console.error('Delete referee error:', err.message);
    res.status(500).json({ error: 'Failed to delete referee.' });
  }
});

module.exports = router;
