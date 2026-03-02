require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function test_db() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const res = await client.query('SELECT 1 as val');
        console.log("Local DB connected:", res.rows[0].val);
        client.end();
    } catch (e) {
        console.log("Local DB connection error:", e.message);
    }
}
test_db();
