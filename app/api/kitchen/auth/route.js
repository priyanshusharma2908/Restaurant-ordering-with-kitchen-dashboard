import { cleanText } from '@/lib/validation';
export async function POST(request) {
  const { pin } = await request.json().catch(() => ({}));
  const expected = process.env.KITCHEN_PIN;
  if (!expected) return Response.json({ error: 'Kitchen PIN is not configured.' }, { status: 503 });
  if (cleanText(pin, 40) !== expected) return Response.json({ error: 'That PIN is not correct.' }, { status: 401 });
  return Response.json({ ok: true });
}
