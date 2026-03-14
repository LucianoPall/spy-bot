const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrtsfhhutbneaxpuubra.supabase.co';
const supabaseServiceKey = '***REMOVED***';
const adminEmail = 'Lucianopelegrini27@gmail.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
    try {
        console.log('🔍 Procurando usuário:', adminEmail);

        // Buscar o usuário
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) {
            console.error('❌ Erro ao buscar usuários:', userError);
            process.exit(1);
        }

        const adminUser = users.find(u => u.email === adminEmail);

        if (!adminUser) {
            console.error('❌ Usuário não encontrado! Verifique o email:', adminEmail);
            process.exit(1);
        }

        console.log('✅ Usuário encontrado:', adminUser.id);

        // Atualizar ou criar subscription com plano PRO
        const { data, error } = await supabase
            .from('spybot_subscriptions')
            .upsert({
                user_id: adminUser.id,
                plan: 'pro',
                credits: 999, // Créditos ilimitados (999)
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Erro ao atualizar subscription:', error);
            process.exit(1);
        }

        console.log('✅ SUCESSO! Admin configurado com PRO ilimitado!');
        console.log('📊 Detalhes:', {
            email: adminEmail,
            userId: adminUser.id,
            plan: 'pro',
            credits: 999
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

setupAdmin();
