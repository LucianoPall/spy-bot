/**
 * Services Index
 *
 * Re-exporta todos os services para imports limpos
 * Exemplo:
 *   import { extractAdWithApify, generateCopyVariations } from '@/services'
 */

export * from './apify.service';
export * from './claude.service';   // copy via Claude Sonnet 4.6 (substitui openai.service)
export * from './image.service';    // imagens via Pollinations.ai (Flux) + prompts Claude Haiku (substitui dalle.service)
export * from './billing.service';
export * from './storage.service';
