require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: { users }, error: errUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (errUsers || !users.length) return console.log('no users');

    const user = users[0];
    console.log("Testing as user:", user.email, "id:", user.id);

    // Generate a mock JWT for this user 
    // Wait, I can't generate a JWT directly, but I can use admin.generateLink or sign in.
    // Wait, if I use the admin key, it bypasses RLS. To use anon key, I need to log in.
}
check();
