# Production readiness

The governed API at `/api/governance` is the supported youth sports league management path. It records tenant/participant-scoped guardian consent, eligibility, safeguarding, facility safety, fair-play and accessibility review, coach feedback, league approval, incident/correction handling, outcomes, deletion, and immutable connector history. It never exposes minor data, publishes rosters, charges families, or sends messages.

## Deployment sequence

1. Review and back up the database, then apply `backend/migrations/001_governed_youth_league_event.sql` separately using a least-privilege migration identity.
2. Copy `.env.example` to `.env`, replace every placeholder, and configure a unique 32-plus-character JWT secret and explicit CORS allowlist.
3. Install locked dependencies explicitly. `start.sh` only supervises the already-installed backend and frontend.
4. Provision tenant memberships and deploy separately reviewed connector workers. Workers exchange opaque references, versions, digests, and receipts; raw secrets and sensitive content do not enter workflow payloads.
5. Exercise retry, dead-letter, reconciliation, retention/deletion, audit export, backup, restore, and incident-response procedures before production.

Production rejects wildcard CORS, weak secrets, provider/demo flags, generated routes, and startup schema mutation. The additive migration never drops or truncates tables. Public registration is forced to the `parent` role. Legacy destructive schema and demo seed SQL require explicit `allow_legacy_reset` or `allow_demo_seed` psql variables and must only target isolated non-production databases.

## Required external validation

Validate guardian consent and deletion propagation, adult background-check receipts, facilities, officials, registration, scheduling, payments, communications, and emergency-plan integrations. Conduct safeguarding, accessibility, fairness, schedule-conflict, incident, retry/dead-letter, and real-season outcome reviews with qualified league personnel. No minor-data publication or league action was performed.
