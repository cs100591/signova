require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testJoin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("workspace_members")
      .select(`
        user_id,
        role,
        profiles (
          full_name,
          email
        )
      `);
      
    console.log("data with implicit join:", JSON.stringify(data, null, 2));
    if (error) console.error("error:", error);
}

testJoin();
