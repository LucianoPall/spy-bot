"use client";

import { useState, useEffect } from "react";
import {
  Save, UserCircle2, Building2, Target, MessageSquare, Loader2,
  Crown, Zap, AlertCircle, Shield, Bell, FileDown, Lock,
  Eye, EyeOff, Check, X
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getNotificationPrefs,
  NOTIFICATION_PREFS_METADATA_KEY,
  type NotificationPrefs,
} from "@/lib/notification-prefs";

// ============================================================
// TABS
// ============================================================
const TABS = [
  { key: "perfil", label: "Perfil", icon: UserCircle2 },
  { key: "seguranca", label: "Seguranca", icon: Shield },
  { key: "notificacoes", label: "Notificacoes", icon: Bell },
  { key: "lgpd", label: "Seus Dados", icon: FileDown },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ============================================================
// NICHES
// ============================================================
const SUGGESTED_NICHES = [
  "Estetica Facial", "Emagrecimento", "Imoveis", "E-commerce",
  "Cursos Digitais", "Marketing Digital", "Saude e Bem-estar",
  "Moda e Vestuario", "Pets", "Financas Pessoais",
];

interface SubscriptionData {
  credits_remaining: number;
  plan: string;
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("perfil");

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuracoes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie seu perfil, seguranca e preferencias.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === key
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#151515] border border-transparent"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "perfil" && <PerfilTab />}
      {activeTab === "seguranca" && <SegurancaTab />}
      {activeTab === "notificacoes" && <NotificacoesTab />}
      {activeTab === "lgpd" && <LGPDTab />}
    </div>
  );
}

