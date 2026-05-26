/**
 * Landing Page Scraper
 *
 * Busca HTML da landing page (URL de destino do anúncio) e extrai texto
 * relevante (title, meta description, h1, h2, primeiros parágrafos) pra
 * enriquecer o contexto de detecção de nicho.
 *
 * Usado como fallback quando o copy do Apify é fraco (muito curto / confiança
 * baixa). Falha graciosa: nunca lança — retorna string vazia.
 */

import { log } from '@/lib/logger';

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 1_000_000; // 1MB — evita baixar landing gigante
const MAX_OUTPUT_CHARS = 2000;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface LandingScrapeResult {
  success: boolean;
  text: string;
  url: string;
  finalUrl?: string;
  reason?: string;
}

/**
 * Normaliza uma string que pode vir como domínio puro ("exemplo.com"),
 * URL sem protocolo, ou URL completa. Retorna URL válida ou null.
 */
export function normalizeLandingUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(withProtocol);
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Busca a landing page e extrai texto relevante pra detecção de nicho.
 * Nunca lança — falha retorna { success: false, text: '' }.
 */
export async function scrapeLandingForNicheContext(
  rawUrl: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<LandingScrapeResult> {
  const url = normalizeLandingUrl(rawUrl);
  if (!url) {
    return { success: false, text: '', url: rawUrl, reason: 'URL inválida' };
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    log.info('LANDING_SCRAPER', 'Visitando landing page', { url });

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timeoutHandle);

    if (!response.ok) {
      return {
        success: false,
        text: '',
        url,
        finalUrl: response.url,
        reason: `HTTP ${response.status}`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('xml')) {
      return {
        success: false,
        text: '',
        url,
        finalUrl: response.url,
        reason: `Content-type não-HTML: ${contentType}`,
      };
    }

    // Ler com limite de bytes pra evitar landing gigante
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, text: '', url, finalUrl: response.url, reason: 'Sem body' };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
    try { await reader.cancel(); } catch { /* noop */ }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks.map(c => Buffer.from(c))));
    const text = extractNicheRelevantText(html);

    if (!text) {
      return {
        success: false,
        text: '',
        url,
        finalUrl: response.url,
        reason: 'Sem texto extraído (landing vazia ou SPA)',
      };
    }

    log.info('LANDING_SCRAPER', 'Landing scrapeada', {
      url,
      finalUrl: response.url !== url ? response.url : undefined,
      chars: text.length,
    });

    return { success: true, text, url, finalUrl: response.url };
  } catch (error: unknown) {
    clearTimeout(timeoutHandle);
    const reason = error instanceof Error ? error.message : String(error);
    log.warn('LANDING_SCRAPER', 'Falha ao scrapear landing', { url, reason });
    return { success: false, text: '', url, reason };
  }
}

/**
 * Extrai trechos relevantes de HTML pra detecção de nicho:
 * title, meta description, h1, h2, primeiros parágrafos.
 * Remove scripts/styles primeiro. Retorna string concatenada.
 */
function extractNicheRelevantText(html: string): string {
  if (!html) return '';

  // Remover scripts, styles, noscript — lixo que atrapalha detecção
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');

  const parts: string[] = [];

  const title = matchFirst(cleaned, /<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (title) parts.push(title);

  const metaDesc = matchFirst(
    cleaned,
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
  );
  if (metaDesc) parts.push(metaDesc);

  const ogDesc = matchFirst(
    cleaned,
    /<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogDesc && ogDesc !== metaDesc) parts.push(ogDesc);

  // Até 3 h1 e 5 h2
  parts.push(...matchAll(cleaned, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, 3));
  parts.push(...matchAll(cleaned, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, 5));

  // Primeiros parágrafos (até 5)
  parts.push(...matchAll(cleaned, /<p\b[^>]*>([\s\S]*?)<\/p>/gi, 5));

  const joined = parts
    .map(stripHtmlAndNormalize)
    .filter(s => s.length > 0)
    .join(' | ');

  return joined.slice(0, MAX_OUTPUT_CHARS);
}

function matchFirst(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m && m[1] ? m[1] : null;
}

function matchAll(text: string, re: RegExp, max: number): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const regex = new RegExp(re.source, re.flags);
  while ((m = regex.exec(text)) !== null && out.length < max) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function stripHtmlAndNormalize(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
