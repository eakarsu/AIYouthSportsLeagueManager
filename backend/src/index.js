const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { validateRuntime } = require('../governance/runtime');
validateRuntime();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { authenticate } = require('./middleware/auth');
const { createProviderGate } = require('../governance/providerGate');
const db = require('./db/connection');
const bcrypt = require('bcryptjs');

const app = express();
const port = Number(process.env.BACKEND_PORT || 3001);
const origins = String(process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map((value) => value.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin(origin, callback) {
  if (!origin || origins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS.'));
}, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AIYouthSportsLeagueManager', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governance', require('../governance/router'));

app.use('/api', authenticate);
const protectedRoutes = [
  ['/api/players','./routes/players'],['/api/teams','./routes/teams'],
  ['/api/facilities','./routes/facilities'],['/api/games','./routes/games'],
  ['/api/referees','./routes/referees'],['/api/communications','./routes/communications'],
  ['/api/seasons','./routes/seasons'],['/api/standings','./routes/standings']
];
for (const [mount, modulePath] of protectedRoutes) app.use(mount, require(modulePath));

const providerGate = createProviderGate(['/api/ai','/api/league-ext','/api/custom','/api/gap']);
app.use(providerGate);
if (process.env.ENABLE_LEGACY_PROVIDER_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  app.use('/api/ai', require('./routes/ai'));
  app.use('/api/league-ext', require('./routes/extensions'));
  app.use('/api/custom', require('./routes/customFeatures'));
  app.use('/api/custom-views', require('./routes/customViews'));
  app.use('/api/gap-ai-aiyouthsportsleaguemanager', require('./routes/batch09GapAi'));
  app.use('/api/gap-nonai-aiyouthsportsleaguemanager', require('./routes/batch09GapNonai'));
}

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' }));

async function ensureTestUser() {
  if (process.env.NODE_ENV !== 'test') return;
  const email = process.env.ADMIN_EMAIL || process.env.DEMO_EMAIL;
  const password = process.env.ADMIN_PASSWORD || process.env.DEMO_PASSWORD;
  if (!email || !password) throw new Error('Explicit test administrator credentials are required');
  await db.schema.createTableIfNotExists('users', (table) => {
    table.increments('id').primary(); table.string('email').notNullable().unique();
    table.string('password_hash').notNullable(); table.string('name').notNullable();
    table.string('role').notNullable().defaultTo('parent'); table.timestamp('created_at').defaultTo(db.fn.now());
  });
  const hash = await bcrypt.hash(password, 10);
  const existing = await db('users').where({ email }).first();
  if (existing) await db('users').where({ email }).update({ password_hash: hash });
  else await db('users').insert({ email, password_hash: hash, name: 'Runtime Administrator', role: 'admin' });
}

async function start() {
  await ensureTestUser();
  return app.listen(port, () => console.log(`Youth Sports League API listening on ${port}`));
}
if (require.main === module) start().catch((error) => { console.error('Startup failed:', error.message); process.exitCode = 1; });
module.exports = { app, start };
