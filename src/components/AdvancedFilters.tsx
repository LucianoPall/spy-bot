"use client";

import { useState, useCallback } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import { FilterOptions } from "@/lib/types";

type QuickPeriod = "today" | "yesterday" | "last7" | "last30" | "custom";

interface AdvancedFiltersProps {
  niches: string[];
  nicheCounts?: Record<string, number>;
  onFiltersChange: (filters: FilterOptions) => void;
  onFilterReset?: () => void;
}

const NICHE_DISPLAY_NAMES: Record<string, string> = {
  EMAGRECIMENTO: 'Emagrecimento',
  ESTETICA: 'Estética & Beleza',
  ALIMENTACAO: 'Alimentação',
  IGAMING: 'iGaming & Apostas',
  ECOMMERCE: 'E-commerce',
  RENDA_EXTRA: 'Renda Extra',
  GERAL: 'Marketing Digital',
};

const QUICK_PERIODS: { key: QuickPeriod; label: string }[] = [
  { key: "today",     label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "last7",     label: "Últimos 7 dias" },
  { key: "last30",    label: "Últimos 30 dias" },
  { key: "custom",    label: "Personalizado" },
];

/** Formata data usando fuso local (evita bug UTC do toISOString) */
function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Retorna { from, to } como strings YYYY-MM-DD no fuso local */
function getQuickPeriodDates(period: QuickPeriod): { from: string; to: string } | null {
  const today = new Date();

  if (period === "today") {
    return { from: fmtLocal(today), to: fmtLocal(today) };
  }
  if (period === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: fmtLocal(y), to: fmtLocal(y) };
  }
  if (period === "last7") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { from: fmtLocal(d), to: fmtLocal(today) };
  }
  if (period === "last30") {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return { from: fmtLocal(d), to: fmtLocal(today) };
  }
  return null; // "custom" — datas definidas pelo usuário
}

function getNicheLabel(niche: string, counts?: Record<string, number>): string {
  const displayName = NICHE_DISPLAY_NAMES[niche] || niche.charAt(0).toUpperCase() + niche.slice(1).toLowerCase();
  const count = counts?.[niche];
  return count !== undefined ? `${displayName} (${count})` : displayName;
}

function formatDateBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function AdvancedFilters({
  niches,
  nicheCounts,
  onFiltersChange,
  onFilterReset,
}: AdvancedFiltersProps) {
  const [activeNiche, setActiveNiche]     = useState<string | undefined>(undefined);
  const [activePeriod, setActivePeriod]   = useState<QuickPeriod | undefined>(undefined);
  const [customFrom, setCustomFrom]       = useState<string>("");
  const [customTo, setCustomTo]           = useState<string>("");

  const emitFiltersChange = useCallback(
    (niche?: string, from?: string, to?: string) => {
      const filters: FilterOptions = {};
      if (niche) filters.niche = niche;
      if (from || to) {
        // Usa T00:00:00 e T23:59:59 sem sufixo Z para forçar fuso local
        filters.dateRange = {
          from: from ? new Date(`${from}T00:00:00`) : new Date(0),
          to:   to   ? new Date(`${to}T23:59:59`)   : new Date(),
        };
      }
      onFiltersChange(filters);
    },
    [onFiltersChange]
  );

  const handleNicheClick = (niche: string) => {
    const newNiche = activeNiche === niche ? undefined : niche;
    setActiveNiche(newNiche);

    // Mantém o período ativo ao trocar nicho
    const dates = activePeriod && activePeriod !== "custom"
      ? getQuickPeriodDates(activePeriod)
      : { from: customFrom, to: customTo };

    emitFiltersChange(newNiche, dates?.from, dates?.to);
  };

  const handleQuickPeriod = (period: QuickPeriod) => {
    // Clique no mesmo botão desfaz o filtro de período
    if (activePeriod === period) {
      setActivePeriod(undefined);
      setCustomFrom("");
      setCustomTo("");
      emitFiltersChange(activeNiche, undefined, undefined);
      return;
    }

    setActivePeriod(period);

    if (period !== "custom") {
      const dates = getQuickPeriodDates(period)!;
      emitFiltersChange(activeNiche, dates.from, dates.to);
    }
    // "custom": aguarda o usuário preencher as datas
  };

  const handleCustomDate = (field: "from" | "to", value: string) => {
    const from = field === "from" ? value : customFrom;
    const to   = field === "to"   ? value : customTo;

    if (field === "from") setCustomFrom(value);
    else setCustomTo(value);

    // Só emite quando ambas as datas estiverem preenchidas
    if (from && to) emitFiltersChange(activeNiche, from, to);
  };

  const handleResetFilters = () => {
    setActiveNiche(undefined);
    setActivePeriod(undefined);
    setCustomFrom("");
    setCustomTo("");
    onFilterReset?.();
    onFiltersChange({});
  };

  const hasActiveFilters = activeNiche || activePeriod;

  // Label do período ativo para exibição
  const periodLabel = (() => {
    if (!activePeriod) return null;
    if (activePeriod !== "custom") {
      return QUICK_PERIODS.find(p => p.key === activePeriod)?.label ?? null;
    }
    if (customFrom && customTo) return `${formatDateBR(customFrom)} → ${formatDateBR(customTo)}`;
    if (customFrom) return `A partir de ${formatDateBR(customFrom)}`;
    if (customTo)   return `Até ${formatDateBR(customTo)}`;
    return "Personalizado";
  })();

  return (
    <div className="w-full space-y-3 bg-[#111] p-4 rounded-[10px] border border-[#222]">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calendar size={16} className="text-green-500" />
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-gray-300 border border-[#333] rounded-full transition-all"
          >
            <RotateCcw size={12} />
            Limpar
          </button>
        )}
      </div>

      {/* Filtro de Nicho */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Nicho</label>
        <div className="flex flex-wrap gap-2">
          {niches.map((niche) => (
            <button
              key={niche}
              onClick={() => handleNicheClick(niche)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeNiche === niche
                  ? "bg-green-500 text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#333] hover:border-[#444]"
              }`}
            >
              {getNicheLabel(niche, nicheCounts)}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Período — botões rápidos */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Período</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleQuickPeriod(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                activePeriod === key
                  ? "bg-green-500 text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#333] hover:border-[#444]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date picker — só aparece em "Personalizado" */}
        {activePeriod === "custom" && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => handleCustomDate("from", e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] text-xs text-white rounded-[8px] px-3 py-2 outline-none focus:border-green-500/50 transition-colors"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => handleCustomDate("to", e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] text-xs text-white rounded-[8px] px-3 py-2 outline-none focus:border-green-500/50 transition-colors"
            />
          </div>
        )}

        {/* Label do período ativo */}
        {periodLabel && (
          <p className="text-[11px] text-green-500/80 px-1">
            {periodLabel}
          </p>
        )}
      </div>

    </div>
  );
}
