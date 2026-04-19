import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
      from: 'Spy Bot <onboarding@resend.dev>',
      to: adminEmail,
      subject: `[Spy Bot] Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
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
            <h1>📊 Relatório Diário - Spy Bot</h1>
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
            <p>Este é um relatório automático do Spy Bot. Não responda a este email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
