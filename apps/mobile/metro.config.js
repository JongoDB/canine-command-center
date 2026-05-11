// Metro config tuned for the pnpm monorepo: watch the workspace root so changes
// in @ccc/shared and @ccc/ui hot-reload, and let the resolver look in both
// project- and workspace-level node_modules. (Our workspace packages use
// extensionless imports, so no NodeNext `.js`→`.ts` rewrite is needed.)
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Keep Metro out of paths it shouldn't crawl (anchored to the workspace root).
const escaped = workspaceRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  new RegExp(`^${escaped}/data/`),
  new RegExp(`^${escaped}/apps/[^/]+/data/`),
  new RegExp(`^${escaped}/apps/[^/]+/drizzle/`),
  new RegExp(`^${escaped}/apps/[^/]+/dist/`),
  new RegExp(`^${escaped}/packages/[^/]+/dist/`),
];

module.exports = config;
