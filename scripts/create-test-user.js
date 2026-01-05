// Script zum Erstellen eines Testusers
// Ausführen mit: node scripts/create-test-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehler: SUPABASE_SERVICE_ROLE_KEY nicht in .env.local gefunden');
  console.log('\nBitte füge SUPABASE_SERVICE_ROLE_KEY zu .env.local hinzu.');
  console.log('Du findest den Key im Supabase Dashboard unter:');
  console.log('Settings → API → service_role (secret)\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'test@rechnungsblitz.de';
const TEST_PASSWORD = 'Test1234!';

async function createTestUser() {
  console.log('🚀 Erstelle Testuser...\n');

  try {
    // 1. User erstellen
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true, // E-Mail direkt bestätigen
    });

    if (userError) {
      if (userError.message.includes('already been registered')) {
        console.log('ℹ️  User existiert bereits. Versuche Passwort zu aktualisieren...');

        // User-ID finden
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === TEST_EMAIL);

        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: TEST_PASSWORD
          });
          console.log('✅ Passwort aktualisiert!\n');
        }
      } else {
        throw userError;
      }
    } else {
      console.log('✅ User erstellt!');

      // 2. Profil erstellen
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.user.id,
          company_name: 'Test GmbH',
          address: 'Teststraße 123',
          zip: '12345',
          city: 'Berlin',
          phone: '+49 30 123456',
          email: TEST_EMAIL,
          tax_number: 'DE123456789',
          is_kleinunternehmer: false,
          bank_name: 'Test Bank',
          iban: 'DE89 3704 0044 0532 0130 00',
          bic: 'COBADEFFXXX',
        });

      if (profileError && !profileError.message.includes('duplicate')) {
        console.warn('⚠️  Profil-Erstellung:', profileError.message);
      } else {
        console.log('✅ Profil erstellt!');
      }

      // 3. Subscription erstellen (Free Plan)
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.user.id,
          plan: 'free',
          status: 'active',
          documents_count: 0,
        });

      if (subError && !subError.message.includes('duplicate')) {
        console.warn('⚠️  Subscription-Erstellung:', subError.message);
      } else {
        console.log('✅ Subscription erstellt!');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 TESTUSER BEREIT!\n');
    console.log(`   E-Mail:    ${TEST_EMAIL}`);
    console.log(`   Passwort:  ${TEST_PASSWORD}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

createTestUser();
