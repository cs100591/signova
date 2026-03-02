require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function check() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("--- Workspaces ---");
    let { data: workspaces, error: err1 } = await supabase.from('workspaces').select('id, name, owner_id');
    console.log(workspaces, err1);

    console.log("--- Workspace Members ---");
    let { data: members, error: err2 } = await supabase.from('workspace_members').select('*');
    console.log(members, err2);
    
    console.log("--- Profiles ---");
    let { data: profiles, error: err3 } = await supabase.from('profiles').select('id, full_name, email');
    console.log(profiles, err3);
}

check();
