# @ccc/api

Backend for Canine Command Center — Fastify + Postgres + Drizzle ORM + Better
Auth + the Claude (Scout) SSE proxy. The only component that holds secrets or
talks to Claude. See [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

> **Status: scaffold only.** The real server, env config, logging, `/health`,
> the Postgres/Drizzle layer, migrations, auth, and the Claude proxy are built
> in milestones **M0.3 → M1.x** (see [`../../docs/ROADMAP.md`](../../docs/ROADMAP.md)).
