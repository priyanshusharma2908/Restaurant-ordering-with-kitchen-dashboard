export function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function cleanText(value, max = 240) { return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, max) : ''; }
export function safeTable(value) { const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null; }
export function errorResponse(error, fallback = 'Something went wrong. Please try again.') {
  console.error(error);
  const knownSetupMessage = error instanceof Error && /not configured/i.test(error.message) ? error.message : fallback;
  return Response.json({ error: knownSetupMessage }, { status: 500 });
}
