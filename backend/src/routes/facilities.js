const express = require('express');
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await db('facilities').orderBy('name');
    res.json(facilities);
  } catch (err) {
    console.error('Get facilities error:', err.message);
    res.status(500).json({ error: 'Failed to fetch facilities.' });
  }
});

// GET /api/facilities/:id
router.get('/:id', async (req, res) => {
  try {
    const facility = await db('facilities').where({ id: req.params.id }).first();

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found.' });
    }

    res.json(facility);
  } catch (err) {
    console.error('Get facility error:', err.message);
    res.status(500).json({ error: 'Failed to fetch facility.' });
  }
});

// POST /api/facilities
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, address, type, capacity, has_lights, has_parking,
      indoor, surface_type, available_days, available_hours_start,
      available_hours_end, hourly_rate, contact_phone, status,
    } = req.body;

    if (!name || !address || !type) {
      return res.status(400).json({ error: 'Missing required fields: name, address, type.' });
    }

    const [facility] = await db('facilities')
      .insert({
        name, address, type, capacity, has_lights, has_parking,
        indoor, surface_type, available_days, available_hours_start,
        available_hours_end, hourly_rate, contact_phone,
        status: status || 'active',
      })
      .returning('*');

    res.status(201).json(facility);
  } catch (err) {
    console.error('Create facility error:', err.message);
    res.status(500).json({ error: 'Failed to create facility.' });
  }
});

// PUT /api/facilities/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [updated] = await db('facilities')
      .where({ id: req.params.id })
      .update(req.body)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Facility not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update facility error:', err.message);
    res.status(500).json({ error: 'Failed to update facility.' });
  }
});

// DELETE /api/facilities/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await db('facilities').where({ id: req.params.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Facility not found.' });
    }

    res.json({ message: 'Facility deleted successfully.' });
  } catch (err) {
    console.error('Delete facility error:', err.message);
    res.status(500).json({ error: 'Failed to delete facility.' });
  }
});

module.exports = router;