// ============================================================
// TAB: PERFIL (conteudo existente)
// ============================================================
function PerfilTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  const [profile, setProfile] = useState({
    companyName: "",
    niche: "",
    targetAudience: "",
    toneOfVoice: "",
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const stored = localStorage.getItem("spybot_brand_profile");
        if (stored) setProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse profile", e);
      }

      try {
        const response = await fetch("/api/subscription-data");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
      }

      setLoading(false);
    };

    initializeData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    setTimeout(() => {
      localStorage.setItem("spybot_brand_profile", JSON.stringify(profile));
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  if (loading) return <TabLoading />;

  return (
    <div className="space-y-8">
      {/* Painel de Assinatura */}
      <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none" />
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Crown className="text-yellow-500" size={24} /> Seu Plano e Uso
        </h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-center">
            <span className="text-sm text-gray-400 font-medium mb-1">Status da Conta</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-200">
                {subscription?.plan === "pro" ? "Plano PRO" : "Plano Gratis"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  subscription?.plan === "pro"
                    ? "bg-green-900 text-green-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {subscription?.plan === "pro" ? "PRO" : "STARTER"}
              </span>
            </div>
          </div>
          <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-center">
            <span className="text-sm text-gray-400 font-medium mb-2">Extracoes Livres no Mes</span>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  style={{
                    width: subscription
                      ? `${(subscription.credits_remaining / 5) * 100}%`
                      : "40%",
                  }}
                />
              </div>
              <span className="text-sm font-bold text-green-400 whitespace-nowrap">
                {subscription
                  ? `${subscription.credits_remaining} de 5 Restantes`
                  : "- de 5 Restantes"}
              </span>
            </div>
          </div>
        </div>

        <button className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500" />
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3">
            <Zap className="fill-white" size={20} />
            Desbloquear Multiplas Contas e Geracao Ilimitada - Assine o PRO
          </div>
        </button>
      </div>

      <hr className="border-[#1a1a1a]" />

      {/* Perfil da Marca */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
          <UserCircle2 className="text-green-500" size={24} />
          Perfil Inteligente da Marca
        </h2>
        <p className="text-gray-400 text-sm">
          Preencha os dados do seu negocio. O AdClone usara essa identidade para que as copies e imagens fiquem com a cara perfeita da sua empresa.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl space-y-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Building2 size={16} className="text-green-500" /> Nome do Especialista ou Empresa
            </label>
            <input
              type="text"
              name="companyName"
              value={profile.companyName}
              onChange={handleChange}
              placeholder="Ex: Dr. Lucas ou Clinica Diamante"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Target size={16} className="text-green-500" /> Nicho de Mercado
            </label>
            <input
              type="text"
              name="niche"
              value={profile.niche}
              onChange={handleChange}
              placeholder="Ex: Estetica Facial, Emagrecimento, Imoveis de Luxo"
              list="niches-list"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
            <datalist id="niches-list">
              {SUGGESTED_NICHES.map((niche) => (
                <option key={niche} value={niche} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <UserCircle2 size={16} className="text-green-500" /> Quem e o seu Publico-Alvo Ideal?
          </label>
          <textarea
            name="targetAudience"
            value={profile.targetAudience}
            onChange={handleChange}
            rows={3}
            placeholder="Ex: Mulheres de 30 a 50 anos, maes, que se sentem inseguras com o corpo pos-gravidez."
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <MessageSquare size={16} className="text-green-500" /> Tom de Voz e Estilo Desejado
          </label>
          <textarea
            name="toneOfVoice"
            value={profile.toneOfVoice}
            onChange={handleChange}
            rows={3}
            placeholder="Ex: Autoridade medica, acolhedor mas firme, estilo direto ao ponto."
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
          />
        </div>

        {subscription && subscription.plan === "gratis" && subscription.credits_remaining === 0 && (
          <div className="space-y-2 mt-6 p-4 border border-yellow-500/20 bg-yellow-900/10 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-500 mt-1 shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-yellow-400 mb-1">Seus creditos gratis acabaram!</p>
                <p className="text-xs text-yellow-300/80">
                  Assine o plano PRO para continuar usando.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#222] flex items-center justify-between">
          <div className="text-sm">
            {success && (
              <span className="text-green-400 font-medium flex items-center gap-1">
                <Check size={16} /> Perfil salvo com sucesso!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Identidade
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// TAB: SEGURANCA
// ============================================================
function SegurancaTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isValid = newPassword.length >= 8 && newPassword === confirmPassword && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Verificar senha atual fazendo login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuario nao encontrado");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setMessage({ type: "error", text: "Senha atual incorreta." });
        setLoading(false);
        return;
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Senha atualizada com sucesso!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao atualizar senha. Tente novamente." });
      console.error("Password update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Lock className="text-green-500" size={20} /> Alterar Senha
        </h2>
        <p className="text-gray-500 text-sm mb-6">Atualize sua senha para manter sua conta segura.</p>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          {/* Senha Atual */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Senha Atual</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 pr-12 text-white focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nova Senha</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 pr-12 text-white focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <X size={12} /> Minimo 8 caracteres
              </p>
            )}
            {newPassword.length >= 8 && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Check size={12} /> Senha valida
              </p>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <X size={12} /> Senhas nao coincidem
              </p>
            )}
            {confirmPassword.length > 0 && confirmPassword === newPassword && newPassword.length >= 8 && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Check size={12} /> Senhas coincidem
              </p>
            )}
          </div>

          {/* Mensagem */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
            Atualizar Senha
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// TAB: NOTIFICACOES
// ============================================================
function NotificacoesTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setPrefs(getNotificationPrefs(user?.user_metadata));
      } catch {
        setPrefs(getNotificationPrefs(null));
      }
    };
    load();
  }, []);

  const togglePref = async (key: keyof NotificationPrefs) => {
    if (!prefs || savingKey) return;

    const previous = prefs;
    const updated = { ...prefs, [key]: !prefs[key] };
    // Otimista: reflete o toggle imediatamente, reverte se falhar.
    setPrefs(updated);
    setSavingKey(key);
    setError(false);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { [NOTIFICATION_PREFS_METADATA_KEY]: updated },
      });
      if (updateError) throw updateError;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setPrefs(previous);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setSavingKey(null);
    }
  };

  if (!prefs) return <TabLoading />;

  const notifications = [
    {
      key: "emailNewClones" as const,
      title: "Novos clones gerados",
      description: "Receba um email quando um clone for gerado com sucesso.",
    },
    {
      key: "weeklyDigest" as const,
      title: "Resumo semanal",
      description: "Receba um resumo semanal com suas metricas de uso.",
    },
    {
      key: "lowCreditsAlert" as const,
      title: "Alerta de creditos baixos",
      description: "Seja notificado quando seus creditos estiverem acabando.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Bell className="text-green-500" size={20} /> Preferencias de Notificacao
        </h2>
        <p className="text-gray-500 text-sm mb-6">Escolha quais notificacoes voce deseja receber.</p>

        <div className="space-y-4 max-w-lg">
          {notifications.map(({ key, title, description }) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-200">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                disabled={savingKey !== null}
                onClick={() => togglePref(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                  prefs[key] ? "bg-green-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    prefs[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {saved && (
          <p className="text-xs text-green-400 mt-4 flex items-center gap-1">
            <Check size={14} /> Preferencias salvas
          </p>
        )}
        {error && (
          <p className="text-xs text-red-400 mt-4 flex items-center gap-1">
            <X size={14} /> Erro ao salvar. Tente novamente.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: LGPD
// ============================================================
function LGPDTab() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/user/export-data");
      if (!res.ok) throw new Error("Erro ao exportar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spybot-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 5000);
    } catch (error) {
      console.error("Export error:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <FileDown className="text-green-500" size={20} /> Seus Dados (LGPD)
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Exporte todos os seus dados pessoais em formato JSON, conforme seu direito pela LGPD.
        </p>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 max-w-lg">
          <h3 className="text-sm font-medium text-gray-200 mb-2">O que esta incluso no export:</h3>
          <ul className="text-xs text-gray-500 space-y-1.5 mb-5">
            <li className="flex items-center gap-2"><Check size={12} className="text-green-500" /> Dados da sua conta (email, data de cadastro)</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-green-500" /> Informacoes de assinatura e creditos</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-green-500" /> Perfil da marca configurado</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-green-500" /> Historico completo de geracoes (clones)</li>
          </ul>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
          >
            {exporting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : exported ? (
              <Check size={18} />
            ) : (
              <FileDown size={18} />
            )}
            {exporting ? "Exportando..." : exported ? "Download concluido!" : "Exportar Meus Dados"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================
function TabLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );
}
