require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function audit() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const tables = ['contracts', 'workspaces', 'workspace_members', 'profiles'];
        
        for (const table of tables) {
            console.log(`\n=== Table: ${table} ===`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [table]);
            
            if (res.rows.length === 0) {
                console.log("Table does not exist or has no columns.");
            } else {
                res.rows.forEach(r => {
                    console.log(`- ${r.column_name} (${r.data_type})${r.is_nullable === 'NO' ? ' NOT NULL' : ''}${r.column_default ? ` DEFAULT ${r.column_default}` : ''}`);
                });
            }
        }
        client.end();
    } catch (e) {
        console.log("DB error:", e.message);
        client.end();
    }
}
audit();
