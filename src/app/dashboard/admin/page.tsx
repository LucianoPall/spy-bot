"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Zap, DollarSign, Loader2, RefreshCw } from "lucide-react";

interface UserRow {
  userId: string;
  plan: string;
  credits: number;
  initialCredits: number;
  creditsUsed: number;
  generations: number;
  createdAt: string;
}

interface AdminStats {
  period: string;
  totalUsers: number;
  totalGenerations: number;
  mrr: number;
  proCount: number;
  trialCount: number;
  gratisCount: number;
  users: UserRow[];
}

const PERIODS = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "all", label: "Todos" },
] as const;

const planBadge: Record<string, string> = {
  pro: "bg-green-500/20 text-green-400 border-green-500/30",
  premium: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  gratis: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("all");

  const fetchStats = useCallback((p: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    fetch(`/api/admin/stats?period=${p}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error("Acesso negado. Somente admin.");
          throw new Error("Erro ao carregar dados");
        }
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- API data fetch with setState is intentional
    fetchStats(period);
  }, [period, fetchStats]);

  const handlePeriod = (p: string) => {
    setPeriod(p);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">{error}</p>
          <p className="text-gray-500 text-sm mt-2">Verifique se voce esta logado como admin.</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Visao geral do sistema — usuarios, geracoes e receita.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="flex bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-1 gap-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePeriod(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === key
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#151515] border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchStats(period, true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] text-gray-400 hover:text-white hover:bg-[#151515] transition-all disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          label={period === "all" ? "Total Usuarios" : "Usuarios no periodo"}
          value={stats.totalUsers}
          detail={`${stats.proCount} pro · ${stats.trialCount} trial · ${stats.gratisCount} gratis`}
          color="green"
        />
        <KPICard
          icon={<Zap className="w-5 h-5" />}
          label={period === "all" ? "Total Geracoes" : "Geracoes no periodo"}
          value={stats.totalGenerations}
          detail="clones gerados no sistema"
          color="blue"
        />
        <KPICard
          icon={<DollarSign className="w-5 h-5" />}
          label="MRR Estimado"
          value={`R$ ${stats.mrr.toLocaleString("pt-BR")}`}
          detail={`${stats.proCount} pro (R$99) + ${stats.trialCount} trial (R$47)`}
          color="emerald"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
          <h2 className="text-white font-semibold">Usuarios ({stats.users.length})</h2>
          {refreshing && <Loader2 size={14} className="text-green-500 animate-spin" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-[#1a1a1a]">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium text-right">Creditos</th>
                <th className="px-4 py-3 font-medium text-right">Gastos</th>
                <th className="px-4 py-3 font-medium text-right">Geracoes</th>
                <th className="px-4 py-3 font-medium text-right">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.map((u) => (
                <tr
                  key={u.userId}
                  className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-gray-300 font-mono text-xs">
                      {u.userId.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded border ${
                        planBadge[u.plan] || planBadge.gratis
                      }`}
                    >
                      {u.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {u.initialCredits === -1 ? "∞" : u.credits}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.initialCredits === -1 ? (
                      <span className="text-gray-500">ilimitado</span>
                    ) : u.creditsUsed > 0 ? (
                      <span className="text-orange-400 font-medium">
                        {u.creditsUsed}/{u.initialCredits}
                      </span>
                    ) : (
                      <span className="text-gray-500">0/{u.initialCredits}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{u.generations}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
              {stats.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum usuario encontrado neste periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const iconColor: Record<string, string> = {
    green: "text-green-500",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor[color]}>{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}
