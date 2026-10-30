// Server-side helpers over the generated pricing data (build time only).
import data from '../data/generated/models.json';

export type Model = (typeof data.models)[number] & {
  arch?: { params: number; layers: number; kvHeads: number; headDim?: number; maxContext?: number; moe?: boolean; mlaDim?: number; dtype?: string };
  listInput?: number;
  listOutput?: number;
  tiers?: { minPromptTokens: number; input?: number; output?: number; cacheRead?: number }[];
};
export const MODELS = data.models as Model[];
export const UPDATED = data.updated;
export const TRACKING_SINCE = data.trackingSince;

const SKIP = /preview|exp|vision|audio|image|search|guard|embed|tts|realtime|transcribe|moderation|deep-research|codex|computer/i;

/** Newest general-purpose model for each provider (for sensible calculator defaults). */
export function flagship(provider: string): Model | undefined {
  return MODELS.find((m) => m.provider === provider && !SKIP.test(m.id) && !SKIP.test(m.name));
}

export function defaultModels(providers = ['openai', 'anthropic', 'google', 'deepseek']): string[] {
  return providers.map(flagship).filter(Boolean).map((m) => m!.id);
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
