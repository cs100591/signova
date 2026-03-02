require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function check() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        
        console.log("--- Workspaces ---");
        let res = await client.query('SELECT id, name, owner_id FROM workspaces');
        console.table(res.rows);

        console.log("\n--- Workspace Members ---");
        res = await client.query('SELECT id, workspace_id, user_id, role FROM workspace_members');
        console.table(res.rows);

        client.end();
    } catch (e) {
        console.log("DB error:", e.message);
        client.end();
    }
}
check();
