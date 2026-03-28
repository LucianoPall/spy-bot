/**
 * Logger condicional - só loga no server em modo development
 * Em produção, suprime console.log/warn (mantém errors)
 */

const isDev = process.env.NODE_ENV !== 'production';

export const log = {
  info(tag: string, message: string, data?: unknown): void {
    if (isDev) {
      console.log(`[${tag}] ${message}`, data !== undefined ? data : '');
    }
  },

  warn(tag: string, message: string, data?: unknown): void {
    if (isDev) {
      console.warn(`[${tag}] ${message}`, data !== undefined ? data : '');
    }
  },

  error(tag: string, message: string, data?: unknown): void {
    // Errors sempre logados, mesmo em produção
    console.error(`[${tag}] ${message}`, data !== undefined ? data : '');
  },
};
