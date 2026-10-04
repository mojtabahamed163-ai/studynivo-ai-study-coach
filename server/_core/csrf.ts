import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type HeaderRequest = {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  get?: (name: string) => string | undefined;
};

function header(request: HeaderRequest, name: string): string | undefined {
  const fromExpress = request.get?.(name);
  if (fromExpress) return fromExpress;
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function forwardedValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * API requests that change state must be same-origin. This complements the
 * SameSite=None cookie required by embedded HTTPS previews; it does not rely on
 * CORS as a CSRF defense. Non-browser clients must send an Origin header too.
 */
export function isTrustedApiMutation(request: HeaderRequest): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  // Published Webdev requests arrive through a reverse proxy. Compare the
  // browser origin with the externally visible forwarded host when present;
  // fall back to the direct request host for local and direct deployments.
  // A Preview iframe may report Sec-Fetch-Site: cross-site even when the
  // request Origin is the website's own public origin. Origin matching is the
  // authoritative check; Fetch Metadata remains useful when no valid origin
  // is supplied because the request is rejected below.
  const hosts = [
    ...forwardedValues(header(request, "x-forwarded-host")),
    ...forwardedValues(header(request, "host")),
  ];
  const source = header(request, "origin") ?? header(request, "referer");
  if (!hosts.length || !source || source === "null") return false;

  try {
    const sourceUrl = new URL(source);
    if (
      (sourceUrl.protocol !== "https:" && sourceUrl.protocol !== "http:") ||
      sourceUrl.username ||
      sourceUrl.password
    ) {
      return false;
    }
    return hosts.includes(sourceUrl.host.toLowerCase());
  } catch {
    return false;
  }
}

export function sameOriginApiProtection(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (isTrustedApiMutation(request)) return next();
  return response.status(403).json({ error: "Cross-origin request rejected" });
}
