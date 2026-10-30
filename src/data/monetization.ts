// ─────────────────────────────────────────────────────────────────────────────
// Monetization settings: the ONLY file you need to edit.
//
// • Replace values containing "REPLACE". Until then they show as dashed
//   placeholders in `npm run dev` and are HIDDEN in production builds.
// • {placement} in a URL is replaced with where the link was shown, so your
//   affiliate/sponsor dashboard can tell you which spot performs.
// • Plain links only (no third-party scripts). Keep it that way: developers
//   block ad scripts, and the strict CSP is part of the site's credibility.
// ─────────────────────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  url: string;
  icon: string;
  sponsored: boolean;
}

export const MONETIZATION = {
  disclosure: 'Some links are affiliate or sponsored links. We may earn a commission at no extra cost to you. It keeps these calculators free.',

  app: {
    appStoreId: 'REPLACE_APP_STORE_ID',
    name: 'REPLACE App Name',
  },

  donate: {
    label: 'Buy me a coffee',
    url: 'REPLACE_DONATION_URL',
  },

  offers: {
    gpu: {
      id: 'gpu', kicker: 'Recommended', title: 'Rent the GPU this needs, by the hour',
      text: 'On-demand A100 / H100 / RTX GPUs for inference and fine-tuning.',
      cta: 'See GPU prices', url: 'REPLACE_GPU_CLOUD_REFERRAL_URL?ref={placement}', icon: 'server', sponsored: true,
    },
    llmops: {
      id: 'llmops', kicker: 'Sponsor', title: 'See exactly what your LLM calls cost',
      text: 'Per-request cost tracking, caching and fallbacks across providers.',
      cta: 'Learn more', url: 'REPLACE_LLM_OBSERVABILITY_SPONSOR_URL?utm_source=tokenmeter&utm_medium={placement}', icon: 'gauge', sponsored: true,
    },
    vectordb: {
      id: 'vectordb', kicker: 'Sponsor', title: 'A vector database that scales with you',
      text: 'Managed vector search with a free tier for prototypes.',
      cta: 'Start free', url: 'REPLACE_VECTOR_DB_SPONSOR_URL?utm_source=tokenmeter&utm_medium={placement}', icon: 'layers', sponsored: true,
    },
    billing: {
      id: 'billing', kicker: 'Recommended', title: 'Usage-based billing for AI products',
      text: 'Charge per token, per seat or per credit, with tax handled for you.',
      cta: 'Learn more', url: 'REPLACE_BILLING_AFFILIATE_URL?ref={placement}', icon: 'dollar', sponsored: true,
    },
    myapp: {
      id: 'myapp', kicker: 'Built by the author', title: 'REPLACE: your app’s headline',
      text: 'A one-line pitch for your own AI-powered iOS app.',
      cta: 'View on the App Store', url: 'https://apps.apple.com/app/idREPLACE_APP_STORE_ID', icon: 'phone', sponsored: false,
    },
  } satisfies Record<string, Offer>,

  placements: {
    llm: ['llmops'],
    gpu: ['gpu'],
    rag: ['vectordb', 'llmops'],
    saas: ['billing', 'myapp'],
    media: ['llmops'],
    guide: ['llmops', 'gpu'],
    sidebar: ['myapp'],
  },
} as const;

export type OfferId = keyof typeof MONETIZATION.offers;
export type PlacementId = keyof typeof MONETIZATION.placements;
export const isConfigured = (value: string) => !!value && !value.includes('REPLACE');
