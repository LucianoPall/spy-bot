/**
 * Tipos Genéricos Reutilizáveis
 * Consolida tipos comuns usados em todo o projeto
 */

// ============= ERROS E EXCEÇÕES =============

/**
 * Tipo universal para qualquer erro capturado
 * Mais seguro do que `any`
 */
export type UnknownError = Error | { message?: string; code?: string; statusCode?: number };

/**
 * Tipo para erros HTTP/API
 */
export interface APIError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Tipo seguro para tratamento de errors em catch blocks
 */
export function ensureError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error(String(error));
}

// ============= DADOS GENÉRICOS =============

/**
 * Tipo genérico para qualquer JSON data
 * Melhor do que `Record<string, any>`
 */
export type JSONData = Record<string, unknown>;

/**
 * Tipo para objetos dinâmicos com chaves string
 */
export type DynamicObject = Record<string, unknown>;

// ============= RESPOSTAS HTTP =============

/**
 * Tipo genérico para resposta de API
 */
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  success?: boolean;
}

// ============= COMPONENTES REACT =============

/**
 * Props genéricos para componentes
 */
export type ComponentProps<T extends Record<string, unknown> = {}> = T & {
  className?: string;
  children?: React.ReactNode;
};

// ============= IMAGE/CLONE TYPES =============

/**
 * Tipo para logs de imagem
 */
export interface ImageLog {
  url?: string;
  status?: string;
  timestamp?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Tipo para estrutura de clone
 */
export interface CloneStructure {
  id?: string;
  adUrl?: string;
  copy?: string;
  image?: string;
  variations?: string[];
  [key: string]: unknown;
}

/**
 * Tipo para dados atualizáveis
 */
export type UpdateData = Record<string, unknown>;
