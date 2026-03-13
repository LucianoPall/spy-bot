import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch credits from subscriptions table
    const { data: subscription } = await supabase
      .from('spybot_subscriptions')
      .select('credits_remaining, plan')
      .eq('user_id', user.id)
      .single();

    // Fetch total clones count
    const { count: totalClones } = await supabase
      .from('spybot_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const credits = subscription?.credits_remaining ?? 0;
    const clones = totalClones ?? 0;

    return NextResponse.json({
      credits,
      totalClones: clones,
      niche: 'Não configurado',
    });
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}
