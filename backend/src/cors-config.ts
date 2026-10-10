import type { CorsOptions } from "cors";

export function normalizeConfiguredOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins(configured: string | undefined): string[] {
  const values = (configured ?? 'http://localhost:5173').split(',').map(normalizeConfiguredOrigin);
  const origins = values.filter((origin): origin is string => origin !== null);
  return [...new Set(origins)];
}

export function isAllowedOrigin(origin: string | undefined, allowedOrigins: readonly string[]): boolean {
  // Requests without an Origin header are server-to-server or same-origin requests.
  return !origin || allowedOrigins.includes(origin);
}

export function createCorsOptions(allowedOrigins: readonly string[], onRejected?: (origin: string) => void): CorsOptions {
  return {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
      if (origin) onRejected?.(origin);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    optionsSuccessStatus: 204,
  };
}
