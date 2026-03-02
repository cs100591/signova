require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fix_db() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        
        await client.query(`
            ALTER TABLE contracts 
            ADD COLUMN IF NOT EXISTS contract_group_id UUID,
            ADD COLUMN IF NOT EXISTS parent_contract_id UUID,
            ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS file_hash TEXT;
        `);
        console.log("Columns added successfully");

        // We may need to add foreign keys but since these might be just logical links, or references to the same table.
        // Let's add them as references to the same table if needed, but simple UUID might be safer to prevent errors if not strict.
        
        // Let's check columns
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contracts';
        `);
        console.log(res.rows);

        client.end();
    } catch (e) {
        console.log("DB error:", e.message);
        client.end();
    }
}
fix_db();
