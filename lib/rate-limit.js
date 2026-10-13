const buckets = new Map();
// Lightweight per-instance guard; use a shared store if this endpoint needs strict global limits.
export function allowRequest(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
