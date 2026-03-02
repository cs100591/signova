require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const payload = {
        user_id: '7830d10d-215f-4c1b-be01-6f9da5e2b10c',
        title: 'Full Payload Test',
        name: 'Full Payload Test',
        type: 'Other',
        amount: '50000',
        currency: 'USD',
        effective_date: '2026-04-01',
        expiry_date: '2026-03-02',
        summary: 'contract summary',
        file_url: null,
        party_a: 'PartyA',
        party_b: 'PartyB',
        governing_law: null,
        status: 'active',
    };

    const { data, error } = await supabase.from('contracts').insert(payload).select();
    console.log("Insert result:", error ? JSON.stringify(error) : "SUCCESS id: " + data[0].id);
}
check();
