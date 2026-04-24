const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/communications
router.get('/', async (req, res) => {
  try {
    const communications = await db('communications')
      .leftJoin('users', 'communications.sender_id', 'users.id')
      .leftJoin('teams', 'communications.team_id', 'teams.id')
      .select(
        'communications.*',
        'users.name as sender_name',
        'teams.name as team_name'
      )
      .orderBy('communications.created_at', 'desc');

    res.json(communications);
  } catch (err) {
    console.error('Get communications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch communications.' });
  }
});

// GET /api/communications/:id
router.get('/:id', async (req, res) => {
  try {
    const communication = await db('communications')
      .leftJoin('users', 'communications.sender_id', 'users.id')
      .leftJoin('teams', 'communications.team_id', 'teams.id')
      .select(
        'communications.*',
        'users.name as sender_name',
        'teams.name as team_name'
      )
      .where('communications.id', req.params.id)
      .first();

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found.' });
    }

    res.json(communication);
  } catch (err) {
    console.error('Get communication error:', err.message);
    res.status(500).json({ error: 'Failed to fetch communication.' });
  }
});

// POST /api/communications
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, message, type, priority, sender_id,
      recipient_type, recipient_id, team_id, status, sent_at,
    } = req.body;

    if (!title || !message || !type || !recipient_type) {
      return res.status(400).json({ error: 'Missing required fields: title, message, type, recipient_type.' });
    }

    const [communication] = await db('communications')
      .insert({
        title, message, type,
        priority: priority || 'normal',
        sender_id: sender_id || req.user.id,
        recipient_type, recipient_id, team_id,
        status: status || 'draft',
        sent_at,
      })
      .returning('*');

    res.status(201).json(communication);
  } catch (err) {
    console.error('Create communication error:', err.message);
    res.status(500).json({ error: 'Failed to create communication.' });
  }
});

// PUT /api/communications/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('communications')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Communication not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update communication error:', err.message);
    res.status(500).json({ error: 'Failed to update communication.' });
  }
});

// DELETE /api/communications/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('communications').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Communication not found.' });
    }

    res.json({ message: 'Communication deleted successfully.' });
  } catch (err) {
    console.error('Delete communication error:', err.message);
    res.status(500).json({ error: 'Failed to delete communication.' });
  }
});

module.exports = router;
