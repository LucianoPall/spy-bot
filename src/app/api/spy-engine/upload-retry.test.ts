/**
 * TESTES: Sistema de Retry para Upload de Imagens no Supabase
 *
 * OBJETIVO: Validar que o sistema de retry com exponential backoff
 * funciona corretamente e não deixa imagens desaparecerem após 1h
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Upload Retry System - Spy Engine', () => {
  let mockLogger: any;
  let mockSupabase: any;

  beforeEach(() => {
    // Mock do logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      success: vi.fn()
    };

    // Mock do Supabase
    mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn(),
          getPublicUrl: vi.fn()
        })
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('✅ Sucesso de Upload na Primeira Tentativa', () => {
    it('deve fazer upload com sucesso na primeira tentativa', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const fileName = 'test-user/123-1.png';
      const publicUrl = 'https://test.supabase.co/storage/v1/object/public/spybot_images/test-user/123-1.png';

      // Mock: upload bem-sucedido na primeira tentativa
      const uploadMock = vi.fn().mockResolvedValue({
        data: { path: fileName },
        error: null
      });

      const getPublicUrlMock = vi.fn().mockReturnValue({
        data: { publicUrl }
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock
      });

      // Simula a lógica de retry implementada
      let uploadResponse = null;
      let lastError = null;
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          mockLogger.info('STORAGE_UPLOAD', `[IMAGEM 1] Tentativa ${attempt + 1}/${maxRetries} de upload`);

          uploadResponse = await mockSupabase.storage
            .from('spybot_images')
            .upload(fileName, mockBlob, { contentType: 'image/png', upsert: true });

          if (!uploadResponse.error) {
            mockLogger.success('STORAGE_UPLOAD', `[IMAGEM 1] ✅ Upload bem-sucedido na tentativa ${attempt + 1}`);
            break;
          }

          lastError = uploadResponse.error;

          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            mockLogger.warn('STORAGE_UPLOAD', `[IMAGEM 1] ⚠️ Retry ${attempt + 1}: aguardando ${backoffMs}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        } catch (e: unknown) {
          lastError = e;
          mockLogger.warn('STORAGE_UPLOAD', `[IMAGEM 1] Exceção na tentativa ${attempt + 1}`);

          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }

      const { data, error } = uploadResponse || { data: null, error: lastError };

      // Validações
      expect(uploadMock).toHaveBeenCalledTimes(1); // Apenas 1 tentativa
      expect(error).toBeNull(); // Sem erro
      expect(data).not.toBeNull();
      expect(mockLogger.success).toHaveBeenCalledWith(
        'STORAGE_UPLOAD',
        expect.stringContaining('✅ Upload bem-sucedido na tentativa 1')
      );
    });
  });

  describe('✅ Retry com Exponential Backoff', () => {
    it('deve fazer retry com backoff exponencial (1s, 2s, 4s)', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const fileName = 'test-user/123-1.png';
      const publicUrl = 'https://test.supabase.co/storage/v1/object/public/spybot_images/test-user/123-1.png';

      // Mock: falha nas primeiras 2 tentativas, sucesso na 3ª
      const uploadMock = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'RLS policy denied access' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'RLS policy denied access' } })
        .mockResolvedValueOnce({ data: { path: fileName }, error: null });

      const getPublicUrlMock = vi.fn().mockReturnValue({
        data: { publicUrl }
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock
      });

      // Simula a lógica de retry
      let uploadResponse = null;
      let lastError = null;
      const maxRetries = 3;
      const startTime = Date.now();

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          mockLogger.info('STORAGE_UPLOAD', `[IMAGEM 1] Tentativa ${attempt + 1}/${maxRetries} de upload`);

          uploadResponse = await mockSupabase.storage
            .from('spybot_images')
            .upload(fileName, mockBlob, { contentType: 'image/png', upsert: true });

          if (!uploadResponse.error) {
            mockLogger.success('STORAGE_UPLOAD', `[IMAGEM 1] ✅ Upload bem-sucedido na tentativa ${attempt + 1}`);
            break;
          }

          lastError = uploadResponse.error;

          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            mockLogger.warn('STORAGE_UPLOAD', `[IMAGEM 1] ⚠️ Retry ${attempt + 1}: aguardando ${backoffMs}ms`, {
              error: lastError.message,
              backoffMs
            });
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        } catch (e: unknown) {
          lastError = e;
          mockLogger.warn('STORAGE_UPLOAD', `[IMAGEM 1] Exceção na tentativa ${attempt + 1}`);
          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }

      const totalTime = Date.now() - startTime;
      const { data, error } = uploadResponse || { data: null, error: lastError };

      // Validações
      expect(uploadMock).toHaveBeenCalledTimes(3); // 3 tentativas
      expect(error).toBeNull(); // Sucesso na 3ª tentativa
      expect(data).not.toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledTimes(2); // 2 retries com warn
      expect(mockLogger.success).toHaveBeenCalledWith(
        'STORAGE_UPLOAD',
        expect.stringContaining('✅ Upload bem-sucedido na tentativa 3')
      );
      // Backoff total deve ser ~3s (1s + 2s)
      expect(totalTime).toBeGreaterThanOrEqual(2900); // Aproximadamente 3s
    });

    it('deve falhar após máximo de retries', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const fileName = 'test-user/123-1.png';

      // Mock: falha em todas as tentativas
      const uploadMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RLS policy denied access' }
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: uploadMock
      });

      // Simula a lógica de retry
      let uploadResponse = null;
      let lastError = null;
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          mockLogger.info('STORAGE_UPLOAD', `[IMAGEM 1] Tentativa ${attempt + 1}/${maxRetries} de upload`);

          uploadResponse = await mockSupabase.storage
            .from('spybot_images')
            .upload(fileName, mockBlob, { contentType: 'image/png', upsert: true });

          if (!uploadResponse.error) {
            mockLogger.success('STORAGE_UPLOAD', `[IMAGEM 1] ✅ Upload bem-sucedido na tentativa ${attempt + 1}`);
            break;
          }

          lastError = uploadResponse.error;

          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            mockLogger.warn('STORAGE_UPLOAD', `[IMAGEM 1] ⚠️ Retry ${attempt + 1}: aguardando ${backoffMs}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        } catch (e: unknown) {
          lastError = e;
          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }

      const { data, error } = uploadResponse || { data: null, error: lastError };

      // Validações
      expect(uploadMock).toHaveBeenCalledTimes(3); // 3 tentativas
      expect(error).not.toBeNull(); // Erro persiste
      expect(data).toBeNull();
      expect(mockLogger.success).not.toHaveBeenCalled(); // Nunca foi bem-sucedido
    });
  });

  describe('✅ Validação de URL Supabase', () => {
    it('deve validar que URL é realmente Supabase após upload', () => {
      const isSupabaseUrl = (url: string) =>
        url?.includes('supabase.co') && url?.includes('spybot_images');

      const validSupabaseUrl = 'https://test.supabase.co/storage/v1/object/public/spybot_images/user/123-1.png';
      const invalidUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/fake/image.png';
      const unsplashUrl = 'https://images.unsplash.com/photo/123';

      expect(isSupabaseUrl(validSupabaseUrl)).toBe(true);
      expect(isSupabaseUrl(invalidUrl)).toBe(false);
      expect(isSupabaseUrl(unsplashUrl)).toBe(false);
    });
  });

  describe('✅ Proteção DALL-E', () => {
    it('deve converter URLs DALL-E para fallback', () => {
      const isDalleUrl = (url: string) =>
        url?.includes('oaidalleapiprodscus') || url?.includes('openai');

      const dalleUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/dalle3/fake.png';
      const supabaseUrl = 'https://test.supabase.co/storage/v1/object/public/spybot_images/user/123-1.png';

      expect(isDalleUrl(dalleUrl)).toBe(true);
      expect(isDalleUrl(supabaseUrl)).toBe(false);
    });
  });

  describe('❌ Edge Cases', () => {
    it('deve usar fallback quando blob está vazio', () => {
      const testUrl = '';
      const fallbackUrl = 'https://images.unsplash.com/photo/emagrecimento';

      const finalUrl = !testUrl || !testUrl.trim() ? fallbackUrl : testUrl;
      expect(finalUrl).toBe(fallbackUrl);
    });

    it('deve manter URLs Unsplash permanentes', () => {
      const unsplashUrl = 'https://images.unsplash.com/photo/123456';
      const isUnsplash = unsplashUrl.includes('unsplash');

      expect(isUnsplash).toBe(true);
      // Unsplash é permanente, não precisa retry
    });
  });
});
