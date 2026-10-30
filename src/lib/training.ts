// Fine-tuning memory estimate (full fine-tune, LoRA, QLoRA). GiB throughout.
// Per-parameter accounting (mixed precision, AdamW): bf16 weights 2 B + bf16 grads 2 B
// + fp32 master weights 4 B + Adam m and v 8 B = 16 B per trainable parameter.
// Activations follow Korthikanti et al. (2022) with FlashAttention (no s² term):
// ≈ 34·h·s·b bytes per layer; with checkpointing only each layer's input (2·h·s·b) is kept.
export interface TrainArch {
  params: number; layers: number; hidden: number; heads: number; kvHeads: number; headDim: number; intermediate: number; vocab: number;
}
export type Method = 'full' | 'lora' | 'qlora';
export interface TrainOpts { method: Method; rank: number; targets: 'attn' | 'all'; seq: number; batch: number; checkpointing: boolean; optimizer: 'adamw' | 'adamw8bit' }

const GiB = 1024 ** 3;

export function loraParams(a: TrainArch, rank: number, targets: 'attn' | 'all') {
  const q = a.heads * a.headDim, kv = a.kvHeads * a.headDim;
  // LoRA adds A (in×r) and B (r×out) to each adapted matrix: r·(in + out) parameters.
  let perLayer = rank * ((a.hidden + q) + (a.hidden + kv) * 2 + (q + a.hidden));
  if (targets === 'all') perLayer += rank * ((a.hidden + a.intermediate) * 2 + (a.intermediate + a.hidden));
  return perLayer * a.layers;
}

export function trainMemory(a: TrainArch, o: TrainOpts) {
  const baseBytes = o.method === 'qlora' ? 0.5156 : 2; // NF4 with double quantization ≈ 4.125 bits
  const base = (a.params * baseBytes) / GiB;
  const trainable = o.method === 'full' ? a.params : loraParams(a, o.rank, o.targets);
  const stateBytes = o.optimizer === 'adamw8bit' ? 2 : 8;
  // full: 2 (grads) + 4 (master) + Adam states on top of the bf16 weights already in `base`
  // LoRA: adapters kept in fp32: 4 (weights) + 4 (grads) + Adam states
  const perTrainable = o.method === 'full' ? 2 + 4 + stateBytes : 4 + 4 + stateBytes;
  const optimizer = (trainable * perTrainable) / GiB;
  const tokens = o.seq * o.batch;
  const perLayerFull = 34 * a.hidden * tokens;
  const activations = (o.checkpointing ? a.layers * 2 * a.hidden * tokens + perLayerFull : a.layers * perLayerFull) / GiB;
  const logits = (tokens * a.vocab * 4) / GiB; // fp32 logits for the loss
  const overhead = 1; // CUDA context, allocator fragmentation
  const total = base + optimizer + activations + logits + overhead;
  return { base, trainable, optimizer, activations, logits, overhead, total, trainablePct: (trainable / a.params) * 100 };
}
