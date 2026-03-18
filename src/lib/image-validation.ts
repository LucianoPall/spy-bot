// src/lib/image-validation.ts
// Sistema de validação de imagens para garantir integridade de dados

export interface Clone {
  id: string;
  created_at: string;
  image1?: string;
  image2?: string;
  image3?: string;
  [key: string]: any;
}

/**
 * Valida se um clone tem a estrutura esperada
 */
export function validateCloneStructure(clone: any): boolean {
  if (!clone || typeof clone !== 'object') return false;

  return !!(
    clone.id &&
    typeof clone.id === 'string' &&
    clone.created_at &&
    (clone.image1 || clone.image2 || clone.image3)
  );
}

/**
 * Valida se uma URL de imagem é segura e válida
 */
export function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);

    // Validar protocol
    if (!['http:', 'https:', 'data:', 'blob:'].includes(urlObj.protocol)) {
      return false;
    }

    // Validar hostname para URLs não-data/blob
    if (urlObj.protocol !== 'data:' && urlObj.protocol !== 'blob:') {
      if (!urlObj.hostname) return false;

      // Validar domínios conhecidos (whitelist)
      const allowedDomains = [
        'supabase.co',
        'unsplash.com',
        'blob.core.windows.net', // DALL-E
        'fbcdn.net', // Facebook
        'images.unsplash.com',
        'localhost'
      ];

      const isAllowed = allowedDomains.some(domain =>
        urlObj.hostname.includes(domain)
      );

      if (!isAllowed) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se um blob é realmente uma imagem válida
 */
export async function isValidImageBlob(blob: Blob): Promise<boolean> {
  // Validar MIME type
  const validTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ];

  if (!validTypes.includes(blob.type)) {
    return false;
  }

  // Validar tamanho (mínimo 100 bytes, máximo 50MB)
  const MIN_SIZE = 100;
  const MAX_SIZE = 52428800; // 50MB

  if (blob.size < MIN_SIZE || blob.size > MAX_SIZE) {
    return false;
  }

  // Validar que é realmente uma imagem testando carregar
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    const timeout = setTimeout(() => {
      img.src = ''; // Limpar
      URL.revokeObjectURL(url);
      resolve(false);
    }, 5000); // 5 segundo timeout

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Valida se um valor em cache é válido
 */
export function isCacheValid(cachedValue: string | null): boolean {
  if (!cachedValue) return false;

  try {
    // Se for blob URL, verificar formato
    if (cachedValue.startsWith('blob:')) {
      // Validar que segue formato blob:https://...
      const blobRegex = /^blob:[a-z][a-z0-9+\-.]*:\/\//;
      return blobRegex.test(cachedValue);
    }

    // Se for data URL, validar formato básico
    if (cachedValue.startsWith('data:')) {
      return cachedValue.includes(',');
    }

    // Se for URL HTTP(S), validar com isValidImageUrl
    if (cachedValue.startsWith('http:') || cachedValue.startsWith('https:')) {
      return isValidImageUrl(cachedValue);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Coleta erros de validação de uma lista de clones
 */
export function getImageValidationErrors(clones: Clone[]): string[] {
  const errors: string[] = [];

  clones.forEach((clone, index) => {
    // Validar estrutura
    if (!validateCloneStructure(clone)) {
      errors.push(`Clone ${index}: Estrutura inválida`);
      return;
    }

    // Validar cada imagem
    [1, 2, 3].forEach((num) => {
      const imageKey = `image${num}` as keyof Clone;
      const imageUrl = clone[imageKey];

      if (imageUrl && !isValidImageUrl(imageUrl as string)) {
        errors.push(`Clone ${clone.id}, image${num}: URL inválida`);
      }
    });
  });

  return errors;
}

/**
 * Sistema de validação resumido para uso em componentes
 */
export const ImageValidator = {
  isValidUrl: isValidImageUrl,
  isValidBlob: isValidImageBlob,
  isCacheValid,
  validateClone: validateCloneStructure,
  getErrors: getImageValidationErrors
};
