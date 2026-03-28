/**
 * Rate Limiter - Sistema de proteção contra abuso de APIs
 *
 * Implementação: Rate limiting por usuário usando Supabase
 * Fallback: In-memory rate limiting quando DB falha
 * Janela deslizante de 1 minuto
 *
 * Limites:
 * - /api/spy-engine: 10 requests/minuto por usuário
 * - Demais rotas: 60 requests/minuto por usuário
 */

import { createClient } from '@/utils/supabase/server';
import { log } from '@/lib/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // segundos
}

/**
 * Fallback in-memory rate limiter para quando o DB falha.
 * Não persiste entre deploys/restarts, mas protege contra burst abuse.
 */
const memoryStore = new Map<string, { count: number; windowStart: number }>();

function checkMemoryRateLimit(
  userId: string,
  route: string,
  limit: number,
  windowMinutes: number
): RateLimitResult {
  const key = `${userId}:${route}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  const entry = memoryStore.get(key);

  // Limpar entradas expiradas periodicamente
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore) {
      if (now - v.windowStart > windowMs) memoryStore.delete(k);
    }
  }

  if (!entry || now - entry.windowStart > windowMs) {
    // Nova janela
    memoryStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  entry.count++;

  if (entry.count > limit) {
    const resetAt = new Date(entry.windowStart + windowMs);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    resetAt: new Date(entry.windowStart + windowMs),
  };
}

/**
 * Verifica se um usuário excedeu o rate limit para uma rota específica
 */
export async function checkRateLimit(
  userId: string,
  route: string,
  limit: number = 10,
  windowMinutes: number = 1
): Promise<RateLimitResult> {
  try {
    const supabase = await createClient();

    // Calcular timestamps
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    const resetAt = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);

    // 1. Buscar contador atual para esta janela
    const { data: existingEntry, error: fetchError } = await supabase
      .from('rate_limits')
      .select('count')
      .eq('user_id', userId)
      .eq('route', route)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (esperado na primeira requisição)
      log.error('RATE-LIMIT', 'Erro ao buscar contador, usando fallback in-memory', fetchError);
      return checkMemoryRateLimit(userId, route, limit, windowMinutes);
    }

    const currentCount = existingEntry?.count || 0;
    const isAllowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);

    if (!isAllowed) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now.getTime()) / 1000)
      };
    }

    // 2. Incrementar contador (insert ou update)
    if (existingEntry) {
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ count: currentCount + 1 })
        .eq('user_id', userId)
        .eq('route', route)
        .gte('window_start', windowStart.toISOString());

      if (updateError) {
        log.error('RATE-LIMIT', 'Erro ao incrementar contador', updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          route,
          window_start: windowStart.toISOString(),
          count: 1
        });

      if (insertError) {
        log.error('RATE-LIMIT', 'Erro ao inserir contador', insertError);
      }
    }

    return {
      allowed: true,
      remaining,
      resetAt
    };
  } catch (error) {
    log.error('RATE-LIMIT', 'Erro inesperado, usando fallback in-memory', error);
    // Fallback seguro: usa rate limiter in-memory em vez de fail-open
    return checkMemoryRateLimit(userId, route, limit, windowMinutes);
  }
}

/**
 * Middleware helper para verificar rate limit
 * Retorna NextResponse com status 429 se limite excedido
 */
export async function createRateLimitResponse(result: RateLimitResult) {
  if (!result.allowed && result.retryAfter) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        resetAt: result.resetAt.toISOString()
      }),
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  return null;
}

/**
 * Limites padrão por rota
 */
export const RATE_LIMITS = {
  '/api/spy-engine': 10,      // 10 requests/min
  '/api/save-clone': 60,      // 60 requests/min
  '/api/regenerate-images': 20, // 20 requests/min
  default: 60                 // 60 requests/min para outras rotas
} as const;

/**
 * Obter limite para uma rota específica
 */
export function getLimitForRoute(route: string): number {
  return (RATE_LIMITS as Record<string, number>)[route] || RATE_LIMITS.default;
}
