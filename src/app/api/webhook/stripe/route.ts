import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// Usar Service Role Key no Backend (Admin) para ignorar RLS e forçar a liberação do acesso
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Quando o pagamento for bem sucedido...
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        const stripeCustomerId = session.customer as string;

        if (customerEmail) {
            console.log(`Pagamento de ${customerEmail} confirmado! Liberando acesso Supremo...`);

            // 1. Criar ou Atualizar Usuário na tabela `users_plan`
            // Aqui nós liberamos os "Tokens" do Spy Bot
            const { error } = await supabaseAdmin
                .from('users_plan')
                .upsert({
                    email: customerEmail,
                    stripe_customer_id: stripeCustomerId,
                    plan: 'pro',
                    tokens: 9999, // Ilimitado ou 100 dependendo do Upsell (lógica futura)
                    status: 'active'
                }, { onConflict: 'email' });

            if (error) {
                console.error("Erro no Supabase ao liberar acesso:", error);
                return NextResponse.json({ error: 'Erro ao liberar plano na DB.' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
