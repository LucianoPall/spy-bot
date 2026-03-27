/**
 * HTTP Client with Retry Logic
 *
 * Centraliza toda a lógica de requisições HTTP com retry automático
 * Trata erros transitórios de forma consistente em todo o projeto
 *
 * TIMEOUTS:
 * - APIs normais (OpenAI, Apify): 30 segundos
 * - DALL-E (geração de imagens): 60 segundos (pode levar 45-60s para gerar 3 imagens)
 */

/**
 * Realiza requisições com retry automático e exponential backoff
 * Trata erros transitórios: timeout (ETIMEDOUT), 429 (rate limit), 503 (serviço indisponível), 500 (erro interno)
 *
 * @param url - URL para fazer a requisição
 * @param options - Opções do fetch (method, headers, body, etc)
 * @param maxRetries - Número máximo de tentativas (padrão: 3)
 * @param timeoutMs - Timeout em milissegundos (padrão: 30s para API normal, 60s para DALL-E)
 * @returns Response se sucesso, lança erro se falhar em todas as tentativas
 *
 * Exemplo de backoff:
 * - Tentativa 1: falha → aguarda 1s
 * - Tentativa 2: falha → aguarda 2s
 * - Tentativa 3: falha → aguarda 4s
 * - Tentativa 4: falha → lança erro
 *
 * Nota: DALL-E pode levar até 60 segundos para gerar 3 imagens
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    timeoutMs?: number
): Promise<Response> {
    // Detectar DALL-E URLs e usar timeout maior automaticamente
    const isDalleUrl = url?.includes('oaidalleapiprodscus.blob.core.windows.net') ||
                      url?.includes('openai.com') && url.includes('image');
    const finalTimeoutMs = timeoutMs || (isDalleUrl ? 60000 : 30000);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`[HTTP-Retry] Tentativa ${attempt + 1}/${maxRetries} - URL: ${url.split('?')[0]} (timeout: ${finalTimeoutMs}ms)`);

            // Fazer a requisição com timeout configurável
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), finalTimeoutMs);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Se status é 200-299, sucesso!
            if (response.ok) {
                console.log(`[HTTP-Retry] ✅ Sucesso na tentativa ${attempt + 1}`);
                return response;
            }

            // Verificar se é erro transitório (429, 503, 500, 502, 504)
            const retryableStatuses = [429, 500, 502, 503, 504];
            if (retryableStatuses.includes(response.status)) {
                const errorText = await response.text();
                console.warn(
                    `[HTTP-Retry] ⚠️ Erro transitório (${response.status}) na tentativa ${attempt + 1}: ${errorText.substring(0, 100)}`
                );

                // Se não é a última tentativa, aguardar e retentar
                if (attempt < maxRetries - 1) {
                    const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.log(`[HTTP-Retry] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                } else {
                    // Última tentativa e falhou
                    lastError = new Error(
                        `API retornou status ${response.status} após ${maxRetries} tentativas: ${errorText.substring(0, 200)}`
                    );
                }
            } else {
                // Erro não-transitório (4xx exceto 429, 401, etc) - não retentar
                const errorText = await response.text();
                throw new Error(
                    `API Error: ${response.status} - ${errorText.substring(0, 200)}`
                );
            }
        } catch (error: unknown) {
            lastError = error as Error;

            // Verificar se é timeout ou erro de conexão (ETIMEDOUT, ECONNRESET, etc)
            const errorObj = error as { name?: string; code?: string };
            const isTimeoutError = errorObj.name === 'AbortError' || errorObj.code === 'ETIMEDOUT';
            const isConnectionError = errorObj.code === 'ECONNREFUSED' || errorObj.code === 'ECONNRESET';

            if ((isTimeoutError || isConnectionError) && attempt < maxRetries - 1) {
                console.warn(
                    `[HTTP-Retry] ⚠️ Erro transitório (${errorObj.name || errorObj.code}) na tentativa ${attempt + 1}`
                );
                const delayMs = Math.pow(2, attempt) * 1000;
                console.log(`[HTTP-Retry] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else if (attempt === maxRetries - 1) {
                // Última tentativa falhou
                console.error(`[HTTP-Retry] ❌ Falha após ${maxRetries} tentativas:`, error);
            } else {
                // Erro que não devemos retentar (ex: erro de parsing JSON)
                throw error;
            }
        }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw lastError || new Error(`Falha após ${maxRetries} tentativas sem resposta do servidor`);
}
