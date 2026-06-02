import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Remetente dos emails.
 * ⚠️ `onboarding@resend.dev` (default) só entrega para o email dono da conta Resend.
 * Para enviar a usuários finais, verifique um domínio em https://resend.com/domains
 * e defina EMAIL_FROM, ex: 'AdClone <nao-responder@seudominio.com>'.
 */
const EMAIL_FROM = process.env.EMAIL_FROM || 'AdClone <onboarding@resend.dev>';

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Envia um email via Resend com tratamento de erro e modo mock (sem API key). */
async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not configured. Email "${subject}" would be sent to:`, to);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
  try {
    const response = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
    if (response.error) {
      console.error('Resend error:', response.error);
      return { success: false, error: String(response.error.message ?? response.error) };
    }
    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error(`Error sending email "${subject}":`, error);
    return { success: false, error: String(error) };
  }
}

/** Wrapper de layout compartilhado para os emails ao usuário. */
function emailLayout(title: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; background: #f4f4f5; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: #fff; padding: 28px 32px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .content { padding: 28px 32px; }
          .btn { display: inline-block; background: #16a34a; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
          .stat { background: #f9fafb; border-left: 4px solid #16a34a; padding: 14px 16px; border-radius: 6px; margin: 12px 0; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
          .stat-value { font-size: 26px; font-weight: 700; color: #111827; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; padding: 20px 32px; border-top: 1px solid #f0f0f0; }
          .footer a { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🎯 ${title}</h1></div>
          <div class="content">${bodyHtml}</div>
          <div class="footer">
            <p>AdClone — clonagem inteligente de anúncios.<br/>
            Para ajustar quais emails recebe, acesse <strong>Configurações → Notificações</strong> no app.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://adclone-app.vercel.app';

/** Notifica o usuário que um novo clone foi gerado com sucesso. */
export async function sendCloneGeneratedEmail(
  to: string,
  data: { niche?: string; adUrl?: string }
): Promise<SendResult> {
  const niche = data.niche && data.niche !== 'geral' ? data.niche : null;
  const html = emailLayout(
    'Seu clone está pronto!',
    `
      <p>Boas notícias! Acabamos de gerar um novo clone de anúncio na sua conta — com 3 variações de copy e 3 imagens novas.</p>
      ${niche ? `<div class="stat"><div class="stat-label">Nicho detectado</div><div class="stat-value" style="font-size:18px;">${niche}</div></div>` : ''}
      <p>Acesse o painel para revisar, baixar e publicar.</p>
      <a class="btn" href="${APP_URL}/dashboard/history">Ver meus clones</a>
    `
  );
  return sendEmail(to, '🎯 Seu novo clone está pronto — AdClone', html);
}

/** Alerta o usuário que os créditos estão acabando. */
export async function sendLowCreditsEmail(
  to: string,
  data: { creditsRemaining: number }
): Promise<SendResult> {
  const html = emailLayout(
    'Seus créditos estão acabando',
    `
      <p>Você tem <strong>${data.creditsRemaining} ${data.creditsRemaining === 1 ? 'crédito' : 'créditos'}</strong> restante${data.creditsRemaining === 1 ? '' : 's'} no seu plano.</p>
      <p>Quando os créditos acabarem, você não conseguirá gerar novos clones. Faça upgrade para o plano <strong>PRO</strong> e tenha geração ilimitada.</p>
      <a class="btn" href="${APP_URL}/dashboard/billing">Assinar o PRO</a>
    `
  );
  return sendEmail(to, '⚠️ Seus créditos estão acabando — AdClone', html);
}

/** Envia o resumo semanal de uso ao usuário. */
export async function sendWeeklyDigestEmail(
  to: string,
  data: { totalClones: number; topNiches: string[]; periodLabel: string }
): Promise<SendResult> {
  const nichesHtml = data.topNiches.length
    ? `<div class="stat"><div class="stat-label">Nichos mais clonados</div><div class="stat-value" style="font-size:18px;">${data.topNiches.join(', ')}</div></div>`
    : '';
  const html = emailLayout(
    'Seu resumo semanal',
    `
      <p>Aqui está o resumo da sua semana no AdClone (${data.periodLabel}):</p>
      <div class="stat">
        <div class="stat-label">Clones gerados</div>
        <div class="stat-value">${data.totalClones}</div>
      </div>
      ${nichesHtml}
      <p>${data.totalClones > 0 ? 'Continue assim! 🚀' : 'Que tal clonar um anúncio vencedor essa semana?'}</p>
      <a class="btn" href="${APP_URL}/dashboard">Abrir o painel</a>
    `
  );
  return sendEmail(to, '📊 Seu resumo semanal — AdClone', html);
}

export interface DailyReportData {
  totalAnalyses: number;
  creditsConsumed: number;
  nichesBreakdown: { niche: string; count: number }[];
  activeUsers: number;
  topNiches: string[];
}

export async function sendDailyReport(adminEmail: string, data: DailyReportData) {
  const html = buildDailyReportHTML(data);

  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Email would be sent to:', adminEmail);
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `[AdClone] Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
      html,
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error('Error sending daily report:', error);
    return { success: false, error: String(error) };
  }
}

function buildDailyReportHTML(data: DailyReportData): string {
  const nichesHTML = data.nichesBreakdown
    .slice(0, 5)
    .map(
      (n) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${n.niche}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: right;">${n.count}</td>
        </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .metric { background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin-bottom: 15px; border-radius: 4px; }
          .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .metric-value { font-size: 28px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #667eea; font-weight: 600; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Relatório Diário - AdClone</h1>
            <p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="metric">
            <div class="metric-label">Total de Análises</div>
            <div class="metric-value">${data.totalAnalyses}</div>
          </div>

          <div class="metric">
            <div class="metric-label">Créditos Consumidos</div>
            <div class="metric-value">${data.creditsConsumed}</div>
          </div>

          <div class="metric">
            <div class="metric-label">Usuários Ativos</div>
            <div class="metric-value">${data.activeUsers}</div>
          </div>

          <h3 style="margin-top: 25px; margin-bottom: 10px;">Nichos Mais Populares</h3>
          <table>
            <thead>
              <tr>
                <th>Nicho</th>
                <th style="text-align: right;">Análises</th>
              </tr>
            </thead>
            <tbody>
              ${nichesHTML || '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #999;">Sem dados</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Este é um relatório automático do AdClone. Não responda a este email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
