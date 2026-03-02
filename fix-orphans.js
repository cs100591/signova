require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrphans() {
    const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
    const validIds = users.users.map(u => u.id);

    const { data: contracts, error: err2 } = await supabase.from('contracts').select('id, user_id');
    if (err2) return console.log(err2);

    const badContracts = contracts.filter(c => !validIds.includes(c.user_id));
    console.log("Contracts with invalid user_id:", badContracts.length);
    if (badContracts.length > 0) {
        console.log("Deleting bad contracts...");
        const badIds = badContracts.map(c => c.id);
        const { error: err3 } = await supabase.from('contracts').delete().in('id', badIds);
        console.log("Deleted?", err3 || 'yes');
    }

    const { data: workspaces, error: err4 } = await supabase.from('workspaces').select('id, owner_id');
    if (err4) return console.log(err4);

    const badWorkspaces = workspaces.filter(w => !validIds.includes(w.owner_id));
    console.log("Workspaces with invalid owner_id:", badWorkspaces.length);
    if (badWorkspaces.length > 0) {
        console.log("Deleting bad workspaces...");
        const badWsIds = badWorkspaces.map(w => w.id);
        const { error: err5 } = await supabase.from('workspaces').delete().in('id', badWsIds);
        console.log("Deleted?", err5 || 'yes');
    }

    const { data: members, error: err6 } = await supabase.from('workspace_members').select('id, user_id');
    const badMembers = (members || []).filter(m => !validIds.includes(m.user_id));
    console.log("Members with invalid user_id:", badMembers.length);
    if (badMembers.length > 0) {
        const badMIds = badMembers.map(m => m.id);
        const { error: err7 } = await supabase.from('workspace_members').delete().in('id', badMIds);
        console.log("Deleted?", err7 || 'yes');
    }
}
checkOrphans();
