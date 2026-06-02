/**
 * Notification Preferences
 *
 * As preferências de notificação por email do usuário são armazenadas no
 * `user_metadata` do Supabase Auth (campo `notification_prefs`). Isso evita
 * uma tabela dedicada: o usuário grava as próprias prefs via
 * `supabase.auth.updateUser({ data: { notification_prefs } })` e o servidor
 * lê via `getUser()` (sessão) ou `auth.admin.listUsers()` (cron/service role).
 */

export interface NotificationPrefs {
  /** Email quando um clone é gerado com sucesso. */
  emailNewClones: boolean;
  /** Resumo semanal de uso. */
  weeklyDigest: boolean;
  /** Alerta quando os créditos estão acabando. */
  lowCreditsAlert: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailNewClones: true,
  weeklyDigest: false,
  lowCreditsAlert: true,
};

export const NOTIFICATION_PREFS_METADATA_KEY = 'notification_prefs';

/**
 * Extrai e normaliza as preferências a partir do `user_metadata`.
 * Tolera ausência/objeto parcial — sempre retorna um objeto completo
 * mesclado com os defaults.
 */
export function getNotificationPrefs(
  userMetadata: Record<string, unknown> | null | undefined
): NotificationPrefs {
  const raw = userMetadata?.[NOTIFICATION_PREFS_METADATA_KEY];
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFICATION_PREFS };

  const r = raw as Partial<Record<keyof NotificationPrefs, unknown>>;
  return {
    emailNewClones:
      typeof r.emailNewClones === 'boolean'
        ? r.emailNewClones
        : DEFAULT_NOTIFICATION_PREFS.emailNewClones,
    weeklyDigest:
      typeof r.weeklyDigest === 'boolean'
        ? r.weeklyDigest
        : DEFAULT_NOTIFICATION_PREFS.weeklyDigest,
    lowCreditsAlert:
      typeof r.lowCreditsAlert === 'boolean'
        ? r.lowCreditsAlert
        : DEFAULT_NOTIFICATION_PREFS.lowCreditsAlert,
  };
}
