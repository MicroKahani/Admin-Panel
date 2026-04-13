/** Mirrors backend `parsePromoBannerTimestampsInput` for optimistic UI. */

function parseTimestampTokenToSeconds(token: string): number | null {
  const s = token.trim();
  if (!s) return null;
  if (/^\d+:\d{1,2}:\d{1,2}$/.test(s)) {
    const [h, m, sec] = s.split(':').map((p) => parseInt(p, 10));
    if ([h, m, sec].some((x) => Number.isNaN(x)) || m > 59 || sec > 59) return null;
    return h * 3600 + m * 60 + sec;
  }
  if (/^\d{1,3}:\d{1,2}$/.test(s)) {
    const [m, sec] = s.split(':').map((p) => parseInt(p, 10));
    if ([m, sec].some((x) => Number.isNaN(x)) || sec > 59) return null;
    return m * 60 + sec;
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parsePromoBannerTimestampsInput(raw: unknown): number[] {
  if (raw === undefined || raw === null) return [];
  const str = typeof raw === 'string' ? raw.trim() : '';
  if (typeof raw === 'string' && str === '') return [];

  let tokens: unknown[] = [];
  if (Array.isArray(raw)) {
    tokens = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) tokens = parsed;
      else tokens = str.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    } catch {
      tokens = str.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    }
  } else return [];

  const seconds: number[] = [];
  for (const item of tokens) {
    if (typeof item === 'number' && Number.isFinite(item) && item >= 0) {
      seconds.push(item);
      continue;
    }
    if (typeof item === 'string') {
      const sec = parseTimestampTokenToSeconds(item);
      if (sec !== null) seconds.push(sec);
    }
  }
  return [...new Set(seconds)]
    .filter((x) => Number.isFinite(x) && x >= 0)
    .sort((a, b) => a - b);
}

export function formatPromoTimestampsForField(seconds?: number[]): string {
  if (!seconds?.length) return '';
  return seconds.join(', ');
}
