import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDailyReport } from '@/services/email.service';
import { verifyInternalApiKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!verifyInternalApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!adminEmail || !supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing configuration (ADMIN_EMAIL, SUPABASE_URL or SERVICE_ROLE_KEY)' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get yesterday's date range (local timezone)
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const { data: generations, error: gensError } = await supabase
      .from('spybot_generations')
      .select('user_id, niche')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (gensError) {
      console.error('Error fetching generations:', JSON.stringify(gensError));
      return NextResponse.json(
        { error: 'Failed to fetch data', details: gensError.message ?? String(gensError) },
        { status: 500 }
      );
    }

    const rows = generations ?? [];
    const totalAnalyses = rows.length;

    const uniqueUserIds = new Set(rows.map((g) => g.user_id));
    const activeUsers = uniqueUserIds.size;

    const nichesMap = new Map<string, number>();
    for (const g of rows) {
      const niche = g.niche || 'geral';
      nichesMap.set(niche, (nichesMap.get(niche) ?? 0) + 1);
    }

    const nichesBreakdown = Array.from(nichesMap, ([niche, count]) => ({ niche, count })).sort(
      (a, b) => b.count - a.count
    );

    const topNiches = nichesBreakdown.slice(0, 5).map((n) => n.niche);

    // Credits consumed: count only analyses from users on gratis/trial plans
    // (pro/premium don't deduct credits — see billing.service.ts)
    let creditsConsumed = 0;
    if (activeUsers > 0) {
      const { data: subs } = await supabase
        .from('spybot_subscriptions')
        .select('user_id, plan')
        .in('user_id', Array.from(uniqueUserIds));

      const paidUserIds = new Set(
        (subs ?? [])
          .filter((s) => s.plan === 'pro' || s.plan === 'premium')
          .map((s) => s.user_id)
      );

      creditsConsumed = rows.filter((g) => !paidUserIds.has(g.user_id)).length;
    }

    const emailResult = await sendDailyReport(adminEmail, {
      totalAnalyses,
      creditsConsumed,
      nichesBreakdown,
      activeUsers,
      topNiches,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sent: true,
      stats: {
        totalAnalyses,
        creditsConsumed,
        activeUsers,
        topNiches,
        nichesBreakdown,
      },
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
