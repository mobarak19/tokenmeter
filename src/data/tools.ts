// Tool registry: one entry per tool page (content written for people first).
import type { PlacementId } from './monetization';

export type Section = 'cost' | 'tokens' | 'hardware' | 'saas' | 'data';

export interface Tool {
  slug: string;
  section: Section;
  icon: string;
  name: string;
  card: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  placement?: PlacementId;
  sections: { h2: string; html: string }[];
  faq: [string, string][];
  related: string[];
}

export const SECTIONS: Record<Section, { name: string; short: string; icon: string; text: string }> = {
  cost: { name: 'AI cost calculators', short: 'Costs', icon: 'calculator', text: 'LLM, embedding, RAG, image and video costs from up-to-date prices.' },
  tokens: { name: 'Tokens & context', short: 'Tokens', icon: 'hash', text: 'Count and convert tokens, and check what fits in a context window.' },
  hardware: { name: 'GPU & hardware', short: 'GPU', icon: 'cpu', text: 'VRAM for inference and fine-tuning, quantization and self-hosting.' },
  saas: { name: 'AI SaaS economics', short: 'SaaS', icon: 'trending', text: 'Cost per user, profit, break-even and pricing for AI products.' },
  data: { name: 'Pricing data', short: 'Data', icon: 'table', text: 'Every model’s price, updated daily, with a log of every change.' },
};

