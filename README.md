# TokenMeter: AI/ML Developer Utilities

AI cost, token and GPU calculators with **LLM prices updated automatically every day**. Static site (Astro), free on GitHub Pages. Sister site: ShipMath (App Store tools). AI tools were moved here from ShipMath so the two sites don't compete for the same searches.

## Pages (303)

| Section | Tools |
|---|---|
| **AI costs** | LLM cost calculator · Model comparison (monthly totals) · Token cost (“1M tokens”) · Prompt caching (incl. cache-write cost) · Embedding cost (+ vector count & storage) · RAG cost (per query/user/month) · Image tokens (OpenAI/Claude/Gemini formulas) · AI image generation cost · AI video generation cost |
| **Tokens** | Token counter (exact GPT o200k, in-browser) · Words ↔ tokens (measured ratios, 11 languages + code) · Context window fit |
| **GPU** | GPU VRAM (95 open-model architectures) · Quantization · LoRA / QLoRA / full fine-tuning VRAM · Self-host vs API |
| **SaaS** | AI SaaS cost & profit: AI cost/user, fees (card / App Store / MoR), break-even, minimum price for target margin |
| **Data** | Pricing table (260 models + 38 embedding models) · Daily price-change log |
| **Programmatic** | `/models/<model>/` ×260 · `/vram/<size>b/` ×16 (1B–405B) |

## Data pipeline (`npm run update-data`, runs daily in GitHub Actions)

- **OpenRouter** prices (input/output/cache read+write/batch/long-context tiers), cross-checked against **LiteLLM** list prices; mismatches show both prices.
- **Embedding prices** from LiteLLM (OpenAI, Cohere, Google, Voyage, Mistral). Implausible values are skipped; one bad $100/1M entry is filtered today.
- **Hugging Face** architectures (params, layers, hidden size, heads, KV heads, intermediate size, vocab) for VRAM/LoRA maths, cached.
- Fail-safe: if a source is down or returns suspicious data, the previous data is kept.
- Daily snapshot + diff → `/llm-price-changes/`.

## Run & deploy

```bash
npm install
npm run dev              # http://localhost:4321
npm run update-data      # refresh prices now
npm run build && npm run preview
```

GitHub Pages: push this folder as a repo root → **Settings → Pages → Source: GitHub Actions**, and allow **Read and write** workflow permissions (the daily job commits refreshed prices). Base path is automatic; use `u('/path/')` for internal links.

## Before launch

- Name/URLs: `src/data/site.ts` (“TokenMeter” is a placeholder; set `sister.url` to ShipMath's real URL), `public/manifest.webmanifest`.
- Monetization placeholders: `src/data/monetization.ts` (GPU cloud referral, LLM-observability sponsor, vector-DB sponsor, billing affiliate, your app). Hidden in production until filled.

## Method notes

- LLM cost includes long-context tiers, batch discounts and prompt caching with **one cache write per N requests** (cache writes can cost more than normal input).
- VRAM in GiB (how GPU memory is sold); KV cache from real architectures incl. GQA and DeepSeek latent attention.
- Fine-tuning: 16 B/param for full fine-tuning with AdamW (bf16 weights + grads + fp32 master + Adam states), LoRA adapters in fp32, QLoRA base at NF4 ≈ 4.125 bits; activations per Korthikanti et al. with FlashAttention, with or without checkpointing. ±30%.
- Words↔tokens ratios were **measured** with o200k_base on sample paragraphs (English 1.11 tokens/word … Bengali 1.94).

## Tests run before hand-off

~1,800 checks across three random seeds: known answers for every tool plus randomized inputs against independently written formulas (LLM cost incl. cache writes and tiers, model comparison, token cost, embeddings & storage, RAG, image tokens, words↔tokens, quantization, LoRA, SaaS profit and minimum price), all tool pages at 390 px, zero console/CSP errors, and the full suite under a GitHub Pages sub-path.
