import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function getDateRange(period: string): string | null {
  const now = new Date();

  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.toISOString();
    }
    case 'yesterday': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return start.toISOString();
    }
    case '7d': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return start.toISOString();
    }
    case '30d': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return start.toISOString();
    }
    default:
      return null; // "all" — sem filtro
  }
}

function getDateEnd(period: string): string | null {
  if (period !== 'yesterday') return null;
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return end.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const period = request.nextUrl.searchParams.get('period') || 'all';
    const dateFrom = getDateRange(period);
    const dateTo = getDateEnd(period);

    // Buscar subscriptions (filtrado por período se aplicável)
    let subsQuery = supabase.from('spybot_subscriptions').select('*', { count: 'exact' });
    if (dateFrom) subsQuery = subsQuery.gte('created_at', dateFrom);
    if (dateTo) subsQuery = subsQuery.lt('created_at', dateTo);
    const { data: subscriptions, count: totalSubscriptions } = await subsQuery;

    // Buscar gerações (filtrado por período)
    let gensQuery = supabase.from('spybot_generations').select('*', { count: 'exact', head: true });
    if (dateFrom) gensQuery = gensQuery.gte('created_at', dateFrom);
    if (dateTo) gensQuery = gensQuery.lt('created_at', dateTo);
    const { count: totalGenerations } = await gensQuery;

    // Calcular MRR (sempre sobre todos os subs ativos, independente do filtro)
    const { data: allSubs } = await supabase.from('spybot_subscriptions').select('plan');
    const allSubsList = allSubs || [];
    const proCount = allSubsList.filter(s => s.plan === 'pro' || s.plan === 'premium').length;
    const trialCount = allSubsList.filter(s => s.plan === 'trial').length;
    const mrr = (proCount * 99) + (trialCount * 47);

    // Montar lista de usuários do período
    const subs = subscriptions || [];
    const users = await Promise.all(
      subs.map(async (sub) => {
        let userGensQuery = supabase
          .from('spybot_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', sub.user_id);
        if (dateFrom) userGensQuery = userGensQuery.gte('created_at', dateFrom);
        if (dateTo) userGensQuery = userGensQuery.lt('created_at', dateTo);
        const { count: userGenerations } = await userGensQuery;

        const plan = sub.plan || 'gratis';
        const currentCredits = sub.credits ?? 0;
        const initialCredits = plan === 'pro' || plan === 'premium' ? -1 : plan === 'trial' ? 25 : 5;
        const creditsUsed = initialCredits === -1 ? 0 : Math.max(0, initialCredits - currentCredits);

        return {
          userId: sub.user_id,
          plan,
          credits: currentCredits,
          initialCredits,
          creditsUsed,
          generations: userGenerations ?? 0,
          createdAt: sub.created_at,
        };
      })
    );

    const filteredProCount = subs.filter(s => s.plan === 'pro' || s.plan === 'premium').length;
    const filteredTrialCount = subs.filter(s => s.plan === 'trial').length;
    const filteredGratisCount = subs.filter(s => s.plan === 'gratis' || !s.plan).length;

    return NextResponse.json({
      period,
      totalUsers: totalSubscriptions ?? 0,
      totalGenerations: totalGenerations ?? 0,
      mrr,
      proCount: filteredProCount,
      trialCount: filteredTrialCount,
      gratisCount: filteredGratisCount,
      users,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
