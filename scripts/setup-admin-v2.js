const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrtsfhhutbneaxpuubra.supabase.co';
const supabaseServiceKey = '***REMOVED***';
const adminEmail = 'Lucianopelegrini27@gmail.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
    try {
        console.log('🔍 Buscando usuários na tabela auth.users...');

        // Buscar usuários diretamente da tabela auth.users
        const { data: users, error: queryError } = await supabase
            .from('auth.users')
            .select('id, email')
            .eq('email', adminEmail);

        if (queryError) {
            console.log('❌ Erro ao buscar na tabela auth.users:', queryError.message);
            console.log('⚠️ Tentando alternativa...');

            // Se falhar, vamos tentar procurando em spybot_subscriptions
            const { data: subs, error: subError } = await supabase
                .from('spybot_subscriptions')
                .select('user_id, email')
                .like('email', `%${adminEmail.split('@')[0]}%`);

            if (subError || !subs || subs.length === 0) {
                console.error('❌ Usuário ainda não existe no banco de dados.');
                console.log('📝 Por favor, siga estes passos:');
                console.log('1. Acesse http://localhost:3000/login');
                console.log('2. Clique em "Criar conta aqui"');
                console.log('3. Preencha com o email: ' + adminEmail);
                console.log('4. Crie uma conta e faça login');
                console.log('5. Clique em "Clonar Agora" com uma URL de anúncio');
                console.log('6. Depois rode este script novamente!');
                process.exit(1);
            }

            console.log('✅ Encontrado em spybot_subscriptions');
            const userId = subs[0].user_id;

            // Atualizar subscription
            const { error: updateError } = await supabase
                .from('spybot_subscriptions')
                .update({
                    plan: 'pro',
                    credits: 999,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            console.log('✅ SUCESSO! Admin configurado com PRO ilimitado!');
            console.log('📊 Detalhes:', {
                email: adminEmail,
                userId,
                plan: 'pro',
                credits: 999
            });
            process.exit(0);
        }

        if (!users || users.length === 0) {
            console.error('❌ Usuário não encontrado no Supabase!');
            console.log('📝 Verifique se o email está correto: ' + adminEmail);
            process.exit(1);
        }

        const userId = users[0].id;
        console.log('✅ Usuário encontrado:', userId);

        // Atualizar ou criar subscription
        const { data, error } = await supabase
            .from('spybot_subscriptions')
            .upsert({
                user_id: userId,
                plan: 'pro',
                credits: 999,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Erro ao atualizar subscription:', error);
            process.exit(1);
        }

        console.log('✅ SUCESSO! Admin configurado com PRO ilimitado!');
        console.log('📊 Detalhes:', {
            email: adminEmail,
            userId,
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
