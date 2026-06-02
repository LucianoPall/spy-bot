import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWeeklyDigestEmail } from '@/services/email.service';
import { verifyInternalApiKey } from '@/lib/internal-auth';
import { getNotificationPrefs } from '@/lib/notification-prefs';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface UserActivity {
  count: number;
  niches: Map<string, number>;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyInternalApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing configuration (SUPABASE_URL or SERVICE_ROLE_KEY)' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Janela: últimos 7 dias.
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const periodLabel = `${formatDate(weekAgo)} a ${formatDate(now)}`;

    // 1. Buscar todas as gerações da semana e agrupar por usuário.
    const { data: generations, error: gensError } = await supabase
      .from('spybot_generations')
      .select('user_id, niche')
      .gte('created_at', weekAgo.toISOString())
      .lt('created_at', now.toISOString());

    if (gensError) {
      console.error('Weekly digest: error fetching generations:', JSON.stringify(gensError));
      return NextResponse.json(
        { error: 'Failed to fetch data', details: gensError.message ?? String(gensError) },
        { status: 500 }
      );
    }

    const activityByUser = new Map<string, UserActivity>();
    for (const g of generations ?? []) {
      if (!g.user_id) continue;
      const entry = activityByUser.get(g.user_id) ?? { count: 0, niches: new Map() };
      entry.count += 1;
      const niche = g.niche && g.niche !== 'geral' ? g.niche : null;
      if (niche) entry.niches.set(niche, (entry.niches.get(niche) ?? 0) + 1);
      activityByUser.set(g.user_id, entry);
    }

    // 2. Paginar usuários e enviar o digest para quem optou e teve atividade.
    let sent = 0;
    let skippedNoPref = 0;
    let failed = 0;
    let page = 1;
    const perPage = 200;

    for (;;) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (usersError) {
        console.error('Weekly digest: error listing users:', usersError.message);
        break;
      }

      const users = usersData?.users ?? [];
      for (const user of users) {
        const activity = activityByUser.get(user.id);
        if (!activity || activity.count === 0) continue; // sem atividade na semana

        const prefs = getNotificationPrefs(user.user_metadata);
        if (!prefs.weeklyDigest || !user.email) {
          skippedNoPref += 1;
          continue;
        }

        const topNiches = Array.from(activity.niches.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([n]) => n);

        const result = await sendWeeklyDigestEmail(user.email, {
          totalClones: activity.count,
          topNiches,
          periodLabel,
        });

        if (result.success) sent += 1;
        else failed += 1;
      }

      if (users.length < perPage) break;
      page += 1;
    }

    return NextResponse.json({
      ok: true,
      period: periodLabel,
      activeUsers: activityByUser.size,
      emailsSent: sent,
      skippedNoPref,
      failed,
    });
  } catch (error) {
    console.error('Weekly digest error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
