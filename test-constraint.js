require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // First list all users to get a valid user ID.
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error || !users?.length) {
    console.log("Failed to get users", error);
    return;
  }
  const uid = users[0].id;
  console.log("Using user_id:", uid);

  const { data: wsData, error: wsError } = await supabase.from('workspaces').insert({
    name: 'Test Setup',
    owner_id: uid
  }).select();

  console.log("Workspaces insert error:", wsError);

  const { data: contractData, error: contractError } = await supabase.from('contracts').insert({
    name: 'Test Name',
    title: 'Test Title',
    user_id: uid,
    type: 'NDA'
  }).select();

  console.log("Contracts insert error:", contractError);
}
check();
