import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://feykljceqezgpjbexnij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleWtsamNlcWV6Z3BqYmV4bmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTg4NTksImV4cCI6MjEwNzMzNDg1OX0.mdKgLtn6NoWEy6jjjEyD4G2MMCzigHx9aqubJ25EVbA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FIXES = {
  'Amber Fort & Elephant Valley': 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800',
  'Famous Kashi Chaat & Banarasi Lassi Crawl': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
  'Sarnath Deer Park & Buddhist Ruins': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  'Humayun Tomb & Nizamuddin Sufi Music': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
  'South Bombay Victorian Art Deco Walk': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800',
  'Thiksey & Hemis Monasteries Chanting Ceremony': 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800',
  'Sabarmati Ashram & Riverfront Walk': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  'Adalaj Stepwell Architectural Wonder': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  'lake': 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=800'
};

async function fixImages() {
  for (const [name, url] of Object.entries(FIXES)) {
    const { data, error } = await supabase
      .from('activities')
      .update({ image_url: url })
      .ilike('name', `%${name}%`)
      .select('id, name, image_url');
    
    if (error) {
      console.error('Error updating', name, error.message);
    } else {
      console.log('Successfully updated:', data?.map(d => d.name));
    }
  }
  console.log('All image fixes applied to Supabase database!');
}

fixImages().catch(console.error);
