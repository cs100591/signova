require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const uid = '7830d10d-215f-4c1b-be01-6f9da5e2b10c'; // From test-users.js
    const { data, error } = await supabase.from('workspaces').insert({
        name: 'Test Create',
        owner_id: uid
    }).select();
    console.log('Workspaces Error:', error);
    if (!error) console.log('Workspaces Data:', data);

    const { data: d2, error: e2 } = await supabase.from('contracts').insert({
        title: 'Test Create',
        name: 'Test Create',
        type: 'NDA',
        user_id: uid
    }).select();
    console.log('Contracts Error:', e2);
    if (!e2) console.log('Contracts Data:', d2);
}
check();
