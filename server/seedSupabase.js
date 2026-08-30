import 'dotenv/config';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { INITIAL_CENTRES, INITIAL_TOKENS, INITIAL_ANNOUNCEMENTS, MSP_CATALOG } from './seedData.js';

async function seedSupabase() {
  console.log('🚀 Starting Supabase Database Migration & Seeding...');

  if (!isSupabaseConfigured()) {
    console.error('❌ Error: Supabase credentials missing in .env file.');
    console.error('Please configure SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  try {
    // 1. Seed MSP Catalog
    console.log('📦 Seeding MSP Catalog...');
    const { error: mspErr } = await supabase.from('msp_catalog').upsert(MSP_CATALOG, { onConflict: 'id' });
    if (mspErr) console.warn('⚠️ MSP Catalog seed warning:', mspErr.message);
    else console.log('✅ MSP Catalog seeded successfully!');

    // 2. Seed Centres
    console.log('🏢 Seeding Procurement Centres...');
    const { error: centreErr } = await supabase.from('centres').upsert(INITIAL_CENTRES, { onConflict: 'id' });
    if (centreErr) console.warn('⚠️ Centres seed warning:', centreErr.message);
    else console.log(`✅ ${INITIAL_CENTRES.length} Centres seeded successfully!`);

    // 3. Seed Tokens
    console.log('🎟️  Seeding Initial Procurement Tokens...');
    const { error: tokenErr } = await supabase.from('tokens').upsert(INITIAL_TOKENS, { onConflict: 'tokenNumber' });
    if (tokenErr) console.warn('⚠️ Tokens seed warning:', tokenErr.message);
    else console.log(`✅ ${INITIAL_TOKENS.length} Tokens seeded successfully!`);

    // 4. Seed Announcements
    console.log('📢 Seeding Initial Announcements...');
    const { error: annErr } = await supabase.from('announcements').upsert(INITIAL_ANNOUNCEMENTS, { onConflict: 'id' });
    if (annErr) console.warn('⚠️ Announcements seed warning:', annErr.message);
    else console.log(`✅ ${INITIAL_ANNOUNCEMENTS.length} Announcements seeded successfully!`);

    console.log('\n🎉 Supabase Online Database Seeding Completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

seedSupabase();
