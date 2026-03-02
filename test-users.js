const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: authUsers, error: err1 } = await supabase.auth.admin.listUsers();
  console.log("Auth users count:", authUsers?.users?.length);
  if (authUsers?.users?.length > 0) {
    console.log("First user:", authUsers.users[0].id, authUsers.users[0].email);
  }
}
check();
