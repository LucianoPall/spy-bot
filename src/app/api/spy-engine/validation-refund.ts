import { createClient } from '@/utils/supabase/server';
import { logger, STAGES } from './logger';

// ============================================
// VALIDAÇÃO DE URL FACEBOOK
// ============================================

/**
 * Valida se uma URL pertence ao domínio facebook.com
 * Aceita variações válidas:
 * - facebook.com/ads/*
 * - ads.facebook.com/*
 * - business.facebook.com/*
 * - m.facebook.com/*
 *
 * @param adUrl - URL a ser validada
 * @returns { valid: boolean, error?: string }
 *
 * Exemplos de uso:
 * validateFacebookAdUrl("https://facebook.com/ads/library/...")  // ✅ válido
 * validateFacebookAdUrl("https://ads.facebook.com/manage/...")  // ✅ válido
 * validateFacebookAdUrl("https://instagram.com/...")  // ❌ inválido
 * validateFacebookAdUrl("https://malicious-facebook.com/...")  // ❌ inválido (typosquatting)
 */
export function validateFacebookAdUrl(adUrl: string): { valid: boolean; error?: string } {
    if (!adUrl || typeof adUrl !== 'string') {
        return {
            valid: false,
            error: 'URL é obrigatória e deve ser uma string válida.'
        };
    }

    const trimmedUrl = adUrl.trim();

    // Tenta fazer parse da URL
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(trimmedUrl);
    } catch (e) {
        return {
            valid: false,
            error: `URL malformada: "${adUrl}". Certifique-se de incluir "https://" ou "http://".`
        };
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    // Whitelist de domínios Facebook aceitos
    const validFacebookDomains = [
        'facebook.com',
        'ads.facebook.com',
        'business.facebook.com',
        'm.facebook.com',
        'www.facebook.com'
    ];

    // Verifica se o hostname termina com um dos domínios válidos
    const isValidDomain = validFacebookDomains.some(domain => {
        return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!isValidDomain) {
        return {
            valid: false,
            error: `Domínio inválido: "${hostname}". A URL deve pertencer a facebook.com, ads.facebook.com, business.facebook.com ou m.facebook.com.`
        };
    }

    // Rejeita URLs com query parameters suspeitos (malware indicators)
    const suspiciousParams = ['redirect', 'phishing', 'evil', 'malware', 'exploit'];
    const params = new URLSearchParams(parsedUrl.search);

    for (const [key, value] of params) {
        if (suspiciousParams.some(sus => key.toLowerCase().includes(sus) || value.toLowerCase().includes(sus))) {
            return {
                valid: false,
                error: `URL contém parâmetros suspeitos. Certifique-se de que é uma URL legítima do Facebook Ads Library.`
            };
        }
    }

    // Se chegou aqui, é válida
    return { valid: true };
}

// ============================================
// MECANISMO DE REEMBOLSO DE CRÉDITOS
// ============================================

interface RefundOptions {
    userId: string;
    amount: number;
    reason: 'APIFY_FAILURE' | 'OPENAI_FAILURE' | 'DALLE_FAILURE' | 'MANUAL_REFUND';
    failureDetails?: string;
}

/**
 * Reembolsa créditos para um usuário quando há falha crítica em um serviço
 *
 * @param options - { userId, amount, reason, failureDetails }
 * @returns { success: boolean, newBalance?: number, error?: string }
 *
 * Comportamento:
 * 1. Verifica se o usuário existe em spybot_subscriptions
 * 2. Registra o reembolso em supabase_logs com detalhe da falha
 * 3. Aumenta os créditos do usuário
 * 4. Retorna o novo saldo
 *
 * Exemplos de uso:
 * await refundCredits({
 *     userId: "user_123",
 *     amount: 1,
 *     reason: 'APIFY_FAILURE',
 *     failureDetails: 'Apify falhou após 3 retries: timeout'
 * });
 *
 * await refundCredits({
 *     userId: "user_456",
 *     amount: 2,
 *     reason: 'DALLE_FAILURE',
 *     failureDetails: 'DALL-E indisponível (503)'
 * });
 */
export async function refundCredits(options: RefundOptions): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string
}> {
    const { userId, amount, reason, failureDetails } = options;

    try {
        logger.info(STAGES.BILLING_REFUND, 'Iniciando reembolso de créditos', { userId, amount, reason });

        if (!userId || typeof userId !== 'string') {
            logger.error(STAGES.BILLING_REFUND, 'userId inválido', { userId });
            return {
                success: false,
                error: 'userId é obrigatório e deve ser uma string válida.'
            };
        }

        if (!amount || amount <= 0) {
            logger.error(STAGES.BILLING_REFUND, 'amount inválido', { amount });
            return {
                success: false,
                error: 'amount deve ser um número positivo.'
            };
        }

        const supabase = await createClient();

        // 1. Buscar o usuário em spybot_subscriptions
        const { data: subscription, error: fetchError } = await supabase
            .from('spybot_subscriptions')
            .select('credits, plan')
            .eq('user_id', userId)
            .single();

        if (fetchError || !subscription) {
            logger.warn(STAGES.BILLING_REFUND, 'Usuário não encontrado em spybot_subscriptions', { userId, fetchError });
            return {
                success: false,
                error: `Usuário "${userId}" não encontrado no sistema de subscrições.`
            };
        }

        const currentBalance = subscription.credits || 0;
        const newBalance = currentBalance + amount;

        // 2. Registrar em supabase_logs ANTES de fazer o update (auditoria)
        const logEntry = {
            user_id: userId,
            event_type: 'CREDIT_REFUND',
            reason: reason,
            amount: amount,
            previous_balance: currentBalance,
            new_balance: newBalance,
            failure_details: failureDetails || null,
            timestamp: new Date().toISOString()
        };

        const { error: logError } = await supabase.from('supabase_logs').insert([logEntry]);

        if (logError) {
            logger.error(STAGES.BILLING_REFUND, 'Erro ao registrar refund em supabase_logs', logError);
            // Continua mesmo assim, mas registra o erro
        } else {
            logger.info(STAGES.BILLING_REFUND, 'Refund registrado em supabase_logs', logEntry);
        }

        // 3. Atualizar os créditos do usuário
        const { error: updateError } = await supabase
            .from('spybot_subscriptions')
            .update({ credits: newBalance })
            .eq('user_id', userId);

        if (updateError) {
            logger.error(STAGES.BILLING_REFUND, 'Erro ao atualizar créditos', { userId, updateError });
            return {
                success: false,
                error: `Falha ao atualizar créditos: ${updateError.message}`
            };
        }

        logger.success(STAGES.BILLING_REFUND, 'Reembolso concluído com sucesso', {
            userId,
            amount,
            previousBalance: currentBalance,
            newBalance: newBalance,
            reason
        });

        return {
            success: true,
            newBalance: newBalance
        };

    } catch (error: any) {
        logger.error(STAGES.BILLING_REFUND, 'Erro inesperado ao processar refund', error);
        return {
            success: false,
            error: `Erro ao processar reembolso: ${error.message || String(error)}`
        };
    }
}

