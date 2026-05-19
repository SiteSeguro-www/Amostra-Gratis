import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://usdzlpaletfbvvhkvaki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZHpscGFsZXRmYnZ2aGt2YWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTc1MzYsImV4cCI6MjA5MDk5MzUzNn0.L2zj0j3zDk60BknJqIBJQBUohsscnxMHYP4fMyKfQbc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
