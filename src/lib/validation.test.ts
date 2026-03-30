import { describe, it, expect } from 'vitest';
import {
  validateFacebookAdUrl,
  validateInputString,
  sanitizeInput,
  URL_MAX_LENGTH
} from './validation';

describe('validateFacebookAdUrl', () => {
  // ✅ URLs válidas
  it('deve aceitar URL válida do Facebook ads', () => {
    const result = validateFacebookAdUrl(
      'https://ads.facebook.com/ads/library/?ad_type=all&country=US'
    );
    expect(result.valid).toBe(true);
  });

  it('deve aceitar URL do Facebook commerce', () => {
    const result = validateFacebookAdUrl(
      'https://business.facebook.com/pages/123'
    );
    expect(result.valid).toBe(true);
  });

  it('deve aceitar URL do Facebook com parâmetros', () => {
    const result = validateFacebookAdUrl(
      'https://facebook.com/ads/library/?country=BR&page=1'
    );
    expect(result.valid).toBe(true);
  });

  // ❌ URLs inválidas - tamanho
  it('deve rejeitar URL muito longa', () => {
    const longUrl = 'https://ads.facebook.com/' + 'a'.repeat(3000);
    const result = validateFacebookAdUrl(longUrl);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('muito longa');
  });

  // ❌ URLs inválidas - domínio
  it('deve rejeitar domínio não-Facebook', () => {
    const result = validateFacebookAdUrl('https://google.com/search');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Facebook');
  });

  it('deve rejeitar domínio Instagram', () => {
    const result = validateFacebookAdUrl('https://instagram.com/profile');
    expect(result.valid).toBe(false);
  });

  // ❌ URLs inválidas - malformadas
  it('deve rejeitar URL malformada', () => {
    const result = validateFacebookAdUrl('not a url');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('malformada');
  });

  it('deve rejeitar URL vazia', () => {
    const result = validateFacebookAdUrl('');
    expect(result.valid).toBe(false);
  });

  // ❌ URLs inválidas - caracteres suspeitos
  it('deve rejeitar URL com javascript: protocol', () => {
    const result = validateFacebookAdUrl('javascript:alert("xss")');
    expect(result.valid).toBe(false);
    // Pode falhar no parse da URL ou na detecção de padrão suspeito
    expect(result.error).toBeDefined();
  });

  it('deve rejeitar URL com data: protocol', () => {
    const result = validateFacebookAdUrl(
      'data:text/html,<img src=x onerror=alert("xss")>'
    );
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar URL com vbscript: protocol', () => {
    const result = validateFacebookAdUrl('vbscript:msgbox("xss")');
    expect(result.valid).toBe(false);
  });

  // ❌ URLs inválidas - protocolo
  it('deve rejeitar URL sem protocolo seguro', () => {
    const result = validateFacebookAdUrl('ftp://ads.facebook.com/file');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('HTTP ou HTTPS');
  });

  // ✅ URL com comprimento máximo permitido
  it('deve aceitar URL no limite exato de tamanho', () => {
    // Criar URL com exatamente URL_MAX_LENGTH caracteres
    const baseUrl = 'https://ads.facebook.com/page?param=';
    const padding = 'a'.repeat(URL_MAX_LENGTH - baseUrl.length);
    const result = validateFacebookAdUrl(baseUrl + padding);
    expect(result.valid).toBe(true);
  });

  it('deve rejeitar URL 1 caractere acima do limite', () => {
    const baseUrl = 'https://ads.facebook.com/page?param=';
    const padding = 'a'.repeat(URL_MAX_LENGTH - baseUrl.length + 1);
    const result = validateFacebookAdUrl(baseUrl + padding);
    expect(result.valid).toBe(false);
  });

  // ✅ URLs com subdomínios
  it('deve aceitar URL com subdomínio m.facebook.com', () => {
    const result = validateFacebookAdUrl('https://m.facebook.com/ads/123');
    expect(result.valid).toBe(true);
  });

  it('deve aceitar URL com subdomínio l.facebook.com', () => {
    const result = validateFacebookAdUrl('https://l.facebook.com/r.php?u=...');
    expect(result.valid).toBe(true);
  });
});

describe('validateInputString', () => {
  it('deve aceitar string válida', () => {
    const result = validateInputString('Meu anúncio', 'Titulo');
    expect(result.valid).toBe(true);
  });

  it('deve rejeitar valor não-string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateInputString(123 as any, 'Numero');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('texto');
  });

  it('deve rejeitar string vazia', () => {
    const result = validateInputString('', 'Descricao');
    expect(result.valid).toBe(false);
  });

  it('deve rejeitar string acima do limite customizado', () => {
    const result = validateInputString(
      'a'.repeat(101),
      'Titulo',
      100
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100');
  });

  it('deve rejeitar string abaixo do mínimo', () => {
    const result = validateInputString('x', 'Senha', 100, 8);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('obrigatório');
  });
});

describe('sanitizeInput', () => {
  it('deve escapar tags HTML', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('deve escapar aspas duplas', () => {
    const result = sanitizeInput('He said "hello"');
    expect(result).toContain('&quot;');
  });

  it('deve escapar aspas simples', () => {
    const result = sanitizeInput("It's dangerous");
    expect(result).toContain('&#x27;');
  });

  it('deve escapar caracteres perigosos', () => {
    const dangerous = '<img src="x" onerror="alert(1)">';
    const result = sanitizeInput(dangerous);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
});
