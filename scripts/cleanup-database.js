/**
 * Cleanup Script - Bereinigt alle Testdaten vor dem Live-Gang
 *
 * WARNUNG: Dieses Script löscht ALLE Daten in der Datenbank!
 * Nur in der Entwicklungsumgebung oder vor dem Live-Gang verwenden.
 *
 * Verwendung: node scripts/cleanup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehler: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanup() {
  console.log('🧹 Starte Datenbank-Bereinigung...\n');

  try {
    // 1. Line Items löschen (Foreign Key zu documents)
    console.log('📄 Lösche Line Items...');
    const { error: lineItemsError, count: lineItemsCount } = await supabase
      .from('line_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Löscht alle
      .select('*', { count: 'exact', head: true });

    if (lineItemsError) {
      console.log('   ⚠️  Line Items Fehler:', lineItemsError.message);
    } else {
      console.log('   ✅ Line Items gelöscht');
    }

    // 2. Documents löschen (Foreign Key zu customers)
    console.log('📑 Lösche Dokumente (Rechnungen & Angebote)...');
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (documentsError) {
      console.log('   ⚠️  Dokumente Fehler:', documentsError.message);
    } else {
      console.log('   ✅ Dokumente gelöscht');
    }

    // 3. Customers löschen
    console.log('👥 Lösche Kunden...');
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (customersError) {
      console.log('   ⚠️  Kunden Fehler:', customersError.message);
    } else {
      console.log('   ✅ Kunden gelöscht');
    }

    // 4. Subscriptions löschen
    console.log('💳 Lösche Subscriptions...');
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (subscriptionsError) {
      console.log('   ⚠️  Subscriptions Fehler:', subscriptionsError.message);
    } else {
      console.log('   ✅ Subscriptions gelöscht');
    }

    // 5. Profiles löschen
    console.log('👤 Lösche Profile...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (profilesError) {
      console.log('   ⚠️  Profile Fehler:', profilesError.message);
    } else {
      console.log('   ✅ Profile gelöscht');
    }

    // 6. Auth Users löschen
    console.log('🔐 Lösche Auth Users...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.log('   ⚠️  Users auflisten Fehler:', listError.message);
    } else if (users && users.users.length > 0) {
      let deletedCount = 0;
      for (const user of users.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.log(`   ⚠️  User ${user.email} Fehler:`, deleteError.message);
        } else {
          deletedCount++;
        }
      }
      console.log(`   ✅ ${deletedCount} Auth Users gelöscht`);
    } else {
      console.log('   ℹ️  Keine Auth Users vorhanden');
    }

    // 7. Storage bereinigen (Logos, Signaturen)
    console.log('🗂️  Lösche Storage Dateien...');
    try {
      // Logos Bucket
      const { data: logoFiles } = await supabase.storage.from('logos').list();
      if (logoFiles && logoFiles.length > 0) {
        const logoPaths = logoFiles.map(f => f.name);
        await supabase.storage.from('logos').remove(logoPaths);
        console.log(`   ✅ ${logoFiles.length} Logo-Dateien gelöscht`);
      } else {
        console.log('   ℹ️  Keine Logo-Dateien vorhanden');
      }

      // Signatures Bucket
      const { data: sigFiles } = await supabase.storage.from('signatures').list();
      if (sigFiles && sigFiles.length > 0) {
        const sigPaths = sigFiles.map(f => f.name);
        await supabase.storage.from('signatures').remove(sigPaths);
        console.log(`   ✅ ${sigFiles.length} Signatur-Dateien gelöscht`);
      } else {
        console.log('   ℹ️  Keine Signatur-Dateien vorhanden');
      }
    } catch (storageError) {
      console.log('   ⚠️  Storage Fehler:', storageError.message);
    }

    console.log('\n✨ Bereinigung abgeschlossen!\n');
    console.log('📋 Nächste Schritte:');
    console.log('   1. Supabase Dashboard prüfen');
    console.log('   2. Neue API Keys generieren (falls gewünscht)');
    console.log('   3. .env.local mit neuen Keys aktualisieren');
    console.log('   4. Stripe Keys auf Live-Modus umstellen');
    console.log('   5. git push origin main');
    console.log('');

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    process.exit(1);
  }
}

// Sicherheitsabfrage
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n⚠️  WARNUNG: Dieses Script löscht ALLE Daten in der Datenbank!');
console.log('   - Alle Benutzer');
console.log('   - Alle Rechnungen & Angebote');
console.log('   - Alle Kunden');
console.log('   - Alle Subscriptions');
console.log('   - Alle hochgeladenen Dateien\n');

rl.question('Bist du sicher? Tippe "LÖSCHEN" zum Bestätigen: ', async (answer) => {
  if (answer === 'LÖSCHEN') {
    await cleanup();
  } else {
    console.log('\n❌ Abgebrochen. Keine Daten wurden gelöscht.\n');
  }
  rl.close();
  process.exit(0);
});
