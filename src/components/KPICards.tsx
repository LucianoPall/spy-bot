"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, Lightbulb, Target, RefreshCw } from "lucide-react";

const REFRESH_INTERVAL = 60;

interface KPIData {
  credits: number;
  totalClones: number;
  niche: string;
}

export default function KPICards({ refreshKey = 0 }: { refreshKey?: number }) {
  const [kpiData, setKpiData] = useState<KPIData>({
    credits: 0,
    totalClones: 0,
    niche: "Não configurado",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchKPI = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await fetch("/api/kpi-data");
      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
        setLastUpdated(new Date());
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  // Busca inicial + quando refreshKey muda (novo clone feito)
  useEffect(() => {
    fetchKPI();
  }, [refreshKey, fetchKPI]);

  // Auto-refresh a cada 60s
  useEffect(() => {
    const interval = setInterval(() => fetchKPI(), REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchKPI]);

  // Countdown visual
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const updatedLabel = lastUpdated
    ? `${lastUpdated.getHours().toString().padStart(2, "0")}:${lastUpdated.getMinutes().toString().padStart(2, "0")}:${lastUpdated.getSeconds().toString().padStart(2, "0")}`
    : null;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {/* Credits Card */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-400">Créditos Restantes</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {loading ? "-" : kpiData.credits}
          </div>
          <p className="text-xs text-gray-500">Extrações livres disponíveis</p>
        </div>

        {/* Total Clones Card */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-400">Total de Clones</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {loading ? "-" : kpiData.totalClones}
          </div>
          <p className="text-xs text-gray-500">Anúncios clonados até agora</p>
        </div>

        {/* Active Niche Card */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-400">Nicho Ativo</span>
          </div>
          <div className="text-lg font-bold text-white truncate">
            {loading ? "-" : kpiData.niche}
          </div>
          <p className="text-xs text-gray-500">Seu perfil de mercado</p>
        </div>
      </div>

      {/* Barra de status de atualização */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">
            {updatedLabel ? `Atualizado às ${updatedLabel}` : "Carregando..."}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">
            Próxima atualização em <span className="text-gray-400 font-mono">{countdown}s</span>
          </span>
          <button
            onClick={() => fetchKPI(true)}
            disabled={refreshing || loading}
            title="Atualizar agora"
            className="text-gray-500 hover:text-green-400 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
