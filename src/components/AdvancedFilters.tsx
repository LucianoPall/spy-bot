"use client";

import { useState, useCallback } from "react";
import { Calendar, X, RotateCcw } from "lucide-react";
import { FilterOptions } from "@/lib/types";

interface AdvancedFiltersProps {
  niches: string[];
  onFiltersChange: (filters: FilterOptions) => void;
  onFilterReset?: () => void;
}

export default function AdvancedFilters({
  niches,
  onFiltersChange,
  onFilterReset,
}: AdvancedFiltersProps) {
  const [activeNiche, setActiveNiche] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [status, setStatus] = useState<"favorite" | "all">("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Emitir mudanças de filtros
  const emitFiltersChange = useCallback(
    (
      niche?: string,
      from?: string,
      to?: string,
      stat?: "favorite" | "all"
    ) => {
      const filters: FilterOptions = {};

      if (niche) {
        filters.niche = niche;
      }

      if (from || to) {
        filters.dateRange = {
          from: from ? new Date(from) : new Date(0),
          to: to ? new Date(to) : new Date(),
        };
      }

      if (stat !== "all") {
        filters.status = stat;
      }

      onFiltersChange(filters);
    },
    [onFiltersChange]
  );

  const handleNicheClick = (niche: string) => {
    const newNiche = activeNiche === niche ? undefined : niche;
    setActiveNiche(newNiche);
    emitFiltersChange(newNiche, dateFrom, dateTo, status);
  };

  const handleDateChange = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setDateFrom(value);
      emitFiltersChange(activeNiche, value, dateTo, status);
    } else {
      setDateTo(value);
      emitFiltersChange(activeNiche, dateFrom, value, status);
    }
  };

  const handleStatusChange = (newStatus: "favorite" | "all") => {
    setStatus(newStatus);
    emitFiltersChange(activeNiche, dateFrom, dateTo, newStatus);
  };

  const handleResetFilters = () => {
    setActiveNiche(undefined);
    setDateFrom("");
    setDateTo("");
    setStatus("all");
    setIsDatePickerOpen(false);
    onFilterReset?.();
    onFiltersChange({});
  };

  const hasActiveFilters =
    activeNiche || dateFrom || dateTo || status === "favorite";

  return (
    <div className="w-full space-y-3 bg-[#111] p-4 rounded-[10px] border border-[#222]">
      {/* Cabeçalho com título e botão reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calendar size={16} className="text-green-500" />
          Filtros Avançados
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
              {niche}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Data */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Período</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateChange("from", e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] text-xs text-white rounded-[8px] px-3 py-2 outline-none focus:border-green-500/50 transition-colors"
              placeholder="De"
            />
          </div>
          <div className="relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateChange("to", e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] text-xs text-white rounded-[8px] px-3 py-2 outline-none focus:border-green-500/50 transition-colors"
              placeholder="Até"
            />
          </div>
        </div>
      </div>

      {/* Filtro de Status */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Status</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange("all")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-[8px] transition-all ${
              status === "all"
                ? "bg-green-500 text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#333]"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => handleStatusChange("favorite")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-[8px] transition-all ${
              status === "favorite"
                ? "bg-green-500 text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#333]"
            }`}
          >
            Favoritos
          </button>
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-[#222]">
          <div className="text-xs text-gray-500">
            Filtros ativos:
            <span className="text-green-500 ml-1">
              {[
                activeNiche && `Nicho: ${activeNiche}`,
                dateFrom && `De: ${new Date(dateFrom).toLocaleDateString("pt-BR")}`,
                dateTo && `Até: ${new Date(dateTo).toLocaleDateString("pt-BR")}`,
                status === "favorite" && "Apenas favoritos",
              ]
                .filter(Boolean)
                .join(" • ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
