require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixRoles() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing credentials. Please ensure .env.local is loaded properly.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching workspaces...");
    const { data: workspaces, error: err1 } = await supabase.from('workspaces').select('id, owner_id');
    if (err1) { console.error(err1); return; }

    for (const ws of workspaces) {
        console.log(`Fixing workspace ${ws.id}, owner ${ws.owner_id}`);
        // Ensure owner exists in workspace_members as owner
        const { error: err2 } = await supabase
            .from('workspace_members')
            .upsert({
                workspace_id: ws.id,
                user_id: ws.owner_id,
                role: 'owner'
            }, { onConflict: 'workspace_id, user_id' });
        
        if (err2) {
            console.error("Error upserting:", err2);
        } else {
            console.log("Success.");
        }
    }
}
fixRoles();
