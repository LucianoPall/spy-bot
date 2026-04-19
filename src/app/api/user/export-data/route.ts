import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Coletar todos os dados do usuário (LGPD - direito de acesso)
    const [subscriptionResult, generationsResult, profileResult] = await Promise.all([
      supabase
        .from('spybot_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('spybot_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('spybot_brand_profile')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      subscription: subscriptionResult.data || null,
      brandProfile: profileResult.data || null,
      generations: generationsResult.data || [],
      totalGenerations: generationsResult.data?.length || 0,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="spybot-dados-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
