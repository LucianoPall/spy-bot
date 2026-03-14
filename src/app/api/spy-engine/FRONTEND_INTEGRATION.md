# Integração Frontend - Leitura de Logs

Este documento mostra como integrar os logs no frontend para diagnosticar problemas em tempo real.

---

## Hook Custom - useSpy BotLogger

```typescript
// hooks/useSpyBotLogger.ts

import { useState, useCallback } from 'react';

interface LogEntry {
  timestamp: string;
  stage: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
  duration?: number;
}

interface LogsSummary {
  totalLogs: number;
  totalTime: string;
  errors: number;
  warnings: number;
  successes: number;
  status: 'SUCCESS' | 'FAILED';
}

interface UseSpyBotLoggerReturn {
  logs: LogEntry[];
  summary: LogsSummary | null;
  isLoading: boolean;
  error: string | null;
  clearLogs: () => void;
  executeSpy: (adUrl: string, brandProfile?: any) => Promise<any>;
  getLogsByStage: (stage: string) => LogEntry[];
  getErrors: () => LogEntry[];
  getWarnings: () => LogEntry[];
}

export function useSpyBotLogger(): UseSpyBotLoggerReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setSummary(null);
    setError(null);
  }, []);

  const executeSpy = useCallback(
    async (adUrl: string, brandProfile?: any) => {
      clearLogs();
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/spy-engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adUrl, brandProfile })
        });

        const data = await response.json();

        // Extrair logs da resposta
        if (data.logs) {
          setLogs(data.logs.logs || []);
          setSummary(data.logs.summary || null);
        }

        if (!response.ok) {
          setError(data.error || 'Erro desconhecido');
          return null;
        }

        return data;
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao conectar ao servidor';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearLogs]
  );

  const getLogsByStage = useCallback(
    (stage: string) => logs.filter(log => log.stage === stage),
    [logs]
  );

  const getErrors = useCallback(() => logs.filter(log => log.level === 'ERROR'), [logs]);
  const getWarnings = useCallback(() => logs.filter(log => log.level === 'WARN'), [logs]);

  return {
    logs,
    summary,
    isLoading,
    error,
    clearLogs,
    executeSpy,
    getLogsByStage,
    getErrors,
    getWarnings
  };
}
```

---

## Componente - Logger Viewer

```typescript
// components/LoggerViewer.tsx

'use client';

import React, { useState } from 'react';

interface LogEntry {
  timestamp: string;
  stage: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
  duration?: number;
}

interface LogViewerProps {
  logs: LogEntry[];
  summary?: any;
  isLoading?: boolean;
}

const LEVEL_COLORS = {
  INFO: '#3B82F6',
  SUCCESS: '#10B981',
  WARN: '#F59E0B',
  ERROR: '#EF4444'
};

const LEVEL_ICONS = {
  INFO: 'ℹ️',
  SUCCESS: '✅',
  WARN: '⚠️',
  ERROR: '❌'
};

export function LoggerViewer({ logs, summary, isLoading }: LogViewerProps) {
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  const filteredLogs = filterLevel ? logs.filter(log => log.level === filterLevel) : logs;

  return (
    <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Logs de Execução</h3>
        {summary && (
          <p className="text-sm text-gray-600 mt-2">
            Status: <span className={summary.status === 'SUCCESS' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {summary.status}
            </span> |
            Tempo: <span className="text-blue-600 font-mono">{summary.totalTime}</span> |
            Logs: {summary.totalLogs} ({summary.successes} ✅, {summary.warnings} ⚠️, {summary.errors} ❌)
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterLevel(null)}
          className={`px-3 py-1 text-xs rounded font-mono ${
            filterLevel === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Todos ({logs.length})
        </button>
        {['INFO', 'SUCCESS', 'WARN', 'ERROR'].map(level => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`px-3 py-1 text-xs rounded font-mono ${
              filterLevel === level ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {level} ({logs.filter(l => l.level === level).length})
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p className="animate-pulse">Processando...</p>
        </div>
      )}

      {/* Logs */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Nenhum log</p>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded border-l-4"
              style={{ borderColor: LEVEL_COLORS[log.level] }}
              onClick={() => setExpandedLog(expandedLog === idx ? null : idx)}
              role="button"
              tabIndex={0}
            >
              <div className="flex justify-between items-start cursor-pointer">
                <div className="flex-1">
                  <div className="text-sm font-mono text-gray-600">
                    {log.timestamp}
                  </div>
                  <div className="text-sm mt-1">
                    <span className="mr-2">{LEVEL_ICONS[log.level]}</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {log.stage}
                    </span>
                    <span className="ml-2 text-gray-900">{log.message}</span>
                  </div>
                  {log.duration && (
                    <div className="text-xs text-gray-500 mt-1">
                      ⏱️ {log.duration}ms
                    </div>
                  )}
                </div>
                <div className="text-lg text-gray-400">
                  {expandedLog === idx ? '▼' : '▶'}
                </div>
              </div>

              {/* Dados Expandidos */}
              {expandedLog === idx && log.data && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto max-w-full">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Export Button */}
      <div className="mt-4">
        <button
          onClick={() => {
            const data = JSON.stringify(
              { summary, logs: filteredLogs },
              null,
              2
            );
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${new Date().toISOString()}.json`;
            a.click();
          }}
          className="text-xs px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          📥 Exportar Logs JSON
        </button>
      </div>
    </div>
  );
}
```

---

## Uso em Componente Principal

```typescript
// app/page.tsx (ou seu componente principal)

