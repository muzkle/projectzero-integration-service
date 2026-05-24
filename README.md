# integration-service

Bounded context: OAuth connections (Spotify, Steam), mission validation, play event tracking, and async mission validation jobs.

## Endpoints

- `GET /v1/connections` — List user connections (requires `x-user-id` header from gateway)
- `GET /v1/connections/spotify/authorize` — Spotify OAuth authorization URL
- `GET /v1/connections/spotify/callback` — Spotify OAuth callback (public)
- `GET /v1/connections/steam/authorize` — Steam OpenID authorization URL (stub)
- `GET /v1/connections/steam/callback` — Steam OAuth callback stub (public)
- `POST /v1/missions/:missionId/validate` — Validate mission synchronously or enqueue async job
- `GET /v1/health` — Health check (database)

## Mission validation

Fetches mission config from **catalog-service** (`CATALOG_SERVICE_URL`) and validates by type:

| Type | Logic |
|------|-------|
| `spotify_track_plays` | Syncs recently played from Spotify API, counts `PlayEvent` rows |
| `steam_achievement` | MVP mock — returns completed when Steam connected and config matches |
| `manual_code` | Compares SHA-256 hash of submitted code to `config.codeHash` |

On validation, writes a `ValidationLog` audit row and publishes `mission.validated` to the BullMQ **collection** queue.

## Async jobs

Set `{ "async": true }` on validate request to enqueue a `validate-mission` job on the **integration** queue. A BullMQ worker processes the job and publishes the same `MissionValidated` event.

## Local development

```bash
cp .env.example .env
npm install
npm run start:dev
```

Requires PostgreSQL (`integration_db`) and Redis from the root `docker-compose.yml`.

## Environment

See [.env.example](./.env.example).
