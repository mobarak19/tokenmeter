// Image input token formulas published by providers (check their docs; newer models may differ).
export type VisionMethod = 'openai-tiles' | 'openai-low' | 'anthropic' | 'gemini';

export const VISION_METHODS: { id: VisionMethod; label: string; doc: string }[] = [
  { id: 'openai-tiles', label: 'OpenAI tile method (GPT-4o family, detail: high)', doc: 'https://platform.openai.com/docs/guides/images-vision' },
  { id: 'openai-low', label: 'OpenAI detail: low', doc: 'https://platform.openai.com/docs/guides/images-vision' },
  { id: 'anthropic', label: 'Anthropic Claude (width × height ÷ 750)', doc: 'https://docs.anthropic.com/en/docs/build-with-claude/vision' },
  { id: 'gemini', label: 'Google Gemini 2.x tile rule (258 per 768 px tile)', doc: 'https://ai.google.dev/gemini-api/docs/vision' },
];

export function imageTokens(w: number, h: number, m: VisionMethod): { tokens: number; resized: [number, number]; note: string } {
  if (m === 'openai-low') return { tokens: 85, resized: [512, 512], note: 'Low detail: a fixed 85 tokens at 512 × 512.' };
  if (m === 'openai-tiles') {
    let s = Math.min(1, 2048 / Math.max(w, h)); // fit inside 2048 × 2048
    let W = w * s, H = h * s;
    const s2 = Math.min(1, 768 / Math.min(W, H)); // shortest side to 768
    W = Math.round(W * s2); H = Math.round(H * s2);
    const tiles = Math.ceil(W / 512) * Math.ceil(H / 512);
    return { tokens: 85 + 170 * tiles, resized: [W, H], note: `${tiles} tiles of 512 px × 170 tokens + 85 base.` };
  }
  if (m === 'anthropic') {
    // Scaled down if the long edge exceeds 1568 px or the image exceeds ~1.15 MP.
    const s = Math.min(1, 1568 / Math.max(w, h), Math.sqrt(1.15e6 / (w * h)));
    const W = Math.round(w * s), H = Math.round(h * s);
    return { tokens: Math.round((W * H) / 750), resized: [W, H], note: s < 1 ? 'Resized before counting (≤1568 px long edge, ≈1.15 MP).' : 'Counted at full size.' };
  }
  if (w <= 384 && h <= 384) return { tokens: 258, resized: [w, h], note: 'Small image (both sides ≤ 384 px): 258 tokens.' };
  const tiles = Math.ceil(w / 768) * Math.ceil(h / 768);
  return { tokens: 258 * tiles, resized: [w, h], note: `${tiles} tiles of 768 px × 258 tokens.` };
}
