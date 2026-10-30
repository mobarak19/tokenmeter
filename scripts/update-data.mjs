#!/usr/bin/env node
// Refreshes LLM pricing + open-model architecture data.
//
//   npm run update-data
//
// Sources (public, no API key):
//   • OpenRouter models API: prices, context, modalities (primary)
//   • LiteLLM model_prices_and_context_window.json (MIT): cross-check of
//     first-party list prices
//   • Hugging Face: config.json + safetensors parameter counts for open models
//
// Safety: if a source is down or returns suspicious data, the previous data
// is kept and the script exits 0, so the scheduled deploy still succeeds.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GEN = path.join(ROOT, 'src/data/generated');
const HISTORY = path.join(ROOT, 'src/data/history');
const MODELS_FILE = path.join(GEN, 'models.json');
const CHANGES_FILE = path.join(GEN, 'changes.json');
const HF_CACHE = path.join(GEN, 'hf-cache.json');

const OPENROUTER = 'https://openrouter.ai/api/v1/models';
const LITELLM = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

// Providers we publish pages for (OpenRouter org prefix → display name, first-party?)
const PROVIDERS = {
  anthropic: ['Anthropic', true],
  openai: ['OpenAI', true],
  google: ['Google', true],
  'meta-llama': ['Meta', false],
  mistralai: ['Mistral', true],
  deepseek: ['DeepSeek', true],
  'x-ai': ['xAI', true],
  qwen: ['Qwen', false],
  cohere: ['Cohere', true],
  amazon: ['Amazon', true],
  microsoft: ['Microsoft', false],
  nvidia: ['NVIDIA', false],
  'z-ai': ['Z.ai', false],
  moonshotai: ['Moonshot AI', false],
  minimax: ['MiniMax', false],
  perplexity: ['Perplexity', true],
};
// LiteLLM key prefixes for first-party direct APIs.
const LITELLM_PROVIDER = { anthropic: 'anthropic', openai: 'openai', google: 'gemini', mistralai: 'mistral', deepseek: 'deepseek', 'x-ai': 'xai', cohere: 'cohere_chat', perplexity: 'perplexity' };

const perM = (v) => (v === undefined || v === null || v === '' ? undefined : Math.round(Number(v) * 1e6 * 1e6) / 1e6);
const today = () => new Date().toISOString().slice(0, 10);
const readJson = async (f, fallback) => JSON.parse(await fs.readFile(f, 'utf8').catch(() => JSON.stringify(fallback)));
const writeJson = (f, d) => fs.writeFile(f, JSON.stringify(d, null, 1) + '\n');

async function getJson(url, timeoutMs = 30000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': 'dev-hub-price-updater' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

const slugify = (id) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normKey = (s) => s.toLowerCase().replace(/^.*\//, '').replace(/[._:]/g, '-');

function normalize(or, litellm) {
  const all = or.data ?? [];
  const byId = new Map(all.map((m) => [m.id, m]));

  // LiteLLM index for cross-checks: provider → normalized name → entry
  const ll = {};
  for (const [key, v] of Object.entries(litellm ?? {})) {
    if (!v || typeof v !== 'object' || !v.litellm_provider || v.input_cost_per_token === undefined) continue;
    (ll[v.litellm_provider] ??= new Map()).set(normKey(key), v);
  }

  const models = [];
  const flagged = [];
  for (const m of all) {
    const [org] = m.id.split('/');
    if (!(org in PROVIDERS)) continue;
    if (/:(free|batch|extended|beta|nitro|floor|online)$/.test(m.id)) continue;
    const p = m.pricing ?? {};
    const input = perM(p.prompt);
    const output = perM(p.completion);
    if (!(input > 0) || !(output >= 0)) continue; // free promos, routers (-1)
    if (input > 500 || output > 2000) {
      flagged.push(`${m.id}: implausible price ${input}/${output} per 1M, skipped`);
      continue;
    }
    const batch = byId.get(`${m.id}:batch`)?.pricing;
    const tiers = (p.overrides ?? [])
      .filter((o) => o.min_prompt_tokens)
      .map((o) => ({ minPromptTokens: o.min_prompt_tokens, input: perM(o.prompt), output: perM(o.completion), cacheRead: perM(o.input_cache_read) }));
    const [providerName, firstParty] = PROVIDERS[org];
    const name = (m.name ?? m.id).replace(/^[^:]+:\s*/, '').trim();

    let verified = 'unchecked';
    let listInput;
    let listOutput;
    const llp = LITELLM_PROVIDER[org];
    if (firstParty && llp && ll[llp]) {
      const hit = ll[llp].get(normKey(m.id));
      if (hit) {
        const li = hit.input_cost_per_token * 1e6;
        const lo = (hit.output_cost_per_token ?? 0) * 1e6;
        const close = (a, b) => Math.abs(a - b) <= Math.max(0.02 * Math.max(a, b), 1e-6);
        verified = close(li, input) && close(lo, output) ? 'match' : 'mismatch';
        listInput = +li.toFixed(6);
        listOutput = +lo.toFixed(6);
        if (verified === 'mismatch') flagged.push(`${m.id}: OpenRouter ${input}/${output} vs LiteLLM ${+li.toFixed(4)}/${+lo.toFixed(4)} per 1M`);
      }
    }

    models.push({
      id: m.id,
      slug: slugify(m.id),
      provider: org,
      providerName,
      firstParty,
      name,
      created: m.created ? new Date(m.created * 1000).toISOString().slice(0, 10) : undefined,
      context: m.context_length ?? m.top_provider?.context_length,
      maxOutput: m.top_provider?.max_completion_tokens ?? undefined,
      input,
      output,
      cacheRead: perM(p.input_cache_read),
      cacheWrite: perM(p.input_cache_write),
      cacheWrite1h: perM(p.input_cache_write_1h),
      batchInput: batch ? perM(batch.prompt) : undefined,
      batchOutput: batch ? perM(batch.completion) : undefined,
      reasoningPrice: perM(p.internal_reasoning),
      webSearch: p.web_search ? Number(p.web_search) : undefined,
      tiers: tiers.length ? tiers : undefined,
      inputModalities: m.architecture?.input_modalities ?? ['text'],
      outputModalities: m.architecture?.output_modalities ?? ['text'],
      tools: (m.supported_parameters ?? []).includes('tools'),
      reasoning: !!m.reasoning || (m.supported_parameters ?? []).includes('reasoning'),
      tokenizer: m.architecture?.tokenizer,
      hfId: m.hugging_face_id || undefined,
      verified,
      listInput,
      listOutput,
    });
  }
  models.sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '') || a.id.localeCompare(b.id));
  return { models, flagged };
}

