/**
 * Billing Service
 *
 * Encapsula toda a lógica de gerenciamento de créditos e planos
 * Responsabilidades:
 * - Carregar plano e créditos do usuário
 * - Validar se usuário pode usar o serviço
 * - Deduzir créditos após sucesso
 * - Criar subscription padrão
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { log } from '@/lib/logger';

export interface UserBilling {
  userId: string;
  plan: 'gratis' | 'pro' | 'premium';
  credits: number;
  isAdmin: boolean;
  canUseService: boolean;
  message?: string;
}

export interface BillingCheckResult {
  allowed: boolean;
  reason?: string;
  currentPlan: string;
  currentCredits: number;
}

/**
 * Carrega billing info do usuário
 *
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário (UUID)
 * @param userEmail - Email do usuário
 * @param isAdmin - Se é admin
 * @returns Info de billing
 */
export async function loadUserBilling(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  isAdmin: boolean
): Promise<UserBilling> {
  try {
    log.info('BILLING', 'Carregando info do usuário', { userId });

    // Carregar ou criar subscription
    const result = await supabase
      .from('spybot_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    let subscription = result.data;
    const error = result.error;

    // Se não existe, criar padrão
    if (error && error.code === 'PGRST116') {
      // Não encontrado - criar novo
      log.info('BILLING', 'Primeira requisição, criando subscription padrão');
      const { data: created } = await supabase
        .from('spybot_subscriptions')
        .insert({
          user_id: userId,
          credits: 5,
          plan: 'gratis',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      subscription = created;
    } else if (error) {
      log.error('BILLING', 'Erro ao carregar subscription', error);
      throw error;
    }

    const plan = subscription?.plan || 'gratis';
    const credits = subscription?.credits || 5;

    log.info('BILLING', 'Info carregada', { plan, credits, isAdmin });

    return {
      userId,
      plan: plan as 'gratis' | 'pro' | 'premium',
      credits,
      isAdmin,
      canUseService: isAdmin || credits > 0 || plan !== 'gratis'
    };
  } catch (error) {
    log.error('BILLING', 'Erro ao carregar info', error);
    throw error;
  }
}

/**
 * Valida se usuário pode usar o serviço
 */
export function validateBillingAccess(
  billing: UserBilling,
  hasBYOK: boolean
): BillingCheckResult {
  // Admin sempre pode
  if (billing.isAdmin) {
    return {
      allowed: true,
      currentPlan: billing.plan,
      currentCredits: billing.credits
    };
  }

  // Plano pago sempre pode
  if (billing.plan !== 'gratis') {
    return {
      allowed: true,
      currentPlan: billing.plan,
      currentCredits: billing.credits
    };
  }

  // Grátis: precisa de créditos OU ter BYOK
  if (billing.credits > 0 || hasBYOK) {
    return {
      allowed: true,
      currentPlan: billing.plan,
      currentCredits: billing.credits
    };
  }

  // Bloquear
  return {
    allowed: false,
    reason: 'Você atingiu o limite de requisições grátis. Atualize para Pro ou adicione sua chave OpenAI.',
    currentPlan: billing.plan,
    currentCredits: billing.credits
  };
}

/**
 * Deduz 1 crédito após sucesso (apenas plano grátis)
 */
export async function deductCredit(
  supabase: SupabaseClient,
  userId: string,
  plan: string,
  currentCredits: number
): Promise<boolean> {
  // Apenas deduz em plano grátis
  if (plan !== 'gratis') {
    return true;
  }

  try {
    const newCredits = Math.max(0, currentCredits - 1);

    const { error } = await supabase
      .from('spybot_subscriptions')
      .update({ credits: newCredits })
      .eq('user_id', userId);

    if (error) {
      log.warn('BILLING', 'Aviso ao deduzir crédito', error);
      // Continua mesmo se falhar - não bloqueia o usuário
      return true;
    }

    log.info('BILLING', 'Crédito deduzido', { newCredits });
    return true;
  } catch (error) {
    log.error('BILLING', 'Erro ao deduzir crédito', error);
    return true; // Fail-open: continua mesmo se erro
  }
}

/**
 * Formata info de billing para resposta
 */
export function formatBillingInfo(billing: UserBilling) {
  return {
    plan: billing.plan,
    credits: billing.credits,
    isAdmin: billing.isAdmin,
    canContinue: billing.canUseService
  };
}
