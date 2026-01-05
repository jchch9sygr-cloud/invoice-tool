// Script zum Erstellen eines Lifetime-Users
// Ausführen mit: node scripts/create-lifetime-user.js

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

const TEST_EMAIL = 'pro@rechnungsblitz.de';
const TEST_PASSWORD = 'Pro1234!';

async function createLifetimeUser() {
  console.log('🚀 Erstelle Lifetime-User...\n');

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
        console.log('ℹ️  User existiert bereits. Aktualisiere auf Lifetime...');

        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === TEST_EMAIL);

        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(userId, {
            password: TEST_PASSWORD
          });

          // Subscription auf Lifetime updaten
          await supabase
            .from('subscriptions')
            .update({
              plan: 'lifetime',
              status: 'active',
            })
            .eq('user_id', userId);

          console.log('✅ Auf Lifetime aktualisiert!');
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
          company_name: 'Pro Company GmbH',
          address: 'Hauptstraße 1',
          zip: '10115',
          city: 'Berlin',
          phone: '+49 30 987654',
          email: TEST_EMAIL,
          tax_number: 'DE987654321',
          is_kleinunternehmer: false,
          bank_name: 'Deutsche Bank',
          iban: 'DE89 3704 0044 0532 0130 00',
          bic: 'DEUTDEDB',
        });
      console.log('✅ Profil erstellt!');

      // 3. Lifetime Subscription erstellen
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'lifetime',
          status: 'active',
          documents_count: 0,
        });
      console.log('✅ Lifetime Subscription erstellt!');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 LIFETIME-USER BEREIT!\n');
    console.log(`   E-Mail:    ${TEST_EMAIL}`);
    console.log(`   Passwort:  ${TEST_PASSWORD}`);
    console.log(`   Plan:      LIFETIME (unbegrenzt)`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

createLifetimeUser();
