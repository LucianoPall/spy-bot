import {
  validateCloneStructure,
  isValidImageUrl,
  isCacheValid,
  getImageValidationErrors
} from '@/lib/image-validation';

describe('Image Validation', () => {
  describe('validateCloneStructure', () => {
    it('should return true for valid clone with image1', () => {
      const validClone = {
        id: '123',
        created_at: '2025-01-01',
        image1: 'https://example.com/image.png'
      };
      expect(validateCloneStructure(validClone)).toBe(true);
    });

    it('should return true for valid clone with image2', () => {
      const validClone = {
        id: '456',
        created_at: '2025-01-01',
        image2: 'https://example.com/image.png'
      };
      expect(validateCloneStructure(validClone)).toBe(true);
    });

    it('should return true for valid clone with image3', () => {
      const validClone = {
        id: '789',
        created_at: '2025-01-01',
        image3: 'https://example.com/image.png'
      };
      expect(validateCloneStructure(validClone)).toBe(true);
    });

    it('should return false for clone without id', () => {
      const invalidClone = {
        created_at: '2025-01-01',
        image1: 'https://example.com/image.png'
      };
      expect(validateCloneStructure(invalidClone)).toBe(false);
    });

    it('should return false for clone without created_at', () => {
      const invalidClone = {
        id: '123',
        image1: 'https://example.com/image.png'
      };
      expect(validateCloneStructure(invalidClone)).toBe(false);
    });

    it('should return false for clone without images', () => {
      const invalidClone = {
        id: '123',
        created_at: '2025-01-01'
      };
      expect(validateCloneStructure(invalidClone)).toBe(false);
    });

    it('should return false for null', () => {
      expect(validateCloneStructure(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateCloneStructure(undefined)).toBe(false);
    });
  });

  describe('isValidImageUrl', () => {
    it('should validate Supabase URLs', () => {
      const url = 'https://rrtsfhhutbneaxpuubra.supabase.co/storage/v1/object/public/spybot_images/image.png';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should validate Unsplash URLs', () => {
      const url = 'https://images.unsplash.com/photo-123';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should validate Unsplash domain URLs', () => {
      const url = 'https://unsplash.com/photos/xyz';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should validate DALL-E blob URLs', () => {
      const url = 'https://oaidalleapiprodscus.blob.core.windows.net/d-img-prod/img-xyz';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should validate Facebook CDN URLs', () => {
      const url = 'https://fbcdn.net/v/t1.6435-9/image.png';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should validate data URLs', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should validate blob URLs', () => {
      const url = 'blob:https://localhost:3000/abc123-def456';
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should reject localhost without protocol', () => {
      expect(isValidImageUrl('localhost:3000/image.png')).toBe(false);
    });

    it('should reject file:// URLs', () => {
      const url = 'file:///etc/passwd';
      expect(isValidImageUrl(url)).toBe(false);
    });

    it('should reject invalid domains', () => {
      const url = 'https://malicious-site.com/image.png';
      expect(isValidImageUrl(url)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidImageUrl('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidImageUrl(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidImageUrl(undefined)).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(isValidImageUrl('not a url')).toBe(false);
    });
  });

  describe('isCacheValid', () => {
    it('should validate blob URLs', () => {
      const blobUrl = 'blob:https://localhost:3000/abc123';
      expect(isCacheValid(blobUrl)).toBe(true);
    });

    it('should validate data URLs', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      expect(isCacheValid(dataUrl)).toBe(true);
    });

    it('should validate HTTP URLs', () => {
      const httpUrl = 'https://images.unsplash.com/photo-xyz';
      expect(isCacheValid(httpUrl)).toBe(true);
    });

    it('should reject null', () => {
      expect(isCacheValid(null)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isCacheValid('')).toBe(false);
    });

    it('should reject malformed blob URLs', () => {
      expect(isCacheValid('blob:not-a-valid-url')).toBe(false);
    });

    it('should reject data URLs without comma', () => {
      expect(isCacheValid('data:image/png')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isCacheValid('invalid://url')).toBe(false);
    });
  });

  describe('getImageValidationErrors', () => {
    it('should return empty array for valid clones', () => {
      const clones = [
        {
          id: '1',
          created_at: '2025-01-01',
          image1: 'https://images.unsplash.com/photo-1'
        },
        {
          id: '2',
          created_at: '2025-01-02',
          image2: 'https://supabase.co/storage/image.png'
        }
      ];
      expect(getImageValidationErrors(clones)).toEqual([]);
    });

    it('should report invalid clone structure', () => {
      const clones = [
        {
          // Missing id
          created_at: '2025-01-01',
          image1: 'https://example.com/image.png'
        }
      ];
      const errors = getImageValidationErrors(clones);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Estrutura inválida');
    });

    it('should report invalid image URLs', () => {
      const clones = [
        {
          id: '1',
          created_at: '2025-01-01',
          image1: 'https://malicious-site.com/image.png'
        }
      ];
      const errors = getImageValidationErrors(clones);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('URL inválida');
    });

    it('should report multiple errors', () => {
      const clones = [
        {
          id: '1',
          created_at: '2025-01-01',
          image1: 'https://malicious-site.com/image.png',
          image2: 'invalid://url'
        }
      ];
      const errors = getImageValidationErrors(clones);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
