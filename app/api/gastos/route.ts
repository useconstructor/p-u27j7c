import { db } from '@/lib/db';

export async function GET() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concepto TEXT NOT NULL,
      importe REAL NOT NULL,
      categoria TEXT NOT NULL,
      fecha TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const { rows } = await db.execute('SELECT * FROM gastos ORDER BY fecha DESC, created_at DESC');
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concepto TEXT NOT NULL,
      importe REAL NOT NULL,
      categoria TEXT NOT NULL,
      fecha TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute({
    sql: 'INSERT INTO gastos (concepto, importe, categoria, fecha) VALUES (?, ?, ?, ?)',
    args: [body.concepto, body.importe, body.categoria, body.fecha]
  });

  const { rows } = await db.execute('SELECT * FROM gastos ORDER BY fecha DESC, created_at DESC');
  return Response.json(rows);
}
