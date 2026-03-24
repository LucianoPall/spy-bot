"use client";

import { useEffect, useState } from "react";
import { Zap, Lightbulb, Target } from "lucide-react";

interface KPIData {
  credits: number;
  totalClones: number;
  niche: string;
}

export default function KPICards() {
  const [kpiData, setKpiData] = useState<KPIData>({
    credits: 0,
    totalClones: 0,
    niche: "Não configurado",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⚡ Lazy load - não bloqueia rendering
    const timer = setTimeout(() => {
      (async () => {
        try {
          const response = await fetch("/api/kpi-data");
          if (response.ok) {
            const data = await response.json();
            setKpiData(data);
          }
        } catch (error) {
          // Silent fail
        } finally {
          setLoading(false);
        }
      })();
    }, 1000); // Delay 1s após render

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8">
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
  );
}
