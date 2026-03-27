/**
 * Validação de URLs para prevenção de ataques de DoS
 * - Limite de tamanho (2048 caracteres)
 * - Whitelist de domínios (apenas Facebook)
 * - Detecção de caracteres suspeitos
 */

export const URL_MAX_LENGTH = 2048;
export const FACEBOOK_AD_DOMAINS = [
  'facebook.com',
  'ads.facebook.com',
  'business.facebook.com',
  'l.facebook.com',
  'm.facebook.com',
];

export interface URLValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida uma URL de anúncio do Facebook
 * @param url - URL a ser validada
 * @returns Resultado da validação
 */
export function validateFacebookAdUrl(url: string): URLValidationResult {
  // Check 1: URL vazia
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL é obrigatória' };
  }

  // Check 2: Tamanho máximo
  if (url.length > URL_MAX_LENGTH) {
    return {
      valid: false,
      error: `URL muito longa (máx ${URL_MAX_LENGTH} caracteres, você tem ${url.length})`
    };
  }

  // Check 3: Parse URL (validar sintaxe)
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: 'URL malformada ou inválida' };
  }

  // Check 4: Domínio whitelisted
  const hostname = parsedUrl.hostname;
  if (!hostname) {
    return { valid: false, error: 'URL não possui hostname válido' };
  }

  const isFacebookDomain = FACEBOOK_AD_DOMAINS.some(domain =>
    hostname.endsWith(domain) || hostname === domain
  );

  if (!isFacebookDomain) {
    return {
      valid: false,
      error: `URL deve ser do Facebook (facebook.com, ads.facebook.com, etc). Domínio encontrado: ${hostname}`
    };
  }

  // Check 5: Caracteres suspeitos (possíveis ataques XSS)
  const suspiciousPatterns = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const urlLower = url.toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (urlLower.includes(pattern)) {
      return { valid: false, error: `URL contém padrão suspeito: "${pattern}"` };
    }
  }

  // Check 6: Validar que a URL usa HTTPS (segurança)
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return {
      valid: false,
      error: `URL deve usar protocolo HTTP ou HTTPS. Encontrado: ${parsedUrl.protocol}`
    };
  }

  // Se chegou aqui, a URL é válida
  return { valid: true };
}

/**
 * Valida tamanho e tipo de dados comuns
 */
export interface InputValidationResult {
  valid: boolean;
  error?: string;
}

export function validateInputString(
  value: string | unknown,
  fieldName: string,
  maxLength: number = 5000,
  minLength: number = 1
): InputValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} deve ser texto` };
  }

  if (value.length < minLength) {
    return { valid: false, error: `${fieldName} é obrigatório` };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} não pode exceder ${maxLength} caracteres`
    };
  }

  return { valid: true };
}

/**
 * Sanitiza entrada de usuário (básico)
 * NOTA: Para proteção real contra XSS, use bibliotecas especializadas como DOMPurify
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
