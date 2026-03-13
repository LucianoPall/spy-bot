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

    // Fetch all clones to calculate stats
    const { data: clones } = await supabase
      .from('spybot_generations')
      .select('id, niche, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!clones || clones.length === 0) {
      return NextResponse.json({
        totalClones: 0,
        distinctNiches: 0,
        firstCloneDate: null,
      });
    }

    // Calculate stats
    const totalClones = clones.length;
    const distinctNiches = new Set(clones.map(c => c.niche).filter(Boolean)).size;
    const firstCloneDate = clones[0]?.created_at || null;

    return NextResponse.json({
      totalClones,
      distinctNiches,
      firstCloneDate,
    });
  } catch (error) {
    console.error('Error fetching history stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history stats' },
      { status: 500 }
    );
  }
}
