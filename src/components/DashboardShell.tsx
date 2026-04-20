"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { Target, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardNav from "./DashboardNav";
import LogoutButton from "./LogoutButton";

const STORAGE_KEY = "spy-bot-sidebar-collapsed";

interface DashboardShellProps {
  children: ReactNode;
  userName: string;
  isPro: boolean;
  isAdmin?: boolean;
}

export default function DashboardShell({ children, userName, isPro, isAdmin = false }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration: localStorage only exists on client
      setCollapsed(saved === "true");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const isCollapsed = mounted && collapsed;

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-slate-300 flex">

      {/* ================================================
          SIDEBAR
          Desktop : fixed, ocupa 100vh, nunca rola com a página
          Mobile  : bottom navigation bar fixa
          ================================================ */}
      <aside
        className={[
          // Mobile: barra inferior fixa
          "fixed bottom-0 left-0 right-0 h-[70px]",
          // Desktop: lateral fixa, altura total da tela
          "md:top-0 md:bottom-auto md:right-auto md:h-screen md:flex-col",
          "bg-[#0a0a0a]",
          "border-t md:border-t-0 md:border-r border-[#1a1a1a]",
          "flex md:flex-col",
          "z-40",
          // Scroll interno na sidebar se o conteúdo ultrapassar a tela
          "overflow-x-auto md:overflow-x-hidden md:overflow-y-auto",
          "flex-shrink-0",
          "transition-[width] duration-300 ease-in-out",
          isCollapsed ? "md:w-[70px]" : "md:w-[260px]",
        ].join(" ")}
      >
        {/* ---- Logo (desktop only) ---- */}
        <div className="hidden md:flex items-center p-4 gap-2 flex-shrink-0">
          {isCollapsed ? (
            <Target className="w-6 h-6 text-green-500 mx-auto flex-shrink-0" />
          ) : (
            <div className="flex items-center gap-2 overflow-hidden">
              <Target className="w-6 h-6 text-green-500 flex-shrink-0" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 whitespace-nowrap">
                AdClone
              </span>
            </div>
          )}
        </div>

        {/* ---- User info (desktop, só expandido) ---- */}
        <div
          className={[
            "hidden md:block px-4 overflow-hidden transition-all duration-300",
            isCollapsed ? "h-0 opacity-0 py-0" : "opacity-100 pb-4",
          ].join(" ")}
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-300 truncate" title={userName}>
              Olá, {userName}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded w-max tracking-wider ${
                isPro ? "text-green-500 bg-green-900/20" : "text-gray-400 bg-gray-800"
              }`}
            >
              {isPro ? "PRO LICENCE" : "PLANO GRÁTIS"}
            </span>
          </div>
        </div>

        {/* ---- Navegação ---- */}
        <DashboardNav collapsed={isCollapsed} isAdmin={isAdmin} />

        {/* ---- Logout (desktop only) ---- */}
        <div className="hidden md:block p-4 border-t border-[#1a1a1a] mt-auto flex-shrink-0">
          <LogoutButton collapsed={isCollapsed} />
        </div>
      </aside>

      {/* Spacer: compensa a sidebar fixed no fluxo do layout (desktop only) */}
      <div
        className={[
          "hidden md:block flex-shrink-0 transition-[width] duration-300 ease-in-out",
          isCollapsed ? "md:w-[70px]" : "md:w-[260px]",
        ].join(" ")}
      />

      {/* ================================================
          MAIN CONTENT
          h-screen + overflow-hidden = trava no viewport
          Só o div interno tem overflow-y-auto (único scroll)
          ================================================ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pb-[70px] md:pb-0">

        {/* Header desktop — botão toggle sempre visível, não rola */}
        <header className="hidden md:flex h-[57px] border-b border-[#1a1a1a] bg-[#0a0a0a] items-center px-4 flex-shrink-0">
          <button
            onClick={toggle}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200 active:bg-green-500/10 active:text-green-400 transition-all duration-200"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </header>

        {/* Header mobile — não rola */}
        <header className="md:hidden h-[70px] border-b border-[#1a1a1a] bg-[#0a0a0a] flex justify-between items-center px-6 flex-shrink-0">
          <strong className="text-green-500 flex items-center gap-2">
            <Target className="w-5 h-5" /> AdClone
          </strong>
          <div className="w-6 h-6" />
        </header>

        {/* Área de scroll — único elemento que rola na tela */}
        <div className="flex-1 overflow-y-auto scroll-smooth w-full">
          <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 lg:py-5">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}
