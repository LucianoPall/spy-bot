"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Settings, Edit2 } from "lucide-react";
import Link from "next/link";

interface BrandProfile {
  companyName?: string;
  niche?: string;
  targetAudience?: string;
  toneOfVoice?: string;
}

export default function ActiveProfileBanner() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = localStorage.getItem("spybot_brand_profile");
      if (stored) {
         
        setProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse profile", e);
    }
  }, []);

  // Evita erro de hidratação renderizando placeholder no servidor
  if (!isHydrated) {
    return (
      <div className="mb-8 bg-[#111] border border-[#222] rounded-xl p-6 h-24" />
    );
  }

  if (!profile || !profile.niche) {
    return (
      <div className="mb-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="text-yellow-500 shrink-0 mt-1" size={24} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-400 mb-1">
            Configure seu Nicho de Mercado
          </h3>
          <p className="text-yellow-300/80 text-sm mb-4">
            Adicione informações sobre seu negócio para que o Spy Bot gere copies e imagens
            100% personalizadas para sua marca.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors"
          >
            <Settings size={16} />
            Ir para Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-green-900/20 border border-green-500/30 rounded-xl p-6 flex items-start gap-4">
      <CheckCircle2 className="text-green-500 shrink-0 mt-1" size={24} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-1">
              Perfil Ativo: {profile.niche}
            </h3>
            <p className="text-green-300/80 text-sm">
              {profile.companyName && <>Especialista/Empresa: <strong>{profile.companyName}</strong></>}
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
          >
            <Edit2 size={16} />
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}
