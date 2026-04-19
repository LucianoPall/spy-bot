import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
    apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_role_key'
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
        const errorMessage = (err as { message?: string } | undefined)?.message || String(err);
        console.error(`Webhook Error: ${errorMessage}`);
        return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        const metadata = session.metadata || {};
        const planType = metadata.plan_type || 'trial'; // 'trial' ou 'pro'

        if (customerEmail) {
            console.log(`Pagamento de ${customerEmail} confirmado! Plano: ${planType}`);

            // Buscar user_id pelo email no Supabase Auth
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const user = users?.users?.find(u => u.email === customerEmail);

            if (user) {
                if (planType === 'pro') {
                    // Plano Pro: R$99/mês — Ilimitado
                    const { error } = await supabaseAdmin
                        .from('spybot_subscriptions')
                        .upsert({
                            user_id: user.id,
                            plan: 'pro',
                            credits: 9999,
                            created_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });

                    if (error) {
                        console.error("Erro ao liberar plano Pro:", error);
                        return NextResponse.json({ error: 'Erro ao liberar plano.' }, { status: 500 });
                    }
                } else {
                    // Plano Starter/Trial: R$47 — 25 créditos
                    const { data: existing } = await supabaseAdmin
                        .from('spybot_subscriptions')
                        .select('credits')
                        .eq('user_id', user.id)
                        .single();

                    const currentCredits = existing?.credits || 0;

                    const { error } = await supabaseAdmin
                        .from('spybot_subscriptions')
                        .upsert({
                            user_id: user.id,
                            plan: 'trial',
                            credits: currentCredits + 25,
                            created_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });

                    if (error) {
                        console.error("Erro ao liberar plano Starter:", error);
                        return NextResponse.json({ error: 'Erro ao liberar plano.' }, { status: 500 });
                    }
                }

                console.log(`Plano ${planType} ativado para ${customerEmail} (${user.id})`);
            } else {
                console.warn(`Usuário não encontrado no Auth: ${customerEmail}`);
            }
        }
    }

    // Quando assinatura Pro é cancelada
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        // Buscar email do customer no Stripe
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer && !customer.deleted && customer.email) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const user = users?.users?.find(u => u.email === customer.email);

            if (user) {
                await supabaseAdmin
                    .from('spybot_subscriptions')
                    .update({ plan: 'gratis', credits: 0 })
                    .eq('user_id', user.id);

                console.log(`Assinatura cancelada para ${customer.email} — plano revertido para gratis`);
            }
        }
    }

    return NextResponse.json({ received: true });
}
