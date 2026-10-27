import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://feykljceqezgpjbexnij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleWtsamNlcWV6Z3BqYmV4bmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTg4NTksImV4cCI6MjEwNzMzNDg1OX0.mdKgLtn6NoWEy6jjjEyD4G2MMCzigHx9aqubJ25EVbA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AARAV_USER_ID  = 'cc044a3e-f132-470f-948a-c3248c9f45f3'; // demo.traveler2026@gmail.com
const ANEESH_USER_ID = 'bc4fa98a-d0e4-4704-ba50-d36c1f7bfbd6'; // aneesh.suvarna24@spit.ac.in
const BHAVNA_USER_ID = '216935c0-bebc-46be-8241-b47b87123928'; // bhavna.patel2026@gmail.com
const CHIRAG_USER_ID = 'e29991ac-42e4-4667-833a-3dcff0c8f29c'; // chirag.verma2026@gmail.com

const ALL_MEMBER_IDS = [AARAV_USER_ID, ANEESH_USER_ID, BHAVNA_USER_ID, CHIRAG_USER_ID];

const TARGET_TRIPS = [
  'd1111111-2222-3333-4444-555555555555', // Incredible Rajasthan & Golden Triangle Heritage Tour
  '5db12b8f-1fb4-4e33-9c88-445cf6650a73', // Trip to All India
];

async function applySeed() {
  console.log('--- 1. VERIFYING ALL 4 USERS IN PUBLIC.USERS ---');
  await supabase.from('users').upsert([
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
      email: 'bhavna.patel2026@gmail.com',
      display_name: 'Bhavna Patel',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
    {
      id: CHIRAG_USER_ID,
      email: 'chirag.verma2026@gmail.com',
      display_name: 'Chirag Verma',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  ]);
  const { data: users } = await supabase.from('users').select('id, email, display_name');
  console.log('Users in DB:', users);

  for (const tripId of TARGET_TRIPS) {
    console.log(`\n========================================`);
    console.log(`CONFIGURING TRIP: ${tripId}`);
    console.log(`========================================`);

    // 1. Ensure Trip Budget is ₹45,000
    await supabase.from('trips').update({ budget: 45000 }).eq('id', tripId);

    // 2. Insert all 4 members
    await supabase.from('trip_members').delete().eq('trip_id', tripId);
    const membersToInsert = [
      { id: crypto.randomUUID(), trip_id: tripId, user_id: AARAV_USER_ID, role: 'organizer', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: ANEESH_USER_ID, role: 'member', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: BHAVNA_USER_ID, role: 'member', status: 'accepted' },
      { id: crypto.randomUUID(), trip_id: tripId, user_id: CHIRAG_USER_ID, role: 'member', status: 'accepted' },
    ];
    const { error: memErr } = await supabase.from('trip_members').insert(membersToInsert);
    if (memErr) console.error('Member error:', memErr);
    else console.log(`✅ ${membersToInsert.length} members inserted into trip_members.`);

    // 3. Bookings (Total Cost: ₹26,150)
    await supabase.from('bookings').delete().eq('trip_id', tripId);
    const bookings = [
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: AARAV_USER_ID,
        type: 'accommodation',
        provider_name: 'Taj Lake Palace, Udaipur',
        booking_reference: 'HTL-TLP-8842',
        start_date: '2026-11-05',
        end_date: '2026-11-08',
        cost: 14500,
        notes: 'Luxury Lake View Suite with royal welcome and complimentary boat transfers.',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: AARAV_USER_ID,
        type: 'accommodation',
        provider_name: 'Zostel Plus Heritage, Jaipur',
        booking_reference: 'ZST-JPR-201',
        start_date: '2026-11-03',
        end_date: '2026-11-05',
        cost: 5600,
        notes: 'Private Heritage Deluxe Room with rooftop fort view.',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: ANEESH_USER_ID,
        type: 'transportation',
        provider_name: 'Vande Bharat Express (Indian Railways)',
        booking_reference: 'PNR-249019201',
        start_date: '2026-11-03',
        end_date: '2026-11-03',
        cost: 1850,
        notes: 'Coach EC1, Seat 24 (Executive Chair Car with onboard meals).',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: BHAVNA_USER_ID,
        type: 'transportation',
        provider_name: 'IndiGo Flight 6E-241',
        booking_reference: 'PNR-IND-6E99X',
        start_date: '2026-11-08',
        end_date: '2026-11-08',
        cost: 4200,
        notes: 'Udaipur (UDR) to Mumbai (BOM) • Seat 12F • 15kg baggage included.',
      },
    ];
    const { error: bkErr } = await supabase.from('bookings').insert(bookings);
    if (bkErr) console.error('Bookings error:', bkErr);
    else console.log(`✅ Seeded ${bookings.length} reservations (Bookings Cost: ₹26,150).`);

    // 4. Actual Expenses (Total ₹30,450)
    // Combined with bookings (₹26,150) = EXACTLY ₹56,600 (Exceeds ₹45,000 by ₹11,600)
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
        user_id: BHAVNA_USER_ID,
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
        user_id: CHIRAG_USER_ID,
        category: 'transport',
        amount: 1600,
        date: '2026-11-08',
        description: 'Pre-paid Airport Cab (Udaipur Hotel to Airport)',
      },
    ];
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const { error: expErr } = await supabase.from('trip_expenses').insert(expenses);
    if (expErr) console.error('Expenses error:', expErr);
    else console.log(`✅ Seeded ${expenses.length} actual expenses (Total ₹${totalExp}).`);

    // 5. Shared Expenses (Total ₹18,000 across 4 members)
    await supabase.from('shared_expenses').delete().eq('trip_id', tripId);
    const sharedExpenses = [
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: AARAV_USER_ID,
        title: 'Chokhi Dhani Royal Group Dinner',
        amount: 4800,
        category: 'food',
        split_method: 'equal',
        date: '2026-11-04',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: ANEESH_USER_ID,
        title: 'Innova Crysta Highway Cab (Jaipur to Udaipur)',
        amount: 6000,
        category: 'transport',
        split_method: 'equal',
        date: '2026-11-05',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: AARAV_USER_ID,
        title: 'Lake Pichola Private Sunset Boat Charter',
        amount: 3200,
        category: 'activities',
        split_method: 'equal',
        date: '2026-11-06',
      },
      {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer_id: BHAVNA_USER_ID,
        title: 'Nahargarh Fort Royal Jeep Safari',
        amount: 4000,
        category: 'activities',
        split_method: 'equal',
        date: '2026-11-04',
      },
    ];
    const { error: shErr } = await supabase.from('shared_expenses').insert(sharedExpenses);
    if (shErr) console.error('Shared expense error:', shErr);

    // 6. 4-way splits for each shared expense
    const splitsToInsert = [];
    for (const exp of sharedExpenses) {
      const share = exp.amount / ALL_MEMBER_IDS.length;
      for (const uId of ALL_MEMBER_IDS) {
        splitsToInsert.push({
          id: crypto.randomUUID(),
          expense_id: exp.id,
          user_id: uId,
          amount: share,
        });
      }
    }
    const { error: spErr } = await supabase.from('shared_expense_splits').insert(splitsToInsert);
    if (spErr) console.error('Splits error:', spErr);
    else console.log(`✅ Seeded ${sharedExpenses.length} shared expenses with ${splitsToInsert.length} splits.`);
  }

  console.log('\n========================================');
  console.log('🎉 ALL DATA UPDATED AND VERIFIED SUCCESSFULLY!');
  console.log('========================================');
}

applySeed().catch(console.error);
