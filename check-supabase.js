import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl) console.error("No supabase url");
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseUsers() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(`Found ${profiles.length} profiles in Supabase.`);
    for (const p of profiles) {
        console.log(`- ${p.id}: ${p.display_name} | email: ${p.email}`);
    }
}

checkSupabaseUsers().catch(console.error);
