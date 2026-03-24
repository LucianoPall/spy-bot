/**
 * Rate Limiter - Sistema de proteção contra abuso de APIs
 *
 * Implementação: Rate limiting por usuário usando Supabase
 * Janela deslizante de 1 minuto
 *
 * Limites:
 * - /api/spy-engine: 10 requests/minuto por usuário
 * - Demais rotas: 60 requests/minuto por usuário
 */

import { createClient } from '@/utils/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // segundos
}

/**
 * Verifica se um usuário excedeu o rate limit para uma rota específica
 *
 * @param userId - ID do usuário (UUID)
 * @param route - Nome da rota (ex: '/api/spy-engine')
 * @param limit - Número máximo de requests permitidos
 * @param windowMinutes - Tamanho da janela em minutos (padrão: 1)
 * @returns RateLimitResult com status e informações
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
      console.error('[RATE-LIMIT] Erro ao buscar contador:', fetchError);
      // Em caso de erro, permitir requisição (fail-open)
      return {
        allowed: true,
        remaining: limit,
        resetAt
      };
    }

    const currentCount = existingEntry?.count || 0;
    const isAllowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);

    if (!isAllowed) {
      // Usuário excedeu limite
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now.getTime()) / 1000)
      };
    }

    // 2. Incrementar contador (insert ou update)
    if (existingEntry) {
      // Update count
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ count: currentCount + 1 })
        .eq('user_id', userId)
        .eq('route', route)
        .gte('window_start', windowStart.toISOString());

      if (updateError) {
        console.error('[RATE-LIMIT] Erro ao incrementar contador:', updateError);
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          route,
          window_start: windowStart.toISOString(),
          count: 1
        });

      if (insertError) {
        console.error('[RATE-LIMIT] Erro ao inserir contador:', insertError);
      }
    }

    return {
      allowed: true,
      remaining,
      resetAt
    };
  } catch (error) {
    console.error('[RATE-LIMIT] Erro inesperado:', error);
    // Em caso de erro, permitir requisição (fail-open para UX)
    return {
      allowed: true,
      remaining: 10,
      resetAt: new Date()
    };
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
