import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://usdzlpaletfbvvhkvaki.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZHpscGFsZXRmYnZ2aGt2YWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQxNzUzNiwiZXhwIjoyMDkwOTkzNTM2fQ.t3-rSm4VMT9klY_zFv3_5DLo2no9rP_cUbfmTozdev8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
  console.log('Attempting to add is_premium column to comments table...');
  
  // Since we can't run arbitrary SQL directly via the JS client without an RPC,
  // we'll try to see if we can use the 'rpc' method if a common one like 'exec_sql' exists.
  // If not, we'll have to find another way or inform the user.
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: 'ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;' 
  });

  if (error) {
    console.error('Error adding column via RPC:', error);
    
    // Try a direct SQL query if RPC fails
    const { error: sqlError } = await supabase.from('comments').select('*').limit(1);
    if (sqlError) {
      console.error('Select test failed:', sqlError);
    } else {
      console.log('Select test succeeded!');
    }
  } else {
    console.log('Column added successfully via RPC:', data);
  }
}

addColumn();
