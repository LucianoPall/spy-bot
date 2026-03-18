export type ImageType = 'generated' | 'uploaded' | 'unsplash' | 'placeholder';
export type ImageProvider = 'dalle' | 'supabase' | 'unsplash' | 'fallback';
export type FallbackReason = 'upload_failed' | 'unsplash_failed' | 'dalle_failed';

export interface ImageSource {
  provider: ImageProvider;
  uploadedAt?: string;
  expiresAt?: string;
}

export interface ImageMetadata {
  fallbackReason?: FallbackReason;
  retryCount?: number;
  uploadDuration?: number;
}

export interface GeneratedImage {
  url: string;
  type: ImageType;
  isTemporary: boolean;
  niche: string;
  source: ImageSource;
  metadata: ImageMetadata;
}

export interface GeneratedImages {
  image1: GeneratedImage;
  image2: GeneratedImage;
  image3: GeneratedImage;
}

// ============================================
// Análise Estratégica Profunda (Feature v2)
// ============================================

export interface StrategicAnalysis {
  hook: string;                  // "Você já tentou de tudo e não funcionou?"
  promise: string;               // "Perca 10kg em 30 dias sem academia"
  emotion: string;               // "Frustração + esperança"
  cta: string;                   // "Clique e acesse agora"
  persuasion_structure: string;  // "PAS — Problema, Agitação, Solução"
  angle: string;                 // "Prova social com depoimento"
  offer_type: string;            // "Lead magnet + upsell"
}
