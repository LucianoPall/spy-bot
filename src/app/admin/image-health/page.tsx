'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface HealthCheck {
  timestamp: string;
  uptime: number;
  supabase: {
    status: 'ok' | 'error' | 'unknown';
    bucket: string;
    isPublic: boolean | null;
    canRead: boolean | null;
    error: string | null;
  };
  cdn: Record<string, { status: string; error: string | null }>;
  cors: { configured: boolean; domains: string[] };
}

export default function ImageHealthDashboard() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/image-health');
      if (!res.ok) throw new Error('Falha ao carregar saúde');

      const data = await res.json();
      setHealth(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
      case 'unknown':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'error':
      case 'unknown':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (error && !health) {
    return (
      <div className="p-6 bg-[#0a0a0a] text-white min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erro ao Carregar Dashboard</h1>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchHealth}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (loading && !health) {
    return (
      <div className="p-6 bg-[#0a0a0a] text-white min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-6 bg-[#0a0a0a] text-white min-h-screen">
        <div className="text-center">
          <p className="text-gray-400">Sem dados disponíveis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0a0a0a] text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Image Health Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Monitoramento em tempo real da infraestrutura de imagens
            </p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Last Refresh Info */}
        {lastRefresh && (
          <div className="mb-6 text-xs text-gray-500">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </div>
        )}

        {/* Grid de Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supabase Status */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(health.supabase.status)}
              <h2 className="text-xl font-bold">Supabase Storage</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={getStatusColor(health.supabase.status)}>
                  {health.supabase.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bucket</span>
                <span>{health.supabase.bucket}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Público</span>
                <span>{health.supabase.isPublic ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Leitura</span>
                <span>{health.supabase.canRead ? '✅' : '❌'}</span>
              </div>
              {health.supabase.error && (
                <div className="mt-3 p-2 bg-red-900/30 rounded text-red-400 text-xs">
                  {health.supabase.error}
                </div>
              )}
            </div>
          </div>

          {/* CDN Status */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold">CDN Status</h2>
            </div>
            <div className="space-y-3 text-sm">
              {Object.entries(health.cdn).map(([name, data]) => (
                <div key={name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-gray-400 w-24">{name}</span>
                    {getStatusIcon(data.status)}
                  </div>
                  <span className={getStatusColor(data.status)}>
                    {data.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CORS Configuration */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">CORS Configuration</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Configurado</span>
                <span>{health.cors.configured ? '✅' : '❌'}</span>
              </div>
              <div className="mt-3">
                <span className="text-gray-400 block mb-2">Domínios Permitidos:</span>
                <div className="space-y-1">
                  {health.cors.domains.map((domain, idx) => (
                    <div key={idx} className="ml-2 text-gray-300 text-xs bg-[#0a0a0a] p-2 rounded">
                      {domain}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Server Info */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">Server Info</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime</span>
                <span>{Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Timestamp</span>
                <span className="text-xs">{new Date(health.timestamp).toLocaleTimeString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded text-red-400 flex items-start gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro durante a atualização</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