// ---------------------------------------------------------------- embeddings
const EMBED_PROVIDERS = { openai: 'OpenAI', cohere: 'Cohere', gemini: 'Google', voyage: 'Voyage AI', mistral: 'Mistral' };
function embeddings(litellm) {
  const out = [];
  const flagged = [];
  for (const [key, v] of Object.entries(litellm ?? {})) {
    if (!v || v.mode !== 'embedding' || !(v.litellm_provider in EMBED_PROVIDERS)) continue;
    if (/-v2$|preview|ada-002-v2/.test(key)) continue;
    const price = perM(v.input_cost_per_token);
    if (!(price > 0)) continue;
    if (price > 5) {
      flagged.push(`embedding ${key}: implausible ${price}/1M, skipped`);
      continue;
    }
    out.push({ id: key, slug: slugify(key), name: key.replace(/^[^/]+\//, ''), provider: EMBED_PROVIDERS[v.litellm_provider], price, dims: v.output_vector_size ?? undefined, maxInput: v.max_input_tokens ?? undefined });
  }
  out.sort((a, b) => a.provider.localeCompare(b.provider) || a.price - b.price);
  return { list: out, flagged };
}

// ---------------------------------------------------------------- Hugging Face
async function hfArch(hfId) {
  const meta = await getJson(`https://huggingface.co/api/models/${hfId}?expand%5B%5D=safetensors`, 20000);
  const params = meta?.safetensors?.total;
  if (!params) return null;
  const raw = await getJson(`https://huggingface.co/${hfId}/resolve/main/config.json`, 20000);
  const c = raw.text_config ?? raw.llm_config ?? raw;
  const heads = c.num_attention_heads;
  const layers = c.num_hidden_layers ?? c.n_layer;
  if (!layers || !heads) return null;
  const arch = {
    params,
    layers,
    hidden: c.hidden_size ?? c.d_model,
    heads,
    intermediate: c.intermediate_size ?? c.moe_intermediate_size,
    vocab: c.vocab_size ?? raw.vocab_size,
    kvHeads: c.num_key_value_heads ?? heads,
    headDim: c.head_dim ?? (c.hidden_size ? Math.round(c.hidden_size / heads) : undefined),
    maxContext: c.max_position_embeddings,
    moe: !!(c.num_experts || c.n_routed_experts || c.num_local_experts),
    dtype: c.torch_dtype ?? raw.torch_dtype,
  };
  // Multi-head latent attention (DeepSeek-style) stores a compressed KV cache.
  if (c.kv_lora_rank) arch.mlaDim = c.kv_lora_rank + (c.qk_rope_head_dim ?? 0);
  return arch;
}

async function updateHf(models) {
  const cache = await readJson(HF_CACHE, {});
  // Refetch entries saved before `hidden` was recorded.
  const stale = (id) => !(id in cache) || (cache[id] && cache[id].hidden === undefined);
  const todo = [...new Set(models.filter((m) => m.hfId && stale(m.hfId)).map((m) => m.hfId))].slice(0, Number(process.env.HF_LIMIT || 60));
  let ok = 0;
  for (const id of todo) {
    try {
      cache[id] = await hfArch(id);
      if (cache[id]) ok++;
    } catch {
      cache[id] = null; // gated / missing; don't retry every day
    }
  }
  await writeJson(HF_CACHE, cache);
  return { cache, fetched: todo.length, ok };
}

// ---------------------------------------------------------------- history
function diff(prev, next, date) {
  const changes = [];
  const before = new Map(prev.map((m) => [m.id, m]));
  const after = new Map(next.map((m) => [m.id, m]));
  for (const [id, m] of after) {
    const o = before.get(id);
    if (!o) {
      changes.push({ date, id, name: m.name, type: 'new', input: m.input, output: m.output });
      continue;
    }
    for (const field of ['input', 'output', 'cacheRead']) {
      if (o[field] !== m[field] && o[field] !== undefined && m[field] !== undefined)
        changes.push({ date, id, name: m.name, type: 'price', field, from: o[field], to: m[field] });
    }
  }
  for (const [id, o] of before) if (!after.has(id)) changes.push({ date, id, name: o.name, type: 'removed' });
  return changes;
}

// ---------------------------------------------------------------- main
async function main() {
  const previous = await readJson(MODELS_FILE, null);
  let or, litellm;
  try {
    or = await getJson(OPENROUTER);
  } catch (e) {
    console.warn(`⚠️  OpenRouter unavailable (${e.message}). Keeping previous data.`);
    return;
  }
  try {
    litellm = await getJson(LITELLM, 60000);
  } catch (e) {
    console.warn(`⚠️  LiteLLM unavailable (${e.message}). Skipping cross-check.`);
  }

  const { models, flagged } = normalize(or, litellm);
  const prevCount = previous?.models?.length ?? 0;
  if (models.length < 40 || (prevCount && models.length < prevCount * 0.6)) {
    console.warn(`⚠️  Only ${models.length} models (previously ${prevCount}). Source looks broken; keeping previous data.`);
    return;
  }

  const emb = embeddings(litellm);
  flagged.push(...emb.flagged);
  const { cache, fetched, ok } = await updateHf(models);
  for (const m of models) if (m.hfId && cache[m.hfId]) m.arch = cache[m.hfId];

  const date = today();
  const changes = await readJson(CHANGES_FILE, []);
  const newChanges = previous ? diff(previous.models, models, date) : [];
  const priceChanged = newChanges.length > 0 || !previous;

  const data = {
    updated: priceChanged ? new Date().toISOString() : previous.updated,
    checked: new Date().toISOString(),
    trackingSince: previous?.trackingSince ?? date,
    sources: { pricing: 'OpenRouter models API', crossCheck: litellm ? 'LiteLLM price list' : null, architecture: 'Hugging Face' },
    flagged,
    embeddings: emb.list.length ? emb.list : previous?.embeddings ?? [],
    models,
  };
  await writeJson(MODELS_FILE, data);
  // Compact copy for client-side calculators (keeps page bundles small).
  const client = models.map((m) => ({
    id: m.id, slug: m.slug, name: m.name, p: m.providerName, i: m.input, o: m.output, cr: m.cacheRead, cw: m.cacheWrite,
    bi: m.batchInput, bo: m.batchOutput, t: m.tiers, ctx: m.context, mo: m.maxOutput,
    im: (m.inputModalities ?? []).includes('image') || undefined,
  }));
  await fs.writeFile(path.join(GEN, 'models-client.json'), JSON.stringify({ updated: data.updated, models: client, embeddings: data.embeddings }));
  if (newChanges.length) await writeJson(CHANGES_FILE, [...newChanges, ...changes].slice(0, 2000));
  else if (!previous) await writeJson(CHANGES_FILE, []);
  if (priceChanged) {
    const snap = Object.fromEntries(models.map((m) => [m.id, [m.input, m.output]]));
    await writeJson(path.join(HISTORY, `${date}.json`), snap);
  }

  const verified = models.filter((m) => m.verified === 'match').length;
  console.log(`   ${data.embeddings.length} embedding models`);
  console.log(`✅ ${models.length} models · ${verified} cross-checked · ${flagged.length} flagged · ${newChanges.length} changes · HF: ${ok}/${fetched} new configs`);
  for (const f of flagged.slice(0, 20)) console.log(`   ⚑ ${f}`);
}

await main();
