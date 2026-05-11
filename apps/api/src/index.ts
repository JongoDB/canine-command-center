import { BRANDING } from '@ccc/shared';

// Placeholder entrypoint. The real Fastify server, env config, logging,
// /health, Postgres/Drizzle, auth, and the Claude SSE proxy are built in
// milestones M0.3 → M1.x (see docs/ROADMAP.md). This stub only proves the
// @ccc/shared workspace link resolves.
function main(): void {
  console.log(`${BRANDING.appName} API — scaffold only. See docs/ROADMAP.md (M0.3).`);
}

main();
