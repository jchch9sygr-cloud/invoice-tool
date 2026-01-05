// Script zum Prüfen der Datenbank vor Go-Live
// Ausführen mit: node scripts/check-database.js

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

async function checkDatabase() {
  console.log('🔍 DATENBANK-PRÜFUNG\n');
  console.log('='.repeat(60));

  try {
    // 1. Users prüfen
    const { data: users } = await supabase.auth.admin.listUsers();
    console.log(`\n👥 BENUTZER: ${users?.users?.length || 0}`);
    users?.users?.forEach(u => {
      console.log(`   - ${u.email} (${u.email_confirmed_at ? '✓ bestätigt' : '✗ unbestätigt'})`);
    });

    // 2. Profiles prüfen
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, company_name, allow_paid_invoice_deletion');

    console.log(`\n🏢 PROFILE: ${profiles?.length || 0}`);
    if (profileError) {
      console.log(`   ⚠️  Fehler: ${profileError.message}`);
      if (profileError.message.includes('allow_paid_invoice_deletion')) {
        console.log(`   ⚠️  MIGRATION BENÖTIGT: allow_paid_invoice_deletion Spalte fehlt!`);
      }
    } else {
      profiles?.forEach(p => {
        console.log(`   - ${p.company_name || 'Kein Name'}`);
      });
    }

    // 3. Subscriptions prüfen
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status, documents_count');

    console.log(`\n💳 SUBSCRIPTIONS: ${subs?.length || 0}`);
    subs?.forEach(s => {
      console.log(`   - Plan: ${s.plan}, Status: ${s.status}, Docs: ${s.documents_count}`);
    });

    // 4. Dokumente prüfen
    const { data: docs } = await supabase
      .from('documents')
      .select('id, type, number, status');

    console.log(`\n📄 DOKUMENTE: ${docs?.length || 0}`);
    const invoices = docs?.filter(d => d.type === 'invoice') || [];
    const quotes = docs?.filter(d => d.type === 'quote') || [];
    console.log(`   - Rechnungen: ${invoices.length}`);
    console.log(`   - Angebote: ${quotes.length}`);

    // 5. Kunden prüfen
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name');

    console.log(`\n👤 KUNDEN: ${customers?.length || 0}`);

    // 6. Line Items prüfen
    const { data: lineItems } = await supabase
      .from('line_items')
      .select('id');

    console.log(`\n📝 POSITIONEN: ${lineItems?.length || 0}`);

    // 7. Verwaiste Datensätze prüfen
    console.log('\n🔎 VERWAISTE DATENSÄTZE PRÜFEN...');

    // Profiles ohne User
    const profileUserIds = profiles?.map(p => p.user_id) || [];
    const userIds = users?.users?.map(u => u.id) || [];
    const orphanedProfiles = profileUserIds.filter(id => !userIds.includes(id));
    if (orphanedProfiles.length > 0) {
      console.log(`   ⚠️  ${orphanedProfiles.length} Profile ohne zugehörigen User`);
    } else {
      console.log(`   ✓ Keine verwaisten Profile`);
    }

    // Subscriptions ohne User
    const subUserIds = subs?.map(s => s.user_id) || [];
    const orphanedSubs = subUserIds.filter(id => !userIds.includes(id));
    if (orphanedSubs.length > 0) {
      console.log(`   ⚠️  ${orphanedSubs.length} Subscriptions ohne zugehörigen User`);
    } else {
      console.log(`   ✓ Keine verwaisten Subscriptions`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PRÜFUNG ABGESCHLOSSEN\n');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

checkDatabase();
