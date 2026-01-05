// Script zum Reparieren der Test-Accounts (Profile + Subscriptions hinzufügen)
// Ausführen mit: node scripts/fix-test-accounts.js

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

const TEST_ACCOUNTS = [
  {
    email: 'pro@rechnungsblitz.de',
    password: 'Pro12345!',
    profile: {
      company_name: 'Pro Business GmbH',
      address: 'Profistraße 1',
      zip: '10115',
      city: 'Berlin',
      phone: '+49 30 123456',
      tax_number: 'DE123456789',
      is_kleinunternehmer: false,
      bank_name: 'Deutsche Bank',
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'COBADEFFXXX',
    },
    subscription: {
      plan: 'lifetime',
      status: 'active',
      documents_count: 0,
      current_period_end: null, // Lifetime hat kein Ende
    }
  },
  {
    email: 'abo@rechnungsblitz.de',
    password: 'Abo12345!',
    profile: {
      company_name: 'Abo Consulting',
      address: 'Abostraße 10',
      zip: '80331',
      city: 'München',
      phone: '+49 89 123456',
      tax_number: 'DE111222333',
      is_kleinunternehmer: false,
      bank_name: 'Sparkasse',
      iban: 'DE89 7007 0024 0123 4567 89',
      bic: 'HYVEDEMMXXX',
    },
    subscription: {
      plan: 'monthly',
      status: 'active',
      documents_count: 0,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
];

async function fixTestAccounts() {
  console.log('🔧 REPARIERE TEST-ACCOUNTS\n');

  try {
    const { data: users } = await supabase.auth.admin.listUsers();

    for (const account of TEST_ACCOUNTS) {
      console.log(`\n📧 ${account.email}`);
      console.log('─'.repeat(40));

      const user = users?.users?.find(u => u.email === account.email);

      if (!user) {
        console.log('   ⚠️  User nicht gefunden, übersprungen');
        continue;
      }

      const userId = user.id;
      console.log(`   User-ID: ${userId}`);

      // Passwort aktualisieren
      await supabase.auth.admin.updateUserById(userId, {
        password: account.password
      });
      console.log(`   ✓ Passwort gesetzt: ${account.password}`);

      // Profile prüfen/erstellen
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ ...account.profile, email: account.email })
          .eq('user_id', userId);
        console.log('   ✓ Profil aktualisiert');
      } else {
        await supabase
          .from('profiles')
          .insert({ user_id: userId, email: account.email, ...account.profile });
        console.log('   ✓ Profil erstellt');
      }

      // Subscription prüfen/erstellen
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (existingSub) {
        await supabase
          .from('subscriptions')
          .update(account.subscription)
          .eq('user_id', userId);
        console.log(`   ✓ Subscription aktualisiert → ${account.subscription.plan.toUpperCase()}`);
      } else {
        await supabase
          .from('subscriptions')
          .insert({ user_id: userId, ...account.subscription });
        console.log(`   ✓ Subscription erstellt → ${account.subscription.plan.toUpperCase()}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST-ACCOUNTS REPARIERT!\n');
    console.log('Login-Daten:');
    console.log('─'.repeat(50));
    console.log('📌 LIFETIME: pro@rechnungsblitz.de / Pro12345!');
    console.log('📌 MONTHLY:  abo@rechnungsblitz.de / Abo12345!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

fixTestAccounts();
