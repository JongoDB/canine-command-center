import { env } from './config/env';
import { buildServer } from './server';

async function main(): Promise<void> {
  const app = await buildServer();

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      app.log.info(`received ${signal}, shutting down`);
      void app.close().then(() => process.exit(0));
    });
  }

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (err) {
    app.log.error(err, 'failed to start');
    process.exit(1);
  }
}

void main();
