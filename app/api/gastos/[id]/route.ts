import { db } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  await db.execute({
    sql: 'UPDATE gastos SET concepto=?, importe=?, categoria=?, fecha=? WHERE id=?',
    args: [body.concepto, body.importe, body.categoria, body.fecha, id]
  });

  const { rows } = await db.execute('SELECT * FROM gastos ORDER BY fecha DESC, created_at DESC');
  return Response.json(rows);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await db.execute({
    sql: 'DELETE FROM gastos WHERE id=?',
    args: [id]
  });

  const { rows } = await db.execute('SELECT * FROM gastos ORDER BY fecha DESC, created_at DESC');
  return Response.json(rows);
}
