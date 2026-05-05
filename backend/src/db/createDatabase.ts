import 'dotenv/config';
import { Client } from 'pg';

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

async function createDatabaseIfMissing(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Add it to backend/.env');
  }

  const targetUrl = new URL(connectionString);
  const databaseName = targetUrl.pathname.replace(/^\//, '');

  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name (for example /fitness_store).');
  }

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);

    if (exists.rowCount && exists.rowCount > 0) {
      console.log(`Database "${databaseName}" already exists.`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    console.log(`Database "${databaseName}" created.`);
  } finally {
    await client.end();
  }
}

createDatabaseIfMissing().catch((error) => {
  const pgError = error as { code?: string; message?: string };

  if (pgError.code === '28P01') {
    console.error(
      'Failed to create database: PostgreSQL rejected the username/password in DATABASE_URL. Update backend/.env with valid credentials and try again.'
    );
    process.exitCode = 1;
    return;
  }

  console.error('Failed to create database:', error);
  process.exitCode = 1;
});