export const TOOLS: Tool[] = [
  {
    slug: 'llm-cost-calculator',
    section: 'cost',
    icon: 'calculator',
    name: 'LLM API Cost Calculator',
    card: 'Cost per request, per day, per month and per user. Compare models side by side.',
    title: 'LLM API Cost Calculator: Compare GPT, Claude, Gemini & More',
    description: 'Calculate LLM API costs per request, day, month and user. Compare OpenAI, Anthropic, Google, Mistral, DeepSeek and open models with caching and batch discounts. Prices updated daily.',
    h1: 'LLM API cost calculator',
    lead: 'Estimate what your AI feature will cost per request, per month and per user, and compare models side by side with up-to-date prices.',
    placement: 'llm',
    sections: [
      {
        h2: 'How LLM API pricing works',
        html: `<p>Providers charge per <strong>token</strong> (roughly ¾ of an English word), with separate prices for <strong>input</strong> (your prompt, context and history) and <strong>output</strong> (the generated text). Output is usually several times more expensive.</p>
<pre><code>cost per request = input tokens × input price + output tokens × output price
monthly cost     = cost per request × requests per day × 30</code></pre>
<ul><li><strong>Prompt caching</strong> discounts repeated input (system prompts, documents) and can cut input costs dramatically. Writing to the cache may cost extra.</li><li><strong>Batch APIs</strong> process requests asynchronously at a discount, often around 50%.</li><li><strong>Long-context tiers</strong>: some models charge more once a prompt passes a token threshold. The calculator applies these automatically.</li><li><strong>Reasoning models</strong> generate hidden “thinking” tokens billed as output, so budget more output tokens for them.</li></ul>`,
      },
      {
        h2: 'Where the prices come from',
        html: `<p>Prices are refreshed automatically every day from the OpenRouter models API and cross-checked against the open-source LiteLLM price list. Where the two differ, the model page shows both. Open-weight models are priced at the lowest available hosted price. Always confirm on the provider’s pricing page before committing to a budget.</p>`,
      },
    ],
    faq: [
      ['How many tokens is a typical chat message?', 'A short user message is often 20–100 tokens, but the full request also includes the system prompt and conversation history, which can be thousands of tokens. Use the token counter to measure your real prompts.'],
      ['Why is my real bill higher than the estimate?', 'Common causes: conversation history grows each turn, reasoning tokens, retries, tool-call results added to context, and images or files counted as tokens.'],
      ['How often are prices updated?', 'Daily, automatically. Each page shows when prices were last updated, and the price changes page lists every change we detect.'],
    ],
    related: ['prompt-caching-calculator', 'llm-pricing', 'token-counter', 'self-host-vs-api-calculator'],
  },
  {
    slug: 'prompt-caching-calculator',
    section: 'cost',
    icon: 'repeat',
    name: 'Prompt Caching Calculator',
    card: 'How much prompt caching saves on your workload, per model.',
    title: 'Prompt Caching Calculator: LLM Cache Savings by Model',
    description: 'Calculate how much prompt caching saves on LLM API costs. Compare cached vs uncached input pricing across models for chatbots, RAG and agents.',
    h1: 'Prompt caching savings calculator',
    lead: 'See how much you save when a large share of each prompt (system prompt, documents, tools) is served from the provider’s cache.',
    placement: 'llm',
    sections: [
      {
        h2: 'When caching pays off',
        html: `<ul><li>A long, <strong>stable prefix</strong> such as a system prompt, tool definitions, a document or codebase context, reused across many requests.</li><li>Requests arriving <strong>close together</strong>. Caches expire after a few minutes unless refreshed (some providers offer longer lifetimes at a higher write price).</li><li>Structure prompts so the static part comes <strong>first</strong> and the variable part last.</li></ul>
<p>Cache <em>reads</em> are discounted heavily, but some providers charge a premium to <em>write</em> to the cache. A prefix that is reused only once or twice may not save money.</p>`,
      },
    ],
    faq: [
      ['What share of my input can be cached?', 'For chatbots with long system prompts and agents with large tool definitions, 50–90% of input tokens are often a cacheable prefix. For one-off prompts, close to 0%.'],
      ['Does every model support caching?', 'No. Models without published cache pricing are charged the normal input price in this calculator.'],
    ],
    related: ['llm-cost-calculator', 'llm-pricing', 'token-counter', 'self-host-vs-api-calculator'],
  },
  {
    slug: 'llm-pricing',
    section: 'data',
    icon: 'table',
    name: 'LLM Pricing Table',
    card: 'Every major model’s input, output, cache and batch price per 1M tokens. Sortable and filterable.',
    title: 'LLM API Pricing Comparison (Updated Daily): Price per 1M Tokens',
    description: 'Compare API prices per 1M tokens for GPT, Claude, Gemini, Llama, Mistral, DeepSeek, Qwen, Grok and more: input, output, cached input, batch and context window. Updated daily.',
    h1: 'LLM API pricing comparison',
    lead: 'Input, output, cached and batch prices per million tokens for every major model, updated automatically every day.',
    placement: 'llm',
    sections: [],
    faq: [
      ['Which LLM API is the cheapest?', 'Sort the table by input or output price. The cheapest models are usually small or open-weight models. For a fair comparison, use the cost calculator with your real token counts, since output-heavy workloads favour different models than input-heavy ones.'],
      ['Are these the official prices?', 'For first-party models we cross-check against the provider’s list price and mark matches with a ✓. Open-weight models show the lowest available hosted price. Confirm on the provider’s site before committing.'],
    ],
    related: ['llm-cost-calculator', 'llm-price-changes', 'prompt-caching-calculator', 'token-counter'],
  },
  {
    slug: 'token-counter',
    section: 'tokens',
    icon: 'hash',
    name: 'Token Counter',
    card: 'Count tokens in your prompt, see its cost across models and which context windows it fits.',
    title: 'Token Counter: Count GPT Tokens & Estimate LLM Cost (Private)',
    description: 'Count tokens in text with the GPT o200k tokenizer, estimate cost across LLMs and check which models’ context windows it fits. Runs in your browser, nothing is sent.',
    h1: 'Token counter & prompt cost',
    lead: 'Paste a prompt or document to count its tokens, see what it costs on popular models, and check which context windows it fits. Your text never leaves your browser.',
    placement: 'llm',
    sections: [
      {
        h2: 'Why token counts differ between models',
        html: `<p>Each model family uses its own tokenizer. This tool counts exactly with OpenAI’s <code>o200k_base</code> encoding (used by recent GPT models). Other families usually land within roughly ±20% for English and can differ more for code and non-Latin scripts. Rough rules for English: <strong>1 token ≈ 4 characters ≈ ¾ of a word</strong>.</p>
<p>Languages such as Bengali, Hindi, Thai or Arabic often need several times more tokens per word than English, which raises cost and uses up context faster. Test your own text.</p>`,
      },
    ],
    faq: [
      ['Is my text sent to a server?', 'No. Tokenisation runs entirely in your browser. The tokenizer data is downloaded once and nothing you paste is transmitted.'],
      ['Is the count exact for Claude or Gemini?', 'No, it’s an estimate based on the GPT tokenizer. Use the provider’s token-counting endpoint for exact billing counts.'],
    ],
    related: ['llm-cost-calculator', 'prompt-caching-calculator', 'llm-pricing', 'gpu-vram-calculator'],
  },
  {
    slug: 'gpu-vram-calculator',
    section: 'hardware',
    icon: 'cpu',
    name: 'GPU VRAM Calculator',
    card: 'How much GPU memory an LLM needs for weights + KV cache, and which GPUs or Macs can run it.',
    title: 'LLM GPU VRAM Calculator: Can I Run This Model?',
    description: 'Estimate the GPU memory needed to run an LLM: weights, KV cache and overhead by quantization (FP16, FP8, Q4…) and context length. See which GPUs and Macs can run it.',
    h1: 'GPU VRAM calculator for LLMs',
    lead: 'Pick an open model (or enter its size), choose a quantization and context length, and see the memory needed and which GPUs, Macs or phones can run it.',
    placement: 'gpu',
    sections: [
      {
        h2: 'How the estimate works',
        html: `<pre><code>weights   = parameters × bits per weight ÷ 8
KV cache  = 2 × layers × KV heads × head dim × context × batch × KV bytes
total     ≈ weights + KV cache + runtime overhead</code></pre>
<p>Model architectures (layers, KV heads, head size) come from each model’s published Hugging Face configuration, so grouped-query attention and DeepSeek-style latent attention are handled correctly. Mixture-of-experts models still need memory for <em>all</em> experts, even though only some are active per token.</p>
<div class="callout"><p>Real usage varies by runtime (llama.cpp, vLLM, MLX, Ollama), batch size and memory fragmentation. Leave 10–20% headroom.</p></div>`,
      },
    ],
    faq: [
      ['How much VRAM does a 7B or 8B model need?', 'The weights take about 14–16 GB at FP16 and about 4–5 GB at 4-bit. Add the KV cache (about 1 GB for 8K tokens on Llama-style 8B models) and runtime overhead.'],
      ['Can I run LLMs on a Mac?', 'Yes. Apple Silicon uses unified memory, but by default only part of it is available to the GPU. The calculator assumes about 70–75%.'],
      ['Can I run an LLM on an iPhone?', 'Small models (about 1–4B parameters at 4-bit) can run on recent iPhones with 8 GB of RAM, but iOS limits how much memory one app can use.'],
    ],
    related: ['self-host-vs-api-calculator', 'llm-cost-calculator', 'token-counter', 'llm-pricing'],
  },
  {
    slug: 'self-host-vs-api-calculator',
    section: 'hardware',
    icon: 'server',
    name: 'Self-host vs API Calculator',
    card: 'Break-even between renting GPUs and paying per token for your monthly volume.',
    title: 'Self-host vs API Calculator: LLM GPU Break-even',
    description: 'Compare the monthly cost of self-hosting an LLM on rented GPUs with paying per token for an API. Find your break-even token volume.',
    h1: 'Self-hosting vs API: break-even calculator',
    lead: 'Compare renting GPUs with paying per token, and find the monthly volume at which self-hosting starts to pay off.',
    placement: 'gpu',
    sections: [
      {
        h2: 'What this does and doesn’t include',
        html: `<p>It compares <strong>GPU rental</strong> against <strong>API token prices</strong> using your expected throughput. It doesn’t include engineering time, monitoring, autoscaling, redundancy or idle capacity at night, which often decide the question in practice. Throughput depends heavily on the model, quantization, batch size and serving stack (vLLM, TensorRT-LLM, llama.cpp), so benchmark your own setup.</p>`,
      },
    ],
    faq: [
      ['When does self-hosting make sense?', 'Usually at high, steady volume; with strict data-residency needs; or for fine-tuned open models. At low or spiky volume, APIs are usually cheaper because you pay nothing when idle.'],
      ['What throughput should I assume?', 'It varies enormously, from tens of tokens per second for a single stream on a consumer GPU to thousands for a batched server. Measure with your model and serving engine.'],
    ],
    related: ['gpu-vram-calculator', 'llm-cost-calculator', 'llm-pricing', 'prompt-caching-calculator'],
  },
  {
    slug: 'llm-price-changes',
    section: 'data',
    icon: 'history',
    name: 'LLM Price Changes',
    card: 'Every price change and new model we detect, updated daily.',
    title: 'LLM API Price Changes & New Models (Daily Log)',
    description: 'A daily log of LLM API price changes, new models and removed models across OpenAI, Anthropic, Google, Mistral, DeepSeek, Qwen and more.',
    h1: 'LLM price changes',
    lead: 'Price drops, increases, new models and retirements, detected automatically every day.',
    placement: 'llm',
    sections: [],
    faq: [
      ['How are changes detected?', 'A scheduled job downloads current prices every day, compares them with the previous snapshot and records every difference.'],
    ],
    related: ['llm-pricing', 'llm-cost-calculator', 'prompt-caching-calculator', 'token-counter'],
  },
  {
    slug: 'model-comparison-calculator', section: 'cost', icon: 'table', name: 'Model Comparison Calculator',
    card: 'Enter your monthly workload and compare what it costs on up to 6 models.',
    title: 'LLM Model Cost Comparison: Your Workload Across GPT, Claude, Gemini',
    description: 'Compare the cost of your actual monthly workload (total input tokens, output tokens and requests) across up to 6 LLMs side by side, with caching and batch pricing.',
    h1: 'Model comparison calculator', lead: 'A price table doesn’t tell you what your workload costs. Enter monthly totals and compare models directly.',
    placement: 'llm',
    sections: [{ h2: 'Why compare on your workload', html: `<p>One model may be cheaper on input and pricier on output than another. Which one wins depends on <em>your</em> ratio of input to output tokens. A RAG app (long context, short answers) and a writing tool (short prompt, long output) can rank models in opposite orders. Requests matter too: per-request size decides whether long-context pricing tiers apply.</p>` }],
    faq: [['Which LLM is cheapest?', 'It depends on your input/output mix and request size. Enter your monthly totals; the calculator sorts models by real cost for that workload.']],
    related: ['llm-cost-calculator', 'token-cost-calculator', 'llm-pricing', 'prompt-caching-calculator'],
  },
  {
    slug: 'token-cost-calculator', section: 'cost', icon: 'coins', name: 'Token Cost Calculator',
    card: 'How much do 1 million tokens cost? Totals for any model or your own prices.',
    title: 'Token Cost Calculator: How Much Do 1 Million Tokens Cost?',
    description: 'Calculate the cost of any number of input and output tokens for any LLM, or enter custom prices. Includes the cost of 1 million tokens for popular models, updated daily.',
    h1: 'Token cost calculator', lead: 'Enter token totals and pick a model, or type your own price per million, to get the cost instantly.',
    placement: 'llm',
    sections: [{ h2: 'The formula', html: `<pre><code>cost = input tokens ÷ 1,000,000 × input price
     + output tokens ÷ 1,000,000 × output price</code></pre><p>Prices are quoted per million tokens. A million tokens is roughly 750,000–900,000 English words with modern tokenizers, about 8–10 novels.</p>` }],
    faq: [['How much do 1 million tokens cost?', 'Anywhere from a few cents to tens of dollars, depending on the model and whether they are input or output tokens. See the table on this page for current prices of popular models.']],
    related: ['llm-cost-calculator', 'words-to-tokens-calculator', 'model-comparison-calculator', 'llm-pricing'],
  },
  {
    slug: 'embedding-cost-calculator', section: 'cost', icon: 'layers', name: 'Embedding Cost Calculator',
    card: 'Cost to embed your documents, plus vector count and storage size.',
    title: 'Embedding Cost Calculator: OpenAI, Cohere, Voyage, Gemini (+ Vector Storage)',
    description: 'Calculate the cost to embed documents for RAG and semantic search, the number of vectors, and vector storage size (float32, int8, binary). Embedding prices updated daily.',
    h1: 'Embedding cost calculator', lead: 'Estimate one-time and monthly embedding costs, how many vectors you’ll store and how much space they take.',
    placement: 'rag',
    sections: [{ h2: 'How it’s calculated', html: `<pre><code>tokens to embed = documents × tokens per document × (1 + chunk overlap)
vectors          = tokens to embed ÷ chunk size
storage          = vectors × dimensions × bytes per dimension</code></pre><p>Storing vectors as <strong>float32</strong> uses 4 bytes per dimension; <strong>int8</strong> quantization uses 1 byte; <strong>binary</strong> uses 1 bit, with some loss of retrieval quality. Vector databases add index and metadata overhead on top, often 1.5–3×.</p>` }],
    faq: [['How much does it cost to embed 1 million documents?', 'At 1,000 tokens each that is 1 billion tokens: about $20 with a $0.02/1M model, or $130 with a $0.13/1M model, before chunk overlap.']],
    related: ['rag-cost-calculator', 'token-cost-calculator', 'words-to-tokens-calculator', 'llm-cost-calculator'],
  },
  {
    slug: 'rag-cost-calculator', section: 'cost', icon: 'search', name: 'RAG Cost Calculator',
    card: 'Indexing + retrieval + generation: cost per query, per user and per month.',
    title: 'RAG Cost Calculator: Cost per Query, User & Month',
    description: 'Estimate the full cost of a retrieval-augmented generation (RAG) app: document embedding, vector database, query embeddings and LLM input/output tokens, per query, per user and per month.',
    h1: 'RAG cost calculator', lead: 'Model every part of a RAG pipeline (indexing, retrieval context and answers) to see your real cost per query.',
    placement: 'rag',
    sections: [{ h2: 'Where RAG money goes', html: `<p>Embedding a corpus is usually a small one-time cost. The ongoing cost is <strong>generation</strong>: every query sends the system prompt, the question and <em>k retrieved chunks</em> to the LLM. Retrieving 8 chunks of 500 tokens adds 4,000 input tokens to every answer.</p><pre><code>input per query = system prompt + question + k × chunk size
cost per query  = query embedding + input × input price + output × output price</code></pre><p>Biggest levers: fewer or smaller chunks (better retrieval), prompt caching for the system prompt, and a cheaper model for simple questions.</p>` }],
    faq: [['How much does a RAG query cost?', 'Typically a fraction of a cent to a few cents: mostly the LLM input (retrieved context) and output tokens. Use your own chunk size, k and model above.']],
    related: ['embedding-cost-calculator', 'prompt-caching-calculator', 'ai-saas-cost-calculator', 'llm-cost-calculator'],
  },
  {
    slug: 'image-token-calculator', section: 'cost', icon: 'image', name: 'Image Token Calculator',
    card: 'How many tokens an image costs as input to GPT, Claude or Gemini.',
    title: 'Image Token Calculator: Vision Tokens for GPT, Claude & Gemini',
    description: 'Calculate how many input tokens an image uses for multimodal models (OpenAI tiles, Claude, Gemini) and the cost per image and per 1,000 images. Drop an image to read its size locally.',
    h1: 'Image token calculator', lead: 'Images are billed as tokens. Enter the size (or drop the image) to see how many tokens and dollars each one costs.',
    placement: 'media',
    sections: [{ h2: 'How providers count image tokens', html: `<ul><li><strong>OpenAI (tile method)</strong>: fit within 2048 px, scale the shortest side to 768 px, then 170 tokens per 512 px tile + 85. “Low detail” is a flat 85.</li><li><strong>Anthropic Claude</strong>: about width × height ÷ 750, after scaling down large images (long edge ≤ 1568 px).</li><li><strong>Google Gemini 2.x</strong>: 258 tokens if both sides ≤ 384 px, otherwise 258 per 768 × 768 tile. Newer Gemini models instead use a fixed token budget per image set by the <em>media resolution</em> option.</li></ul><div class="callout"><p>These are the providers’ published formulas. Newer models sometimes use different rules, so check the linked documentation for the exact model you use.</p></div><p><strong>Saving tip:</strong> resizing photos before sending them often cuts image tokens several-fold with no loss for most tasks.</p>` }],
    faq: [['How many tokens is an iPhone photo?', 'A 4032 × 3024 photo is 765 tokens with the OpenAI tile method (detail high) and about 1,530 with Claude after resizing. Gemini depends on the model: the Gemini 2.x tile rule gives 6,192, while newer Gemini models use a fixed per-image budget set by the media resolution option.']],
    related: ['ai-image-cost-calculator', 'llm-cost-calculator', 'token-counter', 'context-window-calculator'],
  },
  {
    slug: 'ai-image-cost-calculator', section: 'cost', icon: 'sparkles', name: 'AI Image Generation Cost',
    card: 'Daily, monthly and yearly cost of generating images, per 1,000 images.',
    title: 'AI Image Generation Cost Calculator (per Image, Day, Month)',
    description: 'Estimate the cost of AI image generation for your app: images per request, requests per day, price per image and retries. Daily, monthly, annual cost and cost per 1,000 images.',
    h1: 'AI image generation cost calculator', lead: 'Plan the budget for an image-generation feature: enter your volume and price per image.',
    placement: 'media',
    sections: [{ h2: 'Things that change the price per image', html: `<ul><li><strong>Resolution and quality</strong> settings: larger or “HD” images often cost 2–4× more.</li><li><strong>Retries and variations</strong>: users regenerate. A 25% retry rate means 1.25× the images.</li><li><strong>Model choice</strong>: open models on your own GPU can be far cheaper at volume. Compare with the self-hosting calculator.</li></ul><p>Use the current price from your provider’s pricing page for the exact model and size you use.</p>` }],
    faq: [['How much does it cost to generate 1,000 AI images?', 'Price per image × 1,000. At $0.04 per image, $40; at $0.01, $10. Retries add on top.']],
    related: ['ai-video-cost-calculator', 'image-token-calculator', 'ai-saas-cost-calculator', 'self-host-vs-api-calculator'],
  },
  {
    slug: 'ai-video-cost-calculator', section: 'cost', icon: 'image', name: 'AI Video Generation Cost',
    card: 'Cost per video, per minute, per day and per month for AI video generation.',
    title: 'AI Video Generation Cost Calculator (per Second, Minute & Month)',
    description: 'Estimate AI video generation costs from duration, price per second and videos per day: cost per video, per minute of footage, daily, monthly and per 1,000 videos.',
    h1: 'AI video generation cost calculator', lead: 'AI video is usually priced per second of output. See what your feature costs at scale.',
    placement: 'media',
    sections: [{ h2: 'Why video budgets surprise people', html: `<p>Video models typically charge <strong>per second of generated video</strong>, often with higher rates for 1080p or with audio. Users rarely keep the first take, so include a retry rate. A 10-second clip at $0.10/second is $1.00, and 50 clips a day is $1,500 a month.</p>` }],
    faq: [['How much does AI video cost per minute?', 'Price per second × 60. At $0.10/second, $6 per minute of generated video, before retries.']],
    related: ['ai-image-cost-calculator', 'ai-saas-cost-calculator', 'llm-cost-calculator', 'self-host-vs-api-calculator'],
  },
  {
    slug: 'words-to-tokens-calculator', section: 'tokens', icon: 'type', name: 'Words ↔ Tokens Calculator',
    card: 'Convert words, characters, pages and tokens using measured ratios by language.',
    title: 'Words to Tokens Calculator (and Tokens to Words), by Language',
    description: 'Convert between words, characters, pages and LLM tokens using ratios measured with the GPT o200k tokenizer for English, Spanish, German, Hindi, Bengali, Chinese, code and more.',
    h1: 'Words ↔ tokens calculator', lead: 'Convert words, characters or pages to tokens (and back) using ratios measured for each language.',
    placement: 'llm',
    sections: [{ h2: 'Measured, not guessed', html: `<p>The old rule “1 token ≈ ¾ word” comes from older tokenizers. With modern ones (like OpenAI’s <code>o200k_base</code>), English is closer to <strong>1.1 tokens per word</strong>, while languages such as German, Russian, Hindi, Arabic and Bengali need 1.4–2× as many tokens per word, so the same content costs more. Ratios here were measured on sample text; your text may vary by about ±15%. For exact counts, paste your text into the token counter.</p>` }],
    faq: [['How many tokens is 1,000 words?', 'About 1,100 tokens in English with modern GPT tokenizers, and roughly 1,200–1,900 in other languages.'], ['How many words is 1 million tokens?', 'About 900,000 English words with modern tokenizers.']],
    related: ['token-counter', 'context-window-calculator', 'token-cost-calculator', 'llm-cost-calculator'],
  },
  {
    slug: 'context-window-calculator', section: 'tokens', icon: 'file', name: 'Context Window Calculator',
    card: 'Will your document fit? Context used and space left on each model.',
    title: 'Context Window Calculator: Will My Text Fit in GPT, Claude or Gemini?',
    description: 'Check whether a document fits a model’s context window: estimate tokens from words or pages, reserve room for the answer, and see % used and tokens remaining per model.',
    h1: 'Context window calculator', lead: 'Estimate your document’s tokens, reserve space for the answer, and see how much room each model has left.',
    placement: 'llm',
    sections: [{ h2: 'Leave room for the answer', html: `<p>The context window holds <strong>everything</strong>: system prompt, conversation, documents <em>and</em> the generated answer. A model with a 128K window can’t take 127K tokens of input and still write a long reply. Also, quality on very long inputs varies by model, so fitting isn’t the same as using it well. Put the most important material near the start or end.</p>` }],
    faq: [['How many pages fit in a 128K context window?', 'About 115,000 English words, or roughly 230 pages of 500 words, minus space for instructions and the answer.']],
    related: ['token-counter', 'words-to-tokens-calculator', 'llm-cost-calculator', 'rag-cost-calculator'],
  },
  {
    slug: 'quantization-calculator', section: 'hardware', icon: 'gauge', name: 'Quantization Calculator',
    card: 'Model size at FP32, FP16, INT8, Q6, Q5, Q4, Q3 and Q2, and the GPU each needs.',
    title: 'LLM Quantization Calculator: Model Size at FP16, INT8, Q4 (GGUF)',
    description: 'See how much memory an LLM needs at every precision (FP32, FP16, FP8/INT8, GGUF Q8_0 to Q2_K) and the smallest GPU or Mac that runs each, plus quality trade-offs.',
    h1: 'Quantization calculator', lead: 'Pick a model size to see its memory at every quantization level and which hardware runs it.',
    placement: 'gpu',
    sections: [{ h2: 'Choosing a quantization', html: `<ul><li><strong>FP16 / BF16</strong>: original quality, 2 bytes per weight.</li><li><strong>8-bit (FP8, INT8, Q8_0)</strong>: half the memory with near-identical quality.</li><li><strong>Q5/Q4 (e.g. Q4_K_M, AWQ, GPTQ)</strong>: the usual sweet spot for local use, about ¼ of FP16 with small quality loss.</li><li><strong>Q3/Q2</strong>: big savings but noticeable degradation, especially on smaller models.</li></ul><p>Bits per weight for GGUF formats are averages (they mix precisions across tensors).</p>` }],
    faq: [['How big is a 7B model in 4-bit?', 'About 4 GB of weights with Q4_K_M (≈4.9 bits per weight), plus the KV cache and runtime overhead.']],
    related: ['gpu-vram-calculator', 'lora-vram-calculator', 'self-host-vs-api-calculator', 'llm-pricing'],
  },
  {
    slug: 'lora-vram-calculator', section: 'hardware', icon: 'cpu', name: 'LoRA / Fine-tuning VRAM',
    card: 'GPU memory for full fine-tuning, LoRA and QLoRA, with the trainable parameter count.',
    title: 'LoRA & QLoRA VRAM Calculator: Fine-tuning Memory Requirements',
    description: 'Estimate GPU memory for fine-tuning an LLM with full fine-tuning, LoRA or QLoRA: weights, optimizer states, gradients and activations by sequence length, batch size and LoRA rank.',
    h1: 'LoRA / fine-tuning VRAM calculator', lead: 'Estimate the GPU memory you need to fine-tune a model, and how many parameters LoRA actually trains.',
    placement: 'gpu',
    sections: [{ h2: 'Where training memory goes', html: `<ul><li><strong>Weights</strong>: 2 bytes/param (bf16), or about 0.52 with QLoRA’s 4-bit NF4.</li><li><strong>Optimizer + gradients</strong>: about 14 extra bytes per <em>trainable</em> parameter with AdamW (gradients, fp32 master copy, two moment estimates). Full fine-tuning totals about 16 bytes/param; LoRA trains well under 1% of parameters.</li><li><strong>Activations</strong>: grow with sequence length × batch size. Gradient checkpointing trades compute for a large reduction.</li></ul><p>Estimates assume FlashAttention and a single GPU; DeepSpeed/FSDP sharding splits the optimizer memory across GPUs. Expect ±30%.</p>` }],
    faq: [['How much VRAM to fine-tune a 7B model?', 'Full fine-tuning: roughly 110–120 GB (multiple GPUs). LoRA: about 16–20 GB. QLoRA: about 6–10 GB at moderate sequence lengths with gradient checkpointing.']],
    related: ['gpu-vram-calculator', 'quantization-calculator', 'self-host-vs-api-calculator', 'llm-pricing'],
  },
  {
    slug: 'ai-saas-cost-calculator', section: 'saas', icon: 'trending', name: 'AI SaaS Cost & Profit Calculator',
    card: 'AI cost per user, profit, break-even users and the price you need to charge.',
    title: 'AI SaaS Cost & Profit Calculator: Cost per User, Break-even, Pricing',
    description: 'Plan an AI app’s economics: AI cost per user from real model prices, payment/app store fees, infrastructure, profit and margin, break-even users and the minimum price for your target margin.',
    h1: 'AI SaaS cost & profit calculator', lead: 'Turn usage assumptions into AI cost per user, profit, break-even and the subscription price you actually need.',
    placement: 'saas',
    sections: [{ h2: 'Why AI apps need different pricing maths', html: `<p>Traditional SaaS has near-zero marginal cost per user. AI products don’t: every message costs money, <strong>including messages from free users</strong>. Heavy users can cost more than they pay. This calculator spreads AI cost across all active users, then checks whether paying users cover it.</p><pre><code>AI cost per user = active % × messages/day × 30 × cost per message
minimum price    = (AI + infra per user + paying % × fixed fee)
                   ÷ (paying % × (1 − fee % − target margin))</code></pre><p>Selling through the App Store? Set the fee to 15% or 30% (see the sister site for App Store maths).</p>` }],
    faq: [['How much should I charge for an AI app?', 'Enough to cover AI cost for all active users (including free ones) plus fees and infrastructure, with margin left. The “minimum price” result solves this for your target margin.']],
    related: ['llm-cost-calculator', 'rag-cost-calculator', 'prompt-caching-calculator', 'model-comparison-calculator'],
  },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug)!;
export const toolsIn = (s: Section) => TOOLS.filter((t) => t.section === s);
