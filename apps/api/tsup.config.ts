import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // `@ccc/*` workspace packages are consumed as TypeScript source — bundle them
  // so the output runs under plain `node` without resolving `.ts` files.
  noExternal: [/^@ccc\//],
  // Everything else (fastify, pg, drizzle, …) stays external and is resolved
  // from node_modules at runtime.
});
