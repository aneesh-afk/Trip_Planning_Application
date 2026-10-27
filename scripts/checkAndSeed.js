import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://feykljceqezgpjbexnij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleWtsamNlcWV6Z3BqYmV4bmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTg4NTksImV4cCI6MjEwNzMzNDg1OX0.mdKgLtn6NoWEy6jjjEyD4G2MMCzigHx9aqubJ25EVbA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('1. Checking public.users table...');
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  console.log('Users in public.users:', users?.length, uErr?.message || '');
  if (users) {
    console.log(users.map(u => ({ id: u.id, email: u.email, name: u.display_name })));
  }

  console.log('\n2. Testing login with potential test users or creating demo user...');
  const testEmail = 'demo.traveler2026@gmail.com';
  const testPassword = 'Password123!';

  // Attempt signIn
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInData?.user) {
    console.log('Successfully signed in existing demo user:', signInData.user.id);
  } else {
    console.log('SignIn failed:', signInErr?.message, 'Trying signUp...');
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { data: { display_name: 'Aarav (Demo Traveler)' } },
    });

    if (signUpErr) {
      console.log('SignUp error:', signUpErr.message);
    } else {
      console.log('SignUp result:', signUpData.user?.id, 'Session:', !!signUpData.session);
    }
  }
}

main().catch(console.error);
