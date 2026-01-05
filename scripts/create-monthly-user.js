// Script zum Erstellen eines Monthly-Abo-Users
// Ausführen mit: node scripts/create-monthly-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehler: SUPABASE_SERVICE_ROLE_KEY nicht in .env.local gefunden');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'abo@rechnungsblitz.de';
const TEST_PASSWORD = 'Abo12345!';

async function createMonthlyUser() {
  console.log('🚀 Erstelle Monthly-Abo-User...\n');

  try {
    // 1. User erstellen
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    let userId;

    if (userError) {
      if (userError.message.includes('already been registered')) {
        console.log('ℹ️  User existiert bereits. Aktualisiere auf Monthly...');

        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === TEST_EMAIL);

        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(userId, {
            password: TEST_PASSWORD
          });

          // Subscription auf Monthly updaten
          await supabase
            .from('subscriptions')
            .update({
              plan: 'monthly',
              status: 'active',
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 Tage
            })
            .eq('user_id', userId);

          console.log('✅ Auf Monthly aktualisiert!');
        }
      } else {
        throw userError;
      }
    } else {
      userId = user.user.id;
      console.log('✅ User erstellt!');

      // 2. Profil erstellen
      await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          company_name: 'Abo Consulting',
          address: 'Abostraße 10',
          zip: '80331',
          city: 'München',
          phone: '+49 89 123456',
          email: TEST_EMAIL,
          tax_number: 'DE111222333',
          is_kleinunternehmer: false,
          bank_name: 'Sparkasse',
          iban: 'DE89 7007 0024 0123 4567 89',
          bic: 'HYVEDEMMXXX',
        });
      console.log('✅ Profil erstellt!');

      // 3. Monthly Subscription erstellen
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'monthly',
          status: 'active',
          documents_count: 0,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 Tage
        });
      console.log('✅ Monthly Subscription erstellt!');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 MONTHLY-ABO-USER BEREIT!\n');
    console.log(`   E-Mail:    ${TEST_EMAIL}`);
    console.log(`   Passwort:  ${TEST_PASSWORD}`);
    console.log(`   Plan:      MONTHLY (10€/Monat)`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

createMonthlyUser();
