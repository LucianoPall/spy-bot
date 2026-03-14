// logger.ts - Sistema estruturado de logging para diagnóstico e monitoramento
// Utilizando ISO timestamps e estrutura de stages para fácil rastreamento

export interface LogEntry {
  timestamp: string;
  stage: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  data?: unknown;
  duration?: number; // em ms
}

class Logger {
  private logs: LogEntry[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Log de informação - Passo do processo
   */
  info(stage: string, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      stage,
      level: 'INFO',
      message,
      data
    };
    this.logs.push(entry);
    console.log(
      `[${entry.timestamp}] [${stage}] ℹ️  ${message}`,
      data ? JSON.stringify(data) : ''
    );
  }

  /**
   * Log de sucesso - Operação completada
   */
  success(stage: string, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      stage,
      level: 'SUCCESS',
      message,
      data
    };
    this.logs.push(entry);
    console.log(
      `[${entry.timestamp}] [${stage}] ✅ ${message}`,
      data ? JSON.stringify(data) : ''
    );
  }

  /**
   * Log de aviso - Situação anômala mas recuperável
   */
  warn(stage: string, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      stage,
      level: 'WARN',
      message,
      data
    };
    this.logs.push(entry);
    console.warn(
      `[${entry.timestamp}] [${stage}] ⚠️  ${message}`,
      data ? JSON.stringify(data) : ''
    );
  }

  /**
   * Log de erro - Falha crítica
   */
  error(stage: string, message: string, error?: unknown): void {
    const errorObject = error instanceof Error ? error : new Error(String(error));
    const errorData = {
      message: errorObject.message || String(error),
      stack: errorObject.stack,
      code: (error as any)?.code,
      status: (error as any)?.status
    };

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      stage,
      level: 'ERROR',
      message,
      data: errorData
    };
    this.logs.push(entry);
    console.error(
      `[${entry.timestamp}] [${stage}] ❌ ${message}`,
      errorData
    );
  }

  /**
   * Inicia cronômetro para medir duração de operações
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
    this.info('TIMER', `Timer iniciado: ${label}`);
  }

  /**
   * Finaliza cronômetro e registra duração
   */
  endTimer(label: string, stage?: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn('TIMER', `Timer "${label}" não encontrado`);
      return 0;
    }

    const duration = Date.now() - startTime;
    const stageLabel = stage || label;
    this.success(stageLabel, `Duração: ${duration}ms`, { duration_ms: duration });
    this.timers.delete(label);
    return duration;
  }

  /**
   * Obter todos os logs em formato estruturado
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Obter resumo da requisição (para Debug)
   */
  getSummary() {
    const totalTime = this.logs.length > 0
      ? new Date(this.logs[this.logs.length - 1].timestamp).getTime() -
        new Date(this.logs[0].timestamp).getTime()
      : 0;

    const errorCount = this.logs.filter(l => l.level === 'ERROR').length;
    const warnCount = this.logs.filter(l => l.level === 'WARN').length;
    const successCount = this.logs.filter(l => l.level === 'SUCCESS').length;

    return {
      totalLogs: this.logs.length,
      totalTime: `${totalTime}ms`,
      errors: errorCount,
      warnings: warnCount,
      successes: successCount,
      status: errorCount > 0 ? 'FAILED' : 'SUCCESS'
    };
  }

  /**
   * Exportar logs como JSON (útil para enviar ao servidor de logs)
   */
  exportAsJSON() {
    return {
      summary: this.getSummary(),
      logs: this.logs
    };
  }

  /**
   * Limpar logs (para próxima requisição)
   */
  clear(): void {
    this.logs = [];
    this.timers.clear();
  }
}

// Singleton exportado
export const logger = new Logger();

// ============================================================================
// INSTRUÇÕES DE USO NO route.ts:
// ============================================================================
//
// 1. Importar no topo:
//    import { logger } from './logger';
//
// 2. Usar em cada etapa:
//    - logger.info('STAGE_NAME', 'Mensagem descritiva', { dados: 'adicionais' })
//    - logger.success('STAGE_NAME', 'Operação completada', { resultado: 'dados' })
//    - logger.warn('STAGE_NAME', 'Situação anômala', { info: 'extra' })
//    - logger.error('STAGE_NAME', 'Erro específico', error_object)
//
// 3. Para medir duração:
//    logger.startTimer('OPERATION_NAME');
//    // ... código ...
//    logger.endTimer('OPERATION_NAME', 'STAGE_NAME');
//
// 4. Para exportar logs completos (adicionar ao response):
//    logs: logger.exportAsJSON()
//
// ============================================================================
// STAGES PREDEFINIDOS (para consistência):
// ============================================================================
export const STAGES = {
  START: 'START',
  VALIDATION: 'VALIDATION',
  BILLING: 'BILLING',
  APIFY_CALL: 'APIFY_CALL',
  APIFY_SUCCESS: 'APIFY_SUCCESS',
  APIFY_FAIL: 'APIFY_FAIL',
  FALLBACK: 'FALLBACK',
  OPENAI_CALL: 'OPENAI_CALL',
  OPENAI_SUCCESS: 'OPENAI_SUCCESS',
  OPENAI_FAIL: 'OPENAI_FAIL',
  DALLE_CALL: 'DALLE_CALL',
  DALLE_SUCCESS: 'DALLE_SUCCESS',
  DALLE_FAIL: 'DALLE_FAIL',
  SUPABASE_INSERT: 'SUPABASE_INSERT',
  SUPABASE_SUCCESS: 'SUPABASE_SUCCESS',
  SUPABASE_FAIL: 'SUPABASE_FAIL',
  STORAGE_UPLOAD: 'STORAGE_UPLOAD',
  STORAGE_SUCCESS: 'STORAGE_SUCCESS',
  STORAGE_FAIL: 'STORAGE_FAIL',
  BILLING_DEDUCT: 'BILLING_DEDUCT',
  BILLING_REFUND: 'BILLING_REFUND',
  END: 'END',
  ERROR_CRITICAL: 'ERROR_CRITICAL'
} as const;

// ============================================================================
// COMO LER LOGS NO NAVEGADOR (DevTools):
// ============================================================================
//
// 1. Abrir DevTools (F12)
// 2. Ir para aba "Network"
// 3. Fazer uma requisição
// 4. Clicar na requisição POST para /api/spy-engine
// 5. Ir para aba "Response" → ver logs no final do JSON
//
// Exemplo de log no DevTools:
//   "logs": {
//     "summary": {
//       "totalLogs": 25,
//       "totalTime": "3450ms",
//       "errors": 0,
//       "warnings": 1,
//       "successes": 6,
//       "status": "SUCCESS"
//     },
//     "logs": [
//       {
//         "timestamp": "2026-03-08T14:32:45.123Z",
//         "stage": "START",
//         "level": "INFO",
//         "message": "URL recebida",
//         "data": { "url": "https://..." }
//       },
//       ...
//     ]
//   }
//
// ============================================================================
