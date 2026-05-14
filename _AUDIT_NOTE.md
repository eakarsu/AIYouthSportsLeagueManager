# Audit Recommendations & Status — AIYouthSportsLeagueManager

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_09.md

Verdict per audit: template-clone, 6 AI endpoints, 10 non-AI routes.

## Original audit recommendations

Missing AI: not specifically called out beyond "competent but basic AI."

Missing non-AI:
- Parent volunteer coordination
- Fundraising tracking
- Facility reservation
- Tournament support
- Skill certification program

Custom feature ideas:
- Predictive injury risk
- Parent volunteer matching
- College recruitment pipeline (skill + growth trajectory)
- Fair play / bias monitoring
- Spectator experience optimization
- Postgame summary generation
- LTAD framework integration
- Fundraising automation with sponsor matching

## Implemented in this pass

None. AI surface is reasonable for the domain (6 endpoints). Remaining items are mostly substantive product features (volunteer coordination, fundraising, tournaments) or product decisions (recruitment pipeline value). No safe mechanical edit selected this pass.

## Backlog (priority order)

1. Postgame summary generator (`/api/ai/postgame-summary`) — text-only AI add-on; mechanical next step.
2. Injury risk endpoint (`/api/ai/injury-risk`) — text-only AI over play patterns; mechanical add-on.
3. Volunteer matching — needs new schema; product decision.
4. Fundraising tracking — substantial product feature.
5. Tournament support — substantial product feature.

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired with 1:1 page coverage.
- `App.js` registers `/ai/team-balancing`, `/ai/schedule-optimizer`, `/ai/referee-matcher`, `/ai/player-development`, `/ai/game-predictions`, `/ai/communication-generator`.
- `components/Layout.js` and `pages/Dashboard.js` expose nav cards for all six AI features.
- Each `pages/AI*.js` page POSTs to its corresponding endpoint via `services/api.js`.
- No frontend changes applied this pass.

## Apply pass 4 (mechanical backlog)

Implemented the two MECHANICAL items from the backlog (see "Backlog (priority order)" above).

| # | Item | BE | FE |
|---|------|----|----|
| 1 | Postgame summary generator (`POST /api/ai/postgame-summary`) | `backend/src/routes/ai.js` | `frontend/src/pages/AIPostgameSummary.js` |
| 2 | Injury risk endpoint (`POST /api/ai/injury-risk`) | `backend/src/routes/ai.js` | `frontend/src/pages/AIInjuryRisk.js` |

Both endpoints reuse the existing `callOpenRouter` helper, are wrapped in JWT `authenticate`, and short-circuit with HTTP 503 (`"AI service unavailable: OPENROUTER_API_KEY is not configured."`) when the key is missing/placeholder. Persistence to `ai_analyses` is wrapped in try/catch so a missing DB does not break the AI response (returns the result without `analysis_id`).

FE pages match the existing `AICommunicationGenerator.js` / `AIGamePredictions.js` styling (page header, two-column grid, history panel, copy-to-clipboard, AIResultDisplay component, react-icons). They use the shared `services/api.js` axios instance (already attaches `Authorization: Bearer <token>` from `localStorage`) and surface a dedicated user-facing message on HTTP 503.

Routes registered in `frontend/src/App.js`; nav links added to `frontend/src/components/Layout.js` (AI section) and `frontend/src/pages/Dashboard.js` (AI cards).

Backlog deferred (unchanged):
- Volunteer matching (NEEDS-PRODUCT-DECISION — schema additions).
- Fundraising tracking (NEEDS-PRODUCT-DECISION — substantial product feature).
- Tournament support (NEEDS-PRODUCT-DECISION — substantial product feature).
- College recruitment pipeline (NEEDS-PRODUCT-DECISION — value/scope unclear).
- Fair play / bias monitoring, spectator experience optimization, LTAD framework, fundraising automation w/ sponsor matching (TOO-RISKY / NEEDS-PRODUCT-DECISION).

**Smoke test:** PASS. Started backend on port 4101 (3001/4001 occupied by other parallel sessions); verified `POST /api/ai/injury-risk` → 401 without JWT, 503 with forged JWT (placeholder API key); `POST /api/ai/postgame-summary` → 503 with forged JWT. `node --check` and `@babel/parser` (jsx) verified all touched files.
