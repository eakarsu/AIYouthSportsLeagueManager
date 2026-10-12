global.IS_REACT_ACT_ENVIRONMENT = true;
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AIReport from './components/AIReport';
import AIInjuryRisk from './pages/AIInjuryRisk';
import Login from './pages/Login';
import api from './services/api';

jest.mock('./services/api', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn(), warning: jest.fn(), success: jest.fn() } }));

it('renders returned and saved structured values as labeled sections without raw JSON', () => {
  const payload = { result: { summary: { eligible: false, score: 0, notes: '' }, actions: [{ task: 'Review', done: false }] } };
  for (const response of [payload, { result_json: payload.result }]) {
    const html = renderToStaticMarkup(<AIReport response={response} />);
    expect(html).toContain('Summary');
    expect(html).toContain('Eligible');
    expect(html).toContain('No');
    expect(html).toContain('Score');
    expect(html).toContain('>0<');
    expect(html).toContain('(empty)');
    expect(html).toContain('<table');
    expect(html).not.toContain('&quot;eligible&quot;');
  }
});

it('fills a native AI form including optional fields without generation and keeps a real player reference', async () => {
  api.get.mockResolvedValue({ data: [{ id: 42, first_name: 'Alex', last_name: 'Rivera' }] });
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () => { root.render(<AIInjuryRisk />); });
  const preset = [...host.querySelectorAll('button')].find(button => button.textContent === 'High load');
  await act(async () => { preset.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(host.querySelector('select.form-control').value).toBe('42');
  expect(host.querySelector('input[type="number"]').value).toBe('2');
  expect([...host.querySelectorAll('textarea')].map(field => field.value)).toEqual(['No reported injuries.', 'Soreness after the last match.']);
  expect(api.post).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});

it('shows the demo prerequisite and does not submit when browser credentials are absent', () => {
  const html = renderToStaticMarkup(<MemoryRouter><Login /></MemoryRouter>);
  expect(html).toContain('Demo credentials are not configured');
  expect(html).toMatch(/Fill Demo Credentials<\/button>/);
  expect(html).toMatch(/quick-login-btn[^>]*disabled/);
});

it('fills every workspace field without calling generation and renders a saved detail', async () => {
  const { default: AIWorkspace, workspaceFields } = require('./components/AIWorkspace');
  const features = require('./components/aiWorkspaceFeatures.json');
  const saved = { id: 1, feature: features[0].id, input: { goal: 'Review league plan', context: '' }, created_at: '2026-01-01T00:00:00Z', result_json: { finding: { ready: false, count: 0, note: '' }, tasks: [{ name: 'Review roster' }] } };
  const previousFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [saved] }) });
  const host = document.createElement('div'); const root = createRoot(host);
  try {
    await act(async () => { root.render(<AIWorkspace feature={features[0]} token="fixture-token" />); });
    const sample = [...host.querySelectorAll('button')].find(button => button.textContent === 'Scenario');
    await act(async () => { sample.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    for (const field of workspaceFields) expect(host.querySelector(`[id="${features[0].id}-${field.key}"]`).value).not.toBe('');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const open = host.querySelector('.ai-history-row');
    await act(async () => { open.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const detail = document.body.querySelector('[role="dialog"]');
    expect(detail.textContent).toContain('Finding');
    expect(detail.textContent).toContain('No');
    expect(detail.textContent).toContain('(empty)');
    expect(detail.querySelector('table')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    global.fetch = previousFetch;
  }
});

it('configured demo fill only changes inputs and does not send a login request', async () => {
  const oldEmail = process.env.REACT_APP_DEMO_EMAIL;
  const oldPassword = process.env.REACT_APP_DEMO_PASSWORD;
  process.env.REACT_APP_DEMO_EMAIL = 'demo@example.test';
  process.env.REACT_APP_DEMO_PASSWORD = 'fixture-only-value';
  const host = document.createElement('div'); const root = createRoot(host);
  try {
    await act(async () => { root.render(<MemoryRouter><Login /></MemoryRouter>); });
    const fill = host.querySelector('.quick-login-btn');
    expect(fill.disabled).toBe(false);
    await act(async () => { fill.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(host.querySelector('#email').value).toBe('demo@example.test');
    expect(host.querySelector('#password').value).toBe('fixture-only-value');
    expect(api.post).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    if (oldEmail === undefined) delete process.env.REACT_APP_DEMO_EMAIL; else process.env.REACT_APP_DEMO_EMAIL = oldEmail;
    if (oldPassword === undefined) delete process.env.REACT_APP_DEMO_PASSWORD; else process.env.REACT_APP_DEMO_PASSWORD = oldPassword;
  }
});

it('provides complete workspace presets for every configured AI report', () => {
  const { workspacePresets, workspaceFields } = require('./components/AIWorkspace');
  const features = require('./components/aiWorkspaceFeatures.json');
  for (const feature of features) {
    const presets = workspacePresets(feature);
    expect(presets.length).toBeGreaterThanOrEqual(2);
    for (const preset of presets) for (const field of workspaceFields) {
      expect(preset.values[field.key]).toBeDefined();
      expect(String(preset.values[field.key]).trim()).not.toBe('');
      if (field.options) expect(field.options).toContain(preset.values[field.key]);
    }
  }
});

it('fills the single prompt AI pages without starting generation', async () => {
  const pages = [
    'FairPlayMonitoringWithBiasDetectionCfs', 'CollegeRecruitmentPipelineIdentificationCfs',
    'FundraisingAutomationWithSponsorMatchingCfs', 'IntegrationWithYouthDevelopmentFrameworksLtadCfs',
    'ParentVolunteerMatchingWithLeagueNeedsCfs', 'PostgameSummaryGenerationForParentsCfs',
    'PredictiveInjuryRiskBasedOnPlayPatternsCfs', 'SpectatorExperienceOptimizationConcessionsSeatingCfs',
  ];
  const previousFetch = global.fetch; global.fetch = jest.fn();
  try {
    for (const name of pages) {
      const Page = require(`./pages/Batch09/${name}.jsx`).default;
      const host = document.createElement('div'); const root = createRoot(host);
      await act(async () => { root.render(<Page />); });
      const samples = [...host.querySelectorAll('button')].filter(button => /scenario/i.test(button.textContent));
      expect(samples).toHaveLength(3);
      for (const sample of samples) {
        await act(async () => { sample.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
        expect(host.querySelector('textarea').value.trim()).not.toBe('');
      }
      expect(global.fetch).not.toHaveBeenCalled();
      await act(async () => root.unmount());
    }
  } finally { global.fetch = previousFetch; }
});

it('fills record based native AI screens from real fixture records without generating', async () => {
  const names = ['AIPostgameSummary', 'AICommunicationGenerator', 'AIScheduleOptimizer', 'AIPlayerDevelopment', 'AIRefereeMatcher', 'AITeamBalancing', 'AIGamePredictions'];
  const fixtures = {
    '/players': [{ id: 21, first_name: 'Alex', last_name: 'Rivera', team_id: 31 }],
    '/teams': [{ id: 31, name: 'Falcons' }, { id: 32, name: 'Hawks' }],
    '/games': [{ id: 41, date: '2027-04-10', home_team_id: 31, away_team_id: 32, home_score: 2, away_score: 1 }],
    '/referees': [{ id: 51, first_name: 'Taylor', last_name: 'Kim' }],
    '/facilities': [{ id: 61, name: 'North Field' }],
    '/standings': [],
  };
  api.get.mockImplementation(async path => ({ data: fixtures[path] || [] }));
  api.post.mockClear();
  for (const name of names) {
    const Page = require(`./pages/${name}.js`).default;
    const host = document.createElement('div'); const root = createRoot(host);
    await act(async () => { root.render(<Page />); });
    const presets = [...host.querySelectorAll('.ai-preset-bar button')];
    expect(presets).toHaveLength(3);
    await act(async () => { presets[1].dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(api.post).not.toHaveBeenCalled();
    if (name === 'AIPostgameSummary') {
      expect(host.querySelector('select.form-control').value).toBe('41');
      expect(host.querySelector('textarea').value).not.toBe('');
    }
    if (name === 'AICommunicationGenerator') {
      expect([...host.querySelectorAll('textarea')].some(field => field.value.trim())).toBe(true);
      expect([...host.querySelectorAll('select')].some(field => field.value === '31' || field.value === '32')).toBe(true);
    }
    if (name === 'AIScheduleOptimizer') expect(host.querySelector('input[type="number"]').value).toBe('3');
    await act(async () => root.unmount());
  }
});

it('renders saved communication JSON in its detail view', async () => {
  const Communications = require('./pages/Communications').default;
  api.get.mockImplementation(async path => ({ data: path === '/communications' ? [{ id: 1, title: 'Season recap', type: 'message', recipient_type: 'all', status: 'draft', message: JSON.stringify({ summary: { delivered: false, families: 0, note: '' }, next_steps: ['Review dates'] }) }] : [] }));
  const host = document.createElement('div'); const root = createRoot(host);
  await act(async () => { root.render(<Communications />); });
  const row = host.querySelector('tbody tr');
  await act(async () => { row.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(host.textContent).toContain('Summary');
  expect(host.textContent).toContain('Delivered');
  expect(host.textContent).toContain('(empty)');
  expect(host.textContent).not.toContain('"delivered":false');
  await act(async () => root.unmount());
});

it('extracts arrays from direct, named, and paginated responses without rendering objects as records', () => {
  const { recordsFrom } = require('./services/records');
  const rows = [{ id: 1 }];
  expect(recordsFrom(rows, 'players')).toBe(rows);
  expect(recordsFrom({ players: rows }, 'players')).toBe(rows);
  expect(recordsFrom({ data: rows, pagination: { total: 1 } }, 'players')).toBe(rows);
  expect(recordsFrom({ players: { count: 1 }, data: rows }, 'players')).toBe(rows);
  expect(recordsFrom({ players: { count: 1 }, data: { rows } }, 'players')).toEqual([]);
  expect(recordsFrom(null, 'players')).toEqual([]);
});

it('renders 15 or more seed-derived records in the player, game, and communication tables from paginated responses', async () => {
  const fs = require('fs');
  const seed = fs.readFileSync(require('path').resolve(process.cwd(), '../backend/src/db/seed.sql'), 'utf8');
  const linesFor = (table) => seed.split(`INSERT INTO ${table} (`)[1].split(';')[0]
    .split('\n').filter(line => /^\((?:'|\d)/.test(line.trim()));
  const players = linesFor('players').map((line, index) => {
    const [, first_name, last_name] = line.match(/^\('([^']+)', '([^']+)'/);
    return { id: index + 1, first_name, last_name, position: 'forward', status: 'active' };
  });
  const games = linesFor('games').map((line, index) => ({ id: index + 1, game_date: '2026-03-07', game_time: '09:00', status: 'scheduled', home_team_id: 1, away_team_id: 2 }));
  const communications = linesFor('communications').map((line, index) => ({ id: index + 1, title: line.match(/^\('([^']+)'/)[1], message: 'League notice', type: 'announcement', priority: 'normal', status: 'sent' }));
  expect([players.length, games.length, communications.length]).toEqual([18, 20, 15]);
  const fixtures = { '/players': players, '/games': games, '/communications': communications, '/teams': [{ id: 1, name: 'Thunder' }, { id: 2, name: 'Raptors' }], '/facilities': [], '/referees': [] };
  api.get.mockImplementation(async path => ({ data: { data: fixtures[path] || [], pagination: { total: (fixtures[path] || []).length } } }));
  for (const [name, count] of [['Players', 18], ['Games', 20], ['Communications', 15]]) {
    const Page = require(`./pages/${name}`).default;
    const host = document.createElement('div'); const root = createRoot(host);
    await act(async () => { root.render(<Page />); });
    expect(host.querySelectorAll('tbody tr').length).toBe(count);
    await act(async () => root.unmount());
  }
});

it('keeps every management record table stable when a collection payload is not an array', async () => {
  const names = ['Players', 'Teams', 'Games', 'Facilities', 'Referees', 'Communications', 'Seasons', 'Standings'];
  const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.get.mockResolvedValue({ data: { data: { total: 0 }, pagination: { total: 0 } } });
  try {
    for (const name of names) {
      const Page = require(`./pages/${name}`).default;
      const host = document.createElement('div'); const root = createRoot(host);
      await act(async () => { root.render(<Page />); });
      expect(host.textContent.trim()).not.toBe('');
      await act(async () => root.unmount());
    }
    expect(logged).not.toHaveBeenCalled();
  } finally { logged.mockRestore(); }
});
