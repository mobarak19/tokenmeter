// LLM inference memory estimate (weights + KV cache + runtime overhead).
export const QUANTS = [
  { id: 'fp16', label: 'FP16 / BF16', bits: 16 },
  { id: 'fp8', label: 'FP8 / INT8', bits: 8 },
  { id: 'q8_0', label: 'GGUF Q8_0', bits: 8.5 },
  { id: 'q6_k', label: 'GGUF Q6_K', bits: 6.56 },
  { id: 'q5_k_m', label: 'GGUF Q5_K_M', bits: 5.69 },
  { id: 'q4_k_m', label: 'GGUF Q4_K_M / AWQ / GPTQ 4-bit', bits: 4.89 },
  { id: 'q3_k_m', label: 'GGUF Q3_K_M', bits: 3.91 },
  { id: 'q2_k', label: 'GGUF Q2_K', bits: 2.96 },
  { id: 'fp32', label: 'FP32', bits: 32 },
] as const;

export const KV_BITS = [
  { id: '16', label: 'FP16 (default)', bits: 16 },
  { id: '8', label: 'FP8 / Q8', bits: 8 },
  { id: '4', label: 'Q4', bits: 4 },
] as const;

/** Memory you can actually use. Apple Silicon reserves part of unified memory for the system by default. */
export const DEVICES = [
  { id: 'rtx3060', name: 'RTX 3060', gb: 12, kind: 'GPU' },
  { id: 'rtx4060ti', name: 'RTX 4060 Ti 16GB', gb: 16, kind: 'GPU' },
  { id: 't4', name: 'NVIDIA T4', gb: 16, kind: 'Cloud GPU' },
  { id: 'rtx3090', name: 'RTX 3090', gb: 24, kind: 'GPU' },
  { id: 'rtx4090', name: 'RTX 4090', gb: 24, kind: 'GPU' },
  { id: 'l4', name: 'NVIDIA L4', gb: 24, kind: 'Cloud GPU' },
  { id: 'rtx5090', name: 'RTX 5090', gb: 32, kind: 'GPU' },
  { id: 'a100-40', name: 'A100 40GB', gb: 40, kind: 'Cloud GPU' },
  { id: 'l40s', name: 'L40S', gb: 48, kind: 'Cloud GPU' },
  { id: 'a100-80', name: 'A100 80GB', gb: 80, kind: 'Cloud GPU' },
  { id: 'h100', name: 'H100 80GB', gb: 80, kind: 'Cloud GPU' },
  { id: 'h200', name: 'H200', gb: 141, kind: 'Cloud GPU' },
  { id: 'mi300x', name: 'AMD MI300X', gb: 192, kind: 'Cloud GPU' },
  { id: 'mac16', name: 'Mac, 16 GB unified', gb: 16 * 0.7, kind: 'Apple Silicon' },
  { id: 'mac24', name: 'Mac, 24 GB unified', gb: 24 * 0.7, kind: 'Apple Silicon' },
  { id: 'mac36', name: 'Mac, 36 GB unified', gb: 36 * 0.75, kind: 'Apple Silicon' },
  { id: 'mac64', name: 'Mac, 64 GB unified', gb: 64 * 0.75, kind: 'Apple Silicon' },
  { id: 'mac128', name: 'Mac, 128 GB unified', gb: 128 * 0.75, kind: 'Apple Silicon' },
  { id: 'mac192', name: 'Mac, 192 GB unified', gb: 192 * 0.75, kind: 'Apple Silicon' },
  { id: 'iphone8', name: 'iPhone with 8 GB RAM', gb: 8 * 0.45, kind: 'On-device' },
] as const;

export interface Arch {
  params: number;
  layers: number;
  kvHeads: number;
  headDim: number;
  mlaDim?: number;
}

export function estimate(a: Arch, weightBits: number, kvBits: number, context: number, batch: number) {
  const GiB = 1024 ** 3; // GPU memory is sold in GiB ("24 GB" = 24 × 2^30 bytes)
  const weights = (a.params * weightBits) / 8 / GiB;
  const perTokenKv = a.mlaDim ? a.layers * a.mlaDim : 2 * a.layers * a.kvHeads * a.headDim;
  const kv = (perTokenKv * context * batch * kvBits) / 8 / GiB;
  const overhead = 0.8 + weights * 0.05; // runtime buffers, activations, CUDA context (rough)
  return { weights, kv, overhead, total: weights + kv + overhead, kvPerToken: (perTokenKv * kvBits) / 8 };
}
