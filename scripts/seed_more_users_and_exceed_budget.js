import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://feykljceqezgpjbexnij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleWtsamNlcWV6Z3BqYmV4bmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTg4NTksImV4cCI6MjEwNzMzNDg1OX0.mdKgLtn6NoWEy6jjjEyD4G2MMCzigHx9aqubJ25EVbA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AARAV_USER_ID = 'cc044a3e-f132-470f-948a-c3248c9f45f3'; // demo.traveler2026@gmail.com
const ANEESH_USER_ID = 'bc4fa98a-d0e4-4704-ba50-d36c1f7bfbd6'; // aneesh.suvarna24@spit.ac.in
const BHAVNA_USER_ID = 'b1111111-2222-3333-4444-555555555555'; // bhavna.patel@gmail.com
const CHIRAG_USER_ID = 'c1111111-2222-3333-4444-555555555555'; // chirag.verma@gmail.com
const PRIYA_USER_ID  = 'd2222222-2222-3333-4444-555555555555'; // priya.nair@gmail.com

const TRIP_IDS = [
  'd1111111-2222-3333-4444-555555555555', // Incredible Rajasthan & Golden Triangle Heritage Tour
  '5db12b8f-1fb4-4e33-9c88-445cf6650a73', // Trip to All India
];

async function run() {
  console.log('--- 1. ENSURING ALL 5 USERS IN PUBLIC.USERS ---');
  const allUsers = [
    {
      id: AARAV_USER_ID,
      email: 'demo.traveler2026@gmail.com',
      display_name: 'Aarav Sharma (Organizer)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      id: ANEESH_USER_ID,
      email: 'aneesh.suvarna24@spit.ac.in',
      display_name: 'Aneesh Suvarna',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    {
      id: BHAVNA_USER_ID,
      email: 'bhavna.patel@gmail.com',
      display_name: 'Bhavna Patel',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
    {
      id: CHIRAG_USER_ID,
      email: 'chirag.verma@gmail.com',
      display_name: 'Chirag Verma',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: PRIYA_USER_ID,
      email: 'priya.nair@gmail.com',
      display_name: 'Priya Nair',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  ];

  for (const u of allUsers) {
    const { error: uErr } = await supabase.from('users').upsert(u);
    if (uErr) console.warn('User upsert warning:', uErr.message);
  }
  console.log('✅ Ensured 5 users in database.');

  for (const tripId of TRIP_IDS) {
    console.log(`\n--- 2. UPDATING TRIP ${tripId} ---`);
    // Ensure budget is 45000
    await supabase.from('trips').update({ budget: 45000 }).eq('id', tripId);

    // Ensure all 5 members in trip_members
    await supabase.from('trip_members').delete().eq('trip_id', tripId);
    const membersToInsert = [
      { id: crypto.randomUUID(), trip_id: tripId, user_id: AARAV_USER_ID, role: 'organizer', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: ANEESH_USER_ID, role: 'member', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: BHAVNA_USER_ID, role: 'member', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: CHIRAG_USER_ID, role: 'member', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: PRIYA_USER_ID, role: 'member', status: 'accepted' },
    ];
    const { error: memErr } = await supabase.from('trip_members').insert(membersToInsert);
    if (memErr) console.error('Member insert error:', memErr);
    else console.log(`✅ Inserted ${membersToInsert.length} members into trip_members.`);

    // Seed 12 actual expenses totaling exactly ₹56,600 (exceeding ₹45,000 by ₹11,600)
    await supabase.from('trip_expenses').delete().eq('trip_id', tripId);
    const expenses = [
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: AARAV_USER_ID,
        category: 'food',
        amount: 4200,
        date: '2026-11-01',
        description: 'Bukhara & Karim’s Heritage Dinner in Old Delhi',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: ANEESH_USER_ID,
        category: 'transport',
        amount: 1850,
        date: '2026-11-03',
        description: 'Vande Bharat Express (Executive Class, Delhi to Jaipur)',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: AARAV_USER_ID,
        category: 'sightseeing',
        amount: 2400,
        date: '2026-11-04',
        description: 'Amber Fort Elephant Sanctuary & Guided Royal Tour',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: BHAVNA_USER_ID,
        category: 'stay',
        amount: 9600,
        date: '2026-11-03',
        description: 'Zostel Plus & Heritage Haveli Stay (Jaipur)',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: CHIRAG_USER_ID,
        category: 'food',
        amount: 3100,
        date: '2026-11-04',
        description: 'Chokhi Dhani Traditional Rajasthani Thali & Folk Show',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: PRIYA_USER_ID,
        category: 'shopping',
        amount: 5500,
        date: '2026-11-05',
        description: 'Jaipur Blue Pottery & Johari Bazaar Handicrafts',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: AARAV_USER_ID,
        category: 'sightseeing',
        amount: 2200,
        date: '2026-11-06',
        description: 'Lake Pichola Sunset Boat Cruise & Jag Mandir Island',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: ANEESH_USER_ID,
        category: 'transport',
        amount: 1600,
        date: '2026-11-08',
        description: 'Pre-paid Airport Cab (Udaipur Hotel to Airport)',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: BHAVNA_USER_ID,
        category: 'stay',
        amount: 14500,
        date: '2026-11-05',
        description: 'Taj Lake Palace Luxury Suite Accommodation',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: CHIRAG_USER_ID,
        category: 'stay',
        amount: 5600,
        date: '2026-11-03',
        description: 'Jaipur Boutique Heritage Stay Upgrade',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: PRIYA_USER_ID,
        category: 'transport',
        amount: 4200,
        date: '2026-11-08',
        description: 'IndiGo Flight Transit (Udaipur to Mumbai)',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: AARAV_USER_ID,
        category: 'transport',
        amount: 1850,
        date: '2026-11-03',
        description: 'Return Executive Train Transit (Jaipur to Delhi)',
      },
    ];

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const { error: expErr } = await supabase.from('trip_expenses').insert(expenses);
    if (expErr) console.error('Expenses error:', expErr);
    else console.log(`✅ Inserted ${expenses.length} actual expenses (Total ₹${totalExp} vs Budget ₹45,000 -> Exceeded by ₹${totalExp - 45000}).`);

    // Seed 5 shared expenses split among all 5 users
    await supabase.from('shared_expenses').delete().eq('trip_id', tripId);
    const sharedExpenses = [
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: AARAV_USER_ID,
        title: 'Chokhi Dhani Royal Group Dinner',
        amount: 5000,
        category: 'food',
        split_method: 'equal',
        date: '2026-11-04',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: ANEESH_USER_ID,
        title: 'Innova Crysta Highway Cab (Jaipur to Udaipur)',
        amount: 7500,
        category: 'transport',
        split_method: 'equal',
        date: '2026-11-05',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: AARAV_USER_ID,
        title: 'Lake Pichola Private Sunset Boat Charter',
        amount: 4000,
        category: 'activities',
        split_method: 'equal',
        date: '2026-11-06',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: BHAVNA_USER_ID,
        title: 'Udaipur Cultural Show & Heritage Museum Passes',
        amount: 3500,
        category: 'activities',
        split_method: 'equal',
        date: '2026-11-06',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: CHIRAG_USER_ID,
        title: 'Nahargarh Fort Sunset Jeep Safari',
        amount: 6000,
        category: 'activities',
        split_method: 'equal',
        date: '2026-11-04',
      },
    ];

    const { error: shErr } = await supabase.from('shared_expenses').insert(sharedExpenses);
    if (shErr) console.error('Shared expenses error:', shErr);

    // Splits for each shared expense (equal 5-way split)
    const userIds = [AARAV_USER_ID, ANEESH_USER_ID, BHAVNA_USER_ID, CHIRAG_USER_ID, PRIYA_USER_ID];
    const allSplits = [];
    for (const exp of sharedExpenses) {
      const share = exp.amount / userIds.length;
      for (const uId of userIds) {
        allSplits.push({
          id: crypto.randomUUID(),
          expense_id: exp.id,
          user_id: uId,
          amount: share,
        });
      }
    }
    const { error: spErr } = await supabase.from('shared_expense_splits').insert(allSplits);
    if (spErr) console.error('Splits error:', spErr);
    else console.log(`✅ Seeded ${sharedExpenses.length} shared expenses with ${allSplits.length} splits across 5 members.`);
  }

  console.log('\n========================================');
  console.log('🎉 ALL DATA SEEDED SUCCESSFULLY!');
  console.log('========================================');
}

run().catch(console.error);
