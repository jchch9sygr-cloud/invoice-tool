// Script zum Bereinigen von Test-/unbestätigten Usern
// Ausführen mit: node scripts/cleanup-users.js

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

// User die gelöscht werden sollen
const USERS_TO_DELETE = [
  'm_sukut@outlook.com',      // unbestätigt
  'test@rechnungsblitz.de',   // alter Test-User
  'monthly@rechnungsblitz.de' // alter Test-User (ersetzt durch abo@)
];

async function cleanupUsers() {
  console.log('🧹 BEREINIGUNG STARTEN\n');
  console.log('Zu löschende User:');
  USERS_TO_DELETE.forEach(email => console.log(`   - ${email}`));
  console.log('');

  try {
    const { data: users } = await supabase.auth.admin.listUsers();

    for (const email of USERS_TO_DELETE) {
      const user = users?.users?.find(u => u.email === email);

      if (!user) {
        console.log(`⏭️  ${email} - nicht gefunden, übersprungen`);
        continue;
      }

      const userId = user.id;
      console.log(`\n🗑️  Lösche ${email}...`);

      // 1. Line Items der Dokumente löschen
      const { data: docs } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', userId);

      if (docs && docs.length > 0) {
        const docIds = docs.map(d => d.id);
        await supabase
          .from('line_items')
          .delete()
          .in('document_id', docIds);
        console.log(`   ✓ ${docs.length} Dokument-Positionen gelöscht`);
      }

      // 2. Dokumente löschen
      const { error: docsError } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', userId);
      if (!docsError) console.log('   ✓ Dokumente gelöscht');

      // 3. Kunden löschen
      const { error: customersError } = await supabase
        .from('customers')
        .delete()
        .eq('user_id', userId);
      if (!customersError) console.log('   ✓ Kunden gelöscht');

      // 4. Subscription löschen
      const { error: subError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);
      if (!subError) console.log('   ✓ Subscription gelöscht');

      // 5. Profil löschen
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      if (!profileError) console.log('   ✓ Profil gelöscht');

      // 6. Auth User löschen
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (!authError) {
        console.log('   ✓ Auth-User gelöscht');
      } else {
        console.log(`   ⚠️ Auth-User Fehler: ${authError.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ BEREINIGUNG ABGESCHLOSSEN\n');

    // Verbleibende User anzeigen
    const { data: remainingUsers } = await supabase.auth.admin.listUsers();
    console.log('Verbleibende User:');
    remainingUsers?.users?.forEach(u => {
      console.log(`   - ${u.email}`);
    });

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

cleanupUsers();
