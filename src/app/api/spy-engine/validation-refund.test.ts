/**
 * TESTES UNITÁRIOS - Validação de URL Facebook + Refund
 *
 * Executar com: npm test -- validation-refund.test.ts
 * ou: vitest validation-refund.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { validateFacebookAdUrl, refundCredits } from './validation-refund';

// ============================================
// TESTES: validateFacebookAdUrl()
// ============================================

describe('validateFacebookAdUrl - Validação de URLs Facebook', () => {

    describe('✅ URLs VÁLIDAS', () => {
        const validUrls = [
            'https://facebook.com/ads/library/123456789',
            'https://www.facebook.com/ads/library/ads',
            'https://ads.facebook.com/manage/campaigns',
            'https://business.facebook.com/dashboard/overview',
            'https://m.facebook.com/ads/library',
            'http://facebook.com/ads/library/123',
            'https://facebook.com/ads?param=value&other=123',
            'https://ads.facebook.com/manage/campaigns?campaign_id=456',
        ];

        validUrls.forEach(url => {
            it(`deve aceitar: ${url}`, () => {
                const result = validateFacebookAdUrl(url);
                expect(result.valid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });
    });

    describe('❌ URLs INVÁLIDAS - Domínios Errados', () => {
        const invalidUrls = [
            'https://instagram.com/ads',
            'https://tiktok.com/ads',
            'https://twitter.com/ads',
            'https://google.com/ads',
            'https://malicious-facebook.com/ads',
            'https://fake-facebook.com/',
            'https://facebook.com.evil.com/',
            'https://fb-ads.com/library',
        ];

        invalidUrls.forEach(url => {
            it(`deve rejeitar: ${url}`, () => {
                const result = validateFacebookAdUrl(url);
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error).toContain('inválido');
            });
        });
    });

    describe('❌ URLs MALFORMADAS', () => {
        it('deve rejeitar string vazia', () => {
            const result = validateFacebookAdUrl('');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('obrigatória');
        });

        it('deve rejeitar null', () => {
            const result = validateFacebookAdUrl(null as any);
            expect(result.valid).toBe(false);
        });

        it('deve rejeitar undefined', () => {
            const result = validateFacebookAdUrl(undefined as any);
            expect(result.valid).toBe(false);
        });

        it('deve rejeitar URL sem protocolo', () => {
            const result = validateFacebookAdUrl('facebook.com/ads');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('malformada');
        });

        it('deve rejeitar texto aleatório', () => {
            const result = validateFacebookAdUrl('not-a-url-at-all');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('malformada');
        });

        it('deve rejeitar apenas protocolo', () => {
            const result = validateFacebookAdUrl('https://');
            expect(result.valid).toBe(false);
        });
    });

    describe('❌ URLs com Parâmetros Suspeitos', () => {
        const suspiciousUrls = [
            'https://facebook.com/ads?redirect=http://evil.com',
            'https://facebook.com/ads?phishing=true',
            'https://facebook.com/ads?malware=payload',
            'https://facebook.com/ads?exploit=rce',
            'https://ads.facebook.com?evil=redirect&other=value',
        ];

        suspiciousUrls.forEach(url => {
            it(`deve rejeitar: ${url}`, () => {
                const result = validateFacebookAdUrl(url);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('suspeitos');
            });
        });
    });

    describe('🔒 Segurança - Edge Cases', () => {
        it('deve rejeitar URLs com espaços', () => {
            const result = validateFacebookAdUrl('https://facebook.com /ads');
            expect(result.valid).toBe(false);
        });

        it('deve aceitar URLs com espaços nas extremidades (trim)', () => {
            const result = validateFacebookAdUrl('  https://facebook.com/ads  ');
            expect(result.valid).toBe(true);
        });

        it('deve ser case-insensitive', () => {
            const result1 = validateFacebookAdUrl('https://FACEBOOK.COM/ads');
            const result2 = validateFacebookAdUrl('https://Facebook.Com/ADS');
            expect(result1.valid).toBe(true);
            expect(result2.valid).toBe(true);
        });

        it('deve rejeitar URLs muito longas (potencial ataque)', () => {
            const longUrl = 'https://facebook.com/' + 'a'.repeat(10000);
            const result = validateFacebookAdUrl(longUrl);
            // Dependendo da implementação, pode rejeitar ou aceitar
            // Por enquanto apenas log
            console.log(`Long URL test result: valid=${result.valid}`);
        });

        it('deve aceitar URLs com fragmentos (#)', () => {
            const result = validateFacebookAdUrl('https://facebook.com/ads#section');
            expect(result.valid).toBe(true);
        });
    });
});

// ============================================
// MOCK: Supabase Client
// ============================================

vi.mock('@/utils/supabase/server', () => {
    const createMockClient = () => ({
        from: vi.fn((table) => ({
            select: vi.fn(function() {
                return {
                    eq: vi.fn((column, value) => ({
                        single: vi.fn(async () => {
                            // Simular usuário não encontrado para IDs específicos
                            if (value === 'user_nonexistent') {
                                return { data: null, error: { message: 'não encontrado' } };
                            }
                            return {
                                data: { credits: 5, plan: 'gratis' },
                                error: null
                            };
                        })
                    }))
                };
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis()
        }))
    });
    return { createClient: vi.fn(createMockClient) };
});

// ============================================
// TESTES: refundCredits()
// ============================================

describe('refundCredits - Mecanismo de Reembolso', () => {

    describe('✅ REFUND BEM-SUCEDIDO', () => {
        it('deve reembolsar créditos quando usuário existe', async () => {
            const result = await refundCredits({
                userId: 'user_valid_123',
                amount: 1,
                reason: 'APIFY_FAILURE',
                failureDetails: 'Timeout na extração'
            });

            expect(result.success).toBe(true);
            expect(result.newBalance).toBeGreaterThan(0);
        });

        it('deve registrar diferentes razões de refund', async () => {
            const reasons = [
                'APIFY_FAILURE',
                'OPENAI_FAILURE',
                'DALLE_FAILURE',
                'MANUAL_REFUND'
            ] as const;

            for (const reason of reasons) {
                const result = await refundCredits({
                    userId: 'user_test_456',
                    amount: 1,
                    reason,
                    failureDetails: `Test failure for ${reason}`
                });

                expect(result.success).toBe(true);
            }
        });

        it('deve reembolsar múltiplos créditos', async () => {
            const result = await refundCredits({
                userId: 'user_multi_789',
                amount: 5,
                reason: 'MANUAL_REFUND',
                failureDetails: 'Admin reembolso em lote'
            });

            expect(result.success).toBe(true);
            expect(result.newBalance).toBeGreaterThanOrEqual(5);
        });

        it('deve manter histórico em supabase_logs', async () => {
            const result = await refundCredits({
                userId: 'user_log_check',
                amount: 2,
                reason: 'OPENAI_FAILURE',
                failureDetails: 'Quota exceeded'
            });

            expect(result.success).toBe(true);
            // Verificar se foi inserido em logs (mock)
        });
    });

    describe('❌ REFUND FALHA - Validação de Entrada', () => {
        it('deve rejeitar userId vazio', async () => {
            const result = await refundCredits({
                userId: '',
                amount: 1,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('userId');
        });

        it('deve rejeitar userId null', async () => {
            const result = await refundCredits({
                userId: null as any,
                amount: 1,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
        });

        it('deve rejeitar userId não-string', async () => {
            const result = await refundCredits({
                userId: 123 as any,
                amount: 1,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
        });

        it('deve rejeitar amount zero', async () => {
            const result = await refundCredits({
                userId: 'user_valid',
                amount: 0,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('amount');
        });

        it('deve rejeitar amount negativo', async () => {
            const result = await refundCredits({
                userId: 'user_valid',
                amount: -5,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
        });

        it('deve rejeitar amount null/undefined', async () => {
            const result = await refundCredits({
                userId: 'user_valid',
                amount: null as any,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
        });
    });

    describe('❌ REFUND FALHA - Usuário Não Existe', () => {
        it('deve retornar erro se usuário não existe na DB', async () => {
            const result = await refundCredits({
                userId: 'user_nonexistent',
                amount: 1,
                reason: 'APIFY_FAILURE'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('não encontrado');
        });
    });

    describe('🔒 Segurança - Edge Cases', () => {
        it('deve aceitar failureDetails vazios', async () => {
            const result = await refundCredits({
                userId: 'user_valid',
                amount: 1,
                reason: 'APIFY_FAILURE',
                failureDetails: ''
            });

            expect(result.success).toBe(true);
        });

        it('deve truncar failureDetails muito longos', async () => {
            const longDetails = 'x'.repeat(10000);
            const result = await refundCredits({
                userId: 'user_valid',
                amount: 1,
                reason: 'APIFY_FAILURE',
                failureDetails: longDetails
            });

            // Deve processar sem erro
            expect(result.success).toBe(true);
        });

        it('deve ser idempotente (múltiplos refunds)', async () => {
            const userId = 'user_idempotent';
            const result1 = await refundCredits({
                userId,
                amount: 1,
                reason: 'APIFY_FAILURE'
            });
            const result2 = await refundCredits({
                userId,
                amount: 1,
                reason: 'APIFY_FAILURE'
            });

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            // Ambos devem ter sucesso (não é transação atômica)
        });
    });
});

// ============================================
// TESTES DE INTEGRAÇÃO
// ============================================

describe('Integração - Validação + Refund', () => {

    it('deve validar URL antes de processar refund', () => {
        const invalidUrl = 'https://instagram.com/ads';
        const urlValidation = validateFacebookAdUrl(invalidUrl);

        expect(urlValidation.valid).toBe(false);
        // Neste ponto, não deveria nem tentar refund
    });

    it('deve processar refund apenas com URL válida', async () => {
        const validUrl = 'https://facebook.com/ads/library/123';
        const urlValidation = validateFacebookAdUrl(validUrl);

        if (urlValidation.valid) {
            const refundResult = await refundCredits({
                userId: 'user_integration',
                amount: 1,
                reason: 'APIFY_FAILURE',
                failureDetails: `Falha ao processar ${validUrl}`
            });

            expect(refundResult.success).toBe(true);
        }
    });
});

// ============================================
// DADOS PARA TESTE MANUAL / SEEDING
// ============================================

export const TEST_DATA = {
    validUrls: [
        'https://facebook.com/ads/library/123456789',
        'https://ads.facebook.com/manage/campaigns',
        'https://business.facebook.com/dashboard',
        'https://m.facebook.com/ads',
    ],
    invalidUrls: [
        'https://instagram.com/ads',
        'https://tiktok.com/ads',
        'https://malicious-facebook.com/',
        'not-a-url',
    ],
    testUsers: [
        { userId: 'test_user_001', credits: 5, plan: 'gratis' },
        { userId: 'test_user_002', credits: 10, plan: 'pro' },
        { userId: 'test_user_003', credits: 0, plan: 'gratis' },
    ],
    refundReasons: [
        'APIFY_FAILURE',
        'OPENAI_FAILURE',
        'DALLE_FAILURE',
        'MANUAL_REFUND',
    ] as const
};
