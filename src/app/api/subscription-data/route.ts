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

    // Fetch subscription data
    const { data: subscription } = await supabase
      .from('spybot_subscriptions')
      .select('credits_remaining, plan')
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      // Return default free plan values if no subscription exists
      return NextResponse.json({
        credits_remaining: 5,
        plan: 'free',
      });
    }

    return NextResponse.json({
      credits_remaining: subscription.credits_remaining || 5,
      plan: subscription.plan || 'free',
    });
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      {
        credits_remaining: 5,
        plan: 'free',
      },
      { status: 200 }
    );
  }
}
