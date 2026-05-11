import 'dotenv/config';
import { createApp } from './app';
import { initSchema } from './db/init';

const PORT = Number(process.env.PORT ?? 4000);

async function startServer() {
  await initSchema();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
});
