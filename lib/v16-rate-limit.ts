type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_ENTRIES = 5000;

export function checkV16RateLimit(key: string, limit: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > MAX_ENTRIES) {
      for (const [entry, value] of buckets) if (value.resetAt <= now) buckets.delete(entry);
    }
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count) };
}