'use client';

import { useSpyBotLogger } from '@/hooks/useSpyBotLogger';
import { LoggerViewer } from '@/components/LoggerViewer';
import { useState } from 'react';

export default function SpyBotPage() {
  const { logs, summary, isLoading, error, executeSpy } = useSpyBotLogger();
  const [adUrl, setAdUrl] = useState('');

  const handleAnalyzeAd = async () => {
    const result = await executeSpy(adUrl);
    if (result) {
      console.log('Análise concluída:', result);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Input Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Spy Bot - Análise de Anúncios</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={adUrl}
            onChange={(e) => setAdUrl(e.target.value)}
            placeholder="Cole a URL do anúncio..."
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={handleAnalyzeAd}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Analisando...' : 'Analisar'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Logger Viewer */}
      <LoggerViewer logs={logs} summary={summary} isLoading={isLoading} />

      {/* Resultados */}
      {summary?.status === 'SUCCESS' && logs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Resultados da Análise</h2>
          {/* Componente com resultados aqui */}
        </div>
      )}
    </div>
  );
}
```

---

## Exemplos de Consultas aos Logs

### Ver Timeline Completa

```typescript
const { logs } = useSpyBotLogger();

logs.forEach(log => {
  console.log(`${log.timestamp} [${log.stage}] ${log.message}`);
});
```

### Diagnosticar Falha no Apify

```typescript
const { logs, getLogsByStage, getErrors } = useSpyBotLogger();

const apifyErrors = getLogsByStage('APIFY_FAIL');
const apifyLogs = getLogsByStage('APIFY_SUCCESS');

if (apifyErrors.length > 0) {
  console.log('Apify falhou:', apifyErrors[0].data);
} else if (apifyLogs.length > 0) {
  console.log('Apify sucesso:', apifyLogs[0].data);
}
```

### Ver Tempo de Cada Etapa

```typescript
const { logs } = useSpyBotLogger();

const stages = ['APIFY_CALL', 'OPENAI_CALL', 'DALLE_CALL', 'STORAGE_UPLOAD', 'SUPABASE_INSERT'];

stages.forEach(stage => {
  const stageLogs = logs.filter(l => l.stage === stage && l.duration);
  if (stageLogs.length > 0) {
    const duration = stageLogs[0].duration;
    console.log(`${stage}: ${duration}ms`);
  }
});
```

### Filtrar por Nível de Severidade

```typescript
const { getErrors, getWarnings } = useSpyBotLogger();

console.log('Erros:', getErrors());
console.log('Avisos:', getWarnings());
```

---

## CSS Tailwind Customizado (Opcional)

```css
/* globals.css */

.log-entry-info {
  @apply border-l-blue-500;
}

.log-entry-success {
  @apply border-l-green-500;
}

.log-entry-warn {
  @apply border-l-yellow-500;
}

.log-entry-error {
  @apply border-l-red-500;
}

.log-timestamp {
  @apply text-xs font-mono text-gray-600;
}

.log-stage {
  @apply text-xs font-mono bg-gray-100 px-2 py-1 rounded;
}

.log-message {
  @apply text-sm text-gray-900;
}

.log-duration {
  @apply text-xs text-gray-500 mt-1;
}
```

---

## Dashboard Avançado (Opcional)

Para um dashboard mais completo com gráficos de performance:

```typescript
// components/LogsDashboard.tsx

interface LogsDashboardProps {
  logs: LogEntry[];
  summary?: any;
}

export function LogsDashboard({ logs, summary }: LogsDashboardProps) {
  const stages = ['APIFY', 'OPENAI', 'DALLE', 'STORAGE', 'SUPABASE'];

  const stageDurations = stages.map(stage => ({
    stage,
    durations: logs
      .filter(l => l.stage.includes(stage) && l.duration)
      .map(l => l.duration)
  }));

  return (
    <div className="grid grid-cols-2 gap-4">
      {stageDurations.map(({ stage, durations }) => (
        <div key={stage} className="bg-white p-4 rounded shadow">
          <h3 className="font-bold">{stage}</h3>
          <p className="text-2xl font-mono text-blue-600">
            {durations.length > 0 ? `${durations[0]}ms` : 'N/A'}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## Troubleshooting Frontend

### "Logs não aparecem na UI"

1. Verificar se a resposta inclui `logs` no JSON
2. Abrir DevTools → Network → Response para confirmar
3. Verificar se `useSpyBotLogger` está extraindo corretamente

### "Dados expandidos não aparecem"

1. Clicar no log para expandir
2. Verificar se `log.data` não é undefined
3. Abrir console para debug: `console.log(log)`

### "Erro ao exportar JSON"

1. Verificar permissões de download do navegador
2. Testar em navegador diferente
3. Verificar storage disponível

---

**Versão:** 1.0
**Data:** 2026-03-08
**Compatível com:** React 18+, Next.js 14+
