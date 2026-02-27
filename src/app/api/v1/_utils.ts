export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function withCorsHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  return { ...CORS_HEADERS, ...headers };
}

export function parseLimit(value: string | null, max: number): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.floor(parsed), max);
}

export function normalizeEvent26Code(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("2026")) return trimmed;
  return `2026${trimmed}`;
}
