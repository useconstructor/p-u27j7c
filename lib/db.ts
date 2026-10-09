import { createClient, Client } from '@libsql/client';

let dbInstance: Client | null = null;

export const db = new Proxy({} as Client, {
  get(_, prop: keyof Client) {
    if (!dbInstance) {
      dbInstance = createClient({
        url: process.env.TURSO_DATABASE_URL || 'file:local.db',
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    }
    return dbInstance[prop];
  }
});
