const WINDOW_MS = 15 * 60 * 1000;
const MAX_IDENTIFIER_FAILURES = 8;
const MAX_IP_FAILURES = 80;
const MAX_TRACKED_KEYS = 10_000;

type Counter = { failures: number; expiresAt: number };
type LimitKey = { key: string; maximum: number };
const counters = new Map<string, Counter>();

function keys(ip: string, method: "email" | "phone", identifier: string): LimitKey[] {
  return [
    { key: `ip:${ip}`, maximum: MAX_IP_FAILURES },
    {
      key: `ip-identifier:${ip}:${method}:${identifier}`,
      maximum: MAX_IDENTIFIER_FAILURES,
    },
  ];
}

function pruneExpired(now: number) {
  for (const [key, value] of counters) {
    if (value.expiresAt <= now) counters.delete(key);
  }
  while (counters.size > MAX_TRACKED_KEYS) {
    const oldest = counters.keys().next().value as string | undefined;
    if (!oldest) break;
    counters.delete(oldest);
  }
}

export function isAuthRateLimited(
  ip: string,
  method: "email" | "phone",
  identifier: string,
  now = Date.now()
) {
  pruneExpired(now);
  return keys(ip, method, identifier).some(({ key, maximum }) => {
    const counter = counters.get(key);
    return Boolean(counter && counter.failures >= maximum);
  });
}

export function recordAuthFailure(
  ip: string,
  method: "email" | "phone",
  identifier: string,
  now = Date.now()
) {
  pruneExpired(now);
  for (const { key } of keys(ip, method, identifier)) {
    const counter = counters.get(key);
    if (!counter || counter.expiresAt <= now) {
      counters.set(key, { failures: 1, expiresAt: now + WINDOW_MS });
    } else {
      counter.failures += 1;
    }
  }
}

export function clearAuthFailures(
  _ip: string,
  method: "email" | "phone",
  identifier: string
) {
  // Reset only this IP/identifier pair; do not clear the shared IP abuse count.
  counters.delete(`ip-identifier:${_ip}:${method}:${identifier}`);
}

export function resetAuthRateLimitForTests() {
  counters.clear();
}
