const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/games', require('./routes/games'));
app.use('/api/referees', require('./routes/referees'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/seasons', require('./routes/seasons'));
app.use('/api/standings', require('./routes/standings'));
app.use('/api/ai', require('./routes/ai'));
// Apply pass 5 — backlog extensions (volunteers, fundraising, tournaments, recruitment, fair-play, LTAD)
app.use('/api/league-ext', require('./routes/extensions'));
app.use('/api/custom', require('./routes/customFeatures'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
// // === Batch 09 Gaps & Frontend Mounts ===
app.use('/api/gap-ai-aiyouthsportsleaguemanager', require('./routes/batch09GapAi')); // // === Batch 09 Gaps & Frontend Mounts ===
app.use('/api/gap-nonai-aiyouthsportsleaguemanager', require('./routes/batch09GapNonai')); // // === Batch 09 Gaps & Frontend Mounts ===

// Custom Views (League Views) - mounted BEFORE 404
app.use('/api/custom-views', require('./routes/customViews'));

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
});

const PORT = process.env.BACKEND_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;


