import { neon } from '@neondatabase/serverless';

let client: ReturnType<typeof neon> | null = null;

function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    // Next.js by inak mohol odpovede z databázy držať v cache a nové úlohy by sa nezobrazili
    client = neon(url, { fetchOptions: { cache: 'no-store' } });
  }
  return client;
}

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await getClient().query(text, params)) as T[];
}
