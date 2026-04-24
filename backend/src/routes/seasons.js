const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/seasons
router.get('/', async (req, res) => {
  try {
    const seasons = await db('seasons').orderBy('start_date', 'desc');
    res.json(seasons);
  } catch (err) {
    console.error('Get seasons error:', err.message);
    res.status(500).json({ error: 'Failed to fetch seasons.' });
  }
});

// GET /api/seasons/:id
router.get('/:id', async (req, res) => {
  try {
    const season = await db('seasons').where({ id: req.params.id }).first();

    if (!season) {
      return res.status(404).json({ error: 'Season not found.' });
    }

    res.json(season);
  } catch (err) {
    console.error('Get season error:', err.message);
    res.status(500).json({ error: 'Failed to fetch season.' });
  }
});

// POST /api/seasons
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, start_date, end_date, registration_deadline,
      status, max_teams, division, age_group,
    } = req.body;

    if (!name || !start_date || !end_date || !registration_deadline) {
      return res.status(400).json({ error: 'Missing required fields: name, start_date, end_date, registration_deadline.' });
    }

    const [season] = await db('seasons')
      .insert({
        name, start_date, end_date, registration_deadline,
        status: status || 'upcoming',
        max_teams: max_teams || 16,
        division, age_group,
      })
      .returning('*');

    res.status(201).json(season);
  } catch (err) {
    console.error('Create season error:', err.message);
    res.status(500).json({ error: 'Failed to create season.' });
  }
});

// PUT /api/seasons/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('seasons')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Season not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update season error:', err.message);
    res.status(500).json({ error: 'Failed to update season.' });
  }
});

// DELETE /api/seasons/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('seasons').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Season not found.' });
    }

    res.json({ message: 'Season deleted successfully.' });
  } catch (err) {
    console.error('Delete season error:', err.message);
    res.status(500).json({ error: 'Failed to delete season.' });
  }
});

module.exports = router;
