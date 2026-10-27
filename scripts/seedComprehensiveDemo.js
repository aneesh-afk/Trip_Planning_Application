import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://feykljceqezgpjbexnij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleWtsamNlcWV6Z3BqYmV4bmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTg4NTksImV4cCI6MjEwNzMzNDg1OX0.mdKgLtn6NoWEy6jjjEyD4G2MMCzigHx9aqubJ25EVbA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_USER_ID = 'cc044a3e-f132-470f-948a-c3248c9f45f3'; // demo.traveler2026@gmail.com
const ANEESH_USER_ID = 'bc4fa98a-d0e4-4704-ba50-d36c1f7bfbd6'; // aneesh.suvarna24@spit.ac.in
const BHAVNA_USER_ID = 'bbbbbbbb-2222-2222-2222-222222222222';
const CHIRAG_USER_ID = 'cccccccc-3333-3333-3333-333333333333';

const TRIP_ID = 'd1111111-2222-3333-4444-555555555555';

async function seed() {
  console.log('--- 1. SEEDING GROUP TRAVELERS IN PUBLIC.USERS ---');
  const travelers = [
    {
      id: DEMO_USER_ID,
      email: 'demo.traveler2026@gmail.com',
      display_name: 'Aarav Sharma (Organizer)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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
  ];

  for (const t of travelers) {
    const { error: uErr } = await supabase.from('users').upsert(t);
    if (uErr) console.warn('User upsert notice:', uErr.message);
  }
  console.log('Travelers ensured.');

  console.log('\n--- 2. CREATING SHOWCASE TRIP (RAJASTHAN & GOLDEN TRIANGLE) ---');
  const tripData = {
    id: TRIP_ID,
    user_id: DEMO_USER_ID,
    name: 'Incredible Rajasthan & Golden Triangle Heritage Tour',
    region: 'North India',
    start_date: '2026-11-01',
    end_date: '2026-11-08',
    budget: 45000,
  };

  const { error: tErr } = await supabase.from('trips').upsert(tripData);
  if (tErr) console.error('Trip error:', tErr);
  else console.log('Trip upserted successfully:', tripData.name);

  console.log('\n--- 3. CREATING TRIP STOPS & ACTIVITIES ---');
  // Clean old stops for this trip
  await supabase.from('trip_stops').delete().eq('trip_id', TRIP_ID);

  const stops = [
    {
      id: 'a1111111-0001-0000-0000-000000000001',
      trip_id: TRIP_ID,
      city_id: 'c1111111-1111-1111-1111-111111111111', // New Delhi
      order_index: 0,
      start_date: '2026-11-01',
      end_date: '2026-11-03',
      stay_cost_per_night: 3200,
      transport_cost_to_here: 0,
    },
    {
      id: 'a1111111-0002-0000-0000-000000000002',
      trip_id: TRIP_ID,
      city_id: 'a1000000-0000-0000-0000-000000000001', // Jaipur
      order_index: 1,
      start_date: '2026-11-03',
      end_date: '2026-11-05',
      stay_cost_per_night: 2800,
      transport_cost_to_here: 1850,
    },
    {
      id: 'a1111111-0003-0000-0000-000000000003',
      trip_id: TRIP_ID,
      city_id: 'a1000000-0000-0000-0000-000000000008', // Udaipur
      order_index: 2,
      start_date: '2026-11-05',
      end_date: '2026-11-08',
      stay_cost_per_night: 3500,
      transport_cost_to_here: 2200,
    },
  ];

  const { error: stopsErr } = await supabase.from('trip_stops').insert(stops);
  if (stopsErr) console.warn('Stops error:', stopsErr.message);
  else console.log('3 Indian stops inserted (Delhi, Jaipur, Udaipur).');

  // Insert stop activities
  const stopActs = [
    {
      id: 'b1111111-0001-0000-0000-000000000001',
      trip_stop_id: stops[1].id, // Jaipur
      activity_id: '2d7c0a04-857e-4bf2-9962-444c71be890f', // Amber Fort
      order_index: 0,
      scheduled_date: '2026-11-04',
      custom_cost_override: 1500,
    },
    {
      id: 'b1111111-0002-0000-0000-000000000002',
      trip_stop_id: stops[1].id, // Jaipur
      activity_id: '739e80bf-dad9-479c-835b-1520eb552342', // Hawa Mahal
      order_index: 1,
      scheduled_date: '2026-11-04',
      custom_cost_override: 800,
    },
    {
      id: 'b1111111-0003-0000-0000-000000000003',
      trip_stop_id: stops[1].id, // Jaipur
      activity_id: 'f1ea4a02-73d4-49c4-b323-bd708b11b5ec', // Royal Thali
      order_index: 2,
      scheduled_date: '2026-11-04',
      custom_cost_override: 2200,
    },
  ];
  await supabase.from('stop_activities').delete().in('trip_stop_id', stops.map(s => s.id));
  await supabase.from('stop_activities').insert(stopActs);

  console.log('\n--- 4. SEEDING MODULE 4.4: ACTUAL TRIP EXPENSES ---');
  await supabase.from('trip_expenses').delete().eq('trip_id', TRIP_ID);
  const expenses = [
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'food',
      amount: 4200,
      date: '2026-11-01',
      description: 'Bukhara & Karim’s Heritage Dinner in Old Delhi',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'transport',
      amount: 1850,
      date: '2026-11-03',
      description: 'Vande Bharat Express (Executive Class, Delhi to Jaipur)',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'sightseeing',
      amount: 2400,
      date: '2026-11-04',
      description: 'Amber Fort Elephant Sanctuary & Guided Royal Tour',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'stay',
      amount: 9600,
      date: '2026-11-03',
      description: 'Zostel Plus & Heritage Haveli Stay (Jaipur)',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'food',
      amount: 3100,
      date: '2026-11-04',
      description: 'Chokhi Dhani Traditional Rajasthani Thali & Folk Show',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'shopping',
      amount: 5500,
      date: '2026-11-05',
      description: 'Jaipur Blue Pottery & Johari Bazaar Handicrafts',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'sightseeing',
      amount: 2200,
      date: '2026-11-06',
      description: 'Lake Pichola Sunset Boat Cruise & Jag Mandir Island',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      category: 'transport',
      amount: 1600,
      date: '2026-11-08',
      description: 'Pre-paid Airport Cab (Udaipur Hotel to Airport)',
    },
  ];
  const { error: expErr } = await supabase.from('trip_expenses').insert(expenses);
  if (expErr) console.warn('Expenses error:', expErr.message);
  else console.log(`Seeded ${expenses.length} actual expenses (Total ₹30,450 / ₹45,000 budget).`);

  console.log('\n--- 5. SEEDING MODULE 4.5: ACCOMMODATION & TRANSPORTATION BOOKINGS ---');
  await supabase.from('bookings').delete().eq('trip_id', TRIP_ID);
  const bookings = [
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
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
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
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
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
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
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
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
  if (bkErr) console.warn('Bookings error:', bkErr.message);
  else console.log(`Seeded ${bookings.length} reservations (Total Bookings Cost: ₹26,150).`);

  console.log('\n--- 6. SEEDING MODULE 4.6: GROUP MEMBERS & DEBT SETTLEMENT ---');
  await supabase.from('trip_members').delete().eq('trip_id', TRIP_ID);
  const members = [
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: DEMO_USER_ID,
      role: 'organizer',
      status: 'accepted',
    },
    {
      id: crypto.randomUUID(),
      trip_id: TRIP_ID,
      user_id: ANEESH_USER_ID,
      role: 'member',
      status: 'accepted',
    },
  ];
  await supabase.from('trip_members').insert(members);
  console.log('Seeded group travelers (Aarav & Aneesh).');

  // Shared expenses
  await supabase.from('shared_expenses').delete().eq('trip_id', TRIP_ID);
  const shared1 = {
    id: crypto.randomUUID(),
    trip_id: TRIP_ID,
    payer_id: DEMO_USER_ID,
    title: 'Chokhi Dhani Royal Group Dinner',
    amount: 4800,
    category: 'food',
    split_method: 'equal',
    date: '2026-11-04',
  };
  const shared2 = {
    id: crypto.randomUUID(),
    trip_id: TRIP_ID,
    payer_id: ANEESH_USER_ID,
    title: 'Innova Crysta Highway Cab (Jaipur to Udaipur)',
    amount: 6000,
    category: 'transport',
    split_method: 'equal',
    date: '2026-11-05',
  };
  const shared3 = {
    id: crypto.randomUUID(),
    trip_id: TRIP_ID,
    payer_id: DEMO_USER_ID,
    title: 'Lake Pichola Private Sunset Boat Charter',
    amount: 3200,
    category: 'activities',
    split_method: 'equal',
    date: '2026-11-06',
  };

  const allShared = [shared1, shared2, shared3];
  await supabase.from('shared_expenses').insert(allShared);

  // Splits: 2 ways equal between DEMO_USER and ANEESH_USER
  const allUserIds = [DEMO_USER_ID, ANEESH_USER_ID];
  const allSplits = [];
  for (const exp of allShared) {
    const share = exp.amount / allUserIds.length;
    for (const uid of allUserIds) {
      allSplits.push({
        id: crypto.randomUUID(),
        expense_id: exp.id,
        user_id: uid,
        amount: share,
      });
    }
  }
  await supabase.from('shared_expense_splits').insert(allSplits);
  console.log(`Seeded ${allShared.length} shared expenses with ${allSplits.length} splits.`);
  console.log('✅ ALL DEMO DATA SEEDED PERFECTLY INTO SUPABASE!');
}

seed().catch(console.error);
