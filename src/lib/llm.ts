// LLM API cost maths. Prices are USD per 1M tokens.
export interface ClientModel {
  id: string;
  slug: string;
  name: string;
  p: string; // provider name
  i: number; // input
  o: number; // output
  cr?: number; // cache read
  cw?: number; // cache write (5 min)
  bi?: number; // batch input
  bo?: number; // batch output
  t?: { minPromptTokens: number; input?: number; output?: number; cacheRead?: number }[];
  ctx?: number;
  mo?: number;
  im?: boolean; // accepts image input
}

export interface Workload {
  inTok: number; // input tokens per request
  outTok: number; // output tokens per request
  cachedPct: number; // % of input tokens that are a cacheable prefix
  batch: boolean;
  /** Requests served per cache write (the prefix is written once, then read N−1 times). Default 10. */
  writeEvery?: number;
}

export interface CostBreakdown {
  perRequest: number;
  input: number;
  cached: number;
  output: number;
  usedTier: boolean;
  batchApplied: boolean;
  cacheApplied: boolean;
  notes: string[];
}

export function requestCost(m: ClientModel, w: Workload): CostBreakdown {
  const notes: string[] = [];
  let pi = m.i;
  let po = m.o;
  let pcr = m.cr;
  let pcw = m.cw;
  let usedTier = false;
  const tier = [...(m.t ?? [])].sort((a, b) => b.minPromptTokens - a.minPromptTokens).find((t) => w.inTok >= t.minPromptTokens);
  if (tier) {
    pi = tier.input ?? pi;
    po = tier.output ?? po;
    pcr = tier.cacheRead ?? pcr;
    usedTier = true;
    notes.push(`Long-context pricing applies above ${tier.minPromptTokens.toLocaleString()} input tokens.`);
  }
  let batchApplied = false;
  if (w.batch) {
    if (m.bi !== undefined && m.bo !== undefined) {
      const ratio = m.bi / m.i;
      pi = usedTier ? pi * ratio : m.bi;
      po = usedTier ? po * (m.bo / m.o) : m.bo;
      if (pcr !== undefined) pcr *= ratio;
      if (pcw !== undefined) pcw *= ratio;
      batchApplied = true;
    } else notes.push('No batch pricing published for this model; standard prices used.');
  }
  const cachedTok = w.inTok * Math.min(1, Math.max(0, w.cachedPct / 100));
  const n = Math.max(1, w.writeEvery ?? 10);
  let cacheApplied = false;
  let cached: number;
  if (cachedTok > 0 && pcr === undefined) {
    notes.push('No cache pricing published for this model; cached tokens charged at the input price.');
    cached = (cachedTok * pi) / 1e6;
  } else if (cachedTok > 0) {
    cacheApplied = true;
    // One request in n writes the prefix (at the cache-write price, or the normal
    // input price if none is published); the other n−1 read it from cache.
    const write = pcw ?? pi;
    cached = (cachedTok * (write + (n - 1) * pcr!)) / n / 1e6;
    if (pcw !== undefined && pcw > pi) notes.push(`Cache writes cost ${perMillion(pcw)}/1M (more than normal input); included as 1 write per ${n} requests.`);
  } else cached = 0;
  const input = ((w.inTok - cachedTok) * pi) / 1e6;
  const output = (w.outTok * po) / 1e6;
  return { perRequest: input + cached + output, input, cached, output, usedTier, batchApplied, cacheApplied, notes };
}

export function money(v: number): string {
  if (!Number.isFinite(v)) return '∞';
  if (v < 0) return `−${money(-v)}`;
  const a = Math.abs(v);
  if (a === 0) return '$0';
  if (a < 0.01) return `$${v.toPrecision(2)}`;
  if (a < 1) return `$${v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
  if (a < 1000) return `$${v.toFixed(2)}`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}

export const perMillion = (v?: number) => (v === undefined ? '–' : v === 0 ? '$0' : `$${v < 0.1 ? +v.toPrecision(3) : +v.toFixed(3)}`);
export const compactTokens = (n?: number) =>
  n === undefined ? '–' : n >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n);