// ============================================
// HELPER: Reembolsar após N falhas de Apify
// ============================================

/**
 * Helper para reembolsar automaticamente quando Apify falha após 3 retries
 *
 * Uso:
 * try {
 *     const response = await fetchWithRetry(url, options, 3);
 * } catch (apifyError) {
 *     await refundOnApifyFailure(userId, apifyError.message);
 * }
 */
export async function refundOnApifyFailure(userId: string, errorMessage: string): Promise<void> {
    if (!userId) return;

    const result = await refundCredits({
        userId,
        amount: 1,
        reason: 'APIFY_FAILURE',
        failureDetails: `Apify falhou após 3 retries: ${errorMessage.substring(0, 200)}`
    });

    if (result.success) {
        logger.info(STAGES.BILLING_REFUND, 'Refund automático Apify processado', {
            userId,
            newBalance: result.newBalance
        });
    }
}

// ============================================
// HELPER: Reembolsar após falha OpenAI
// ============================================

/**
 * Helper para reembolsar automaticamente quando OpenAI falha
 *
 * Uso:
 * try {
 *     const response = await activeOpenaiClient.chat.completions.create({...});
 * } catch (openaiError) {
 *     await refundOnOpenAIFailure(userId, openaiError.message);
 * }
 */
export async function refundOnOpenAIFailure(userId: string, errorMessage: string): Promise<void> {
    if (!userId) return;

    const result = await refundCredits({
        userId,
        amount: 1,
        reason: 'OPENAI_FAILURE',
        failureDetails: `OpenAI retornou erro: ${errorMessage.substring(0, 200)}`
    });

    if (result.success) {
        logger.info(STAGES.BILLING_REFUND, 'Refund automático OpenAI processado', {
            userId,
            newBalance: result.newBalance
        });
    }
}

// ============================================
// HELPER: Reembolsar após falha DALL-E
// ============================================

/**
 * Helper para reembolsar automaticamente quando DALL-E falha
 *
 * Uso:
 * try {
 *     const response = await activeOpenaiClient.images.generate({...});
 * } catch (dalleError) {
 *     await refundOnDALLEFailure(userId, dalleError.message);
 * }
 */
export async function refundOnDALLEFailure(userId: string, errorMessage: string): Promise<void> {
    if (!userId) return;

    const result = await refundCredits({
        userId,
        amount: 1,
        reason: 'DALLE_FAILURE',
        failureDetails: `DALL-E retornou erro: ${errorMessage.substring(0, 200)}`
    });

    if (result.success) {
        logger.info(STAGES.BILLING_REFUND, 'Refund automático DALL-E processado', {
            userId,
            newBalance: result.newBalance
        });
    }
}
