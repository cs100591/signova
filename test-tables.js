require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log("public.users ->", data ? "EXISTS" : "MISSING", error?.message || 'No error');

    const { data: d2, error: e2 } = await supabase.from('profiles').select('*').limit(1);
    console.log("public.profiles ->", d2 ? "EXISTS" : "MISSING", e2?.message || 'No error');
}
check();
