require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, 'step1-schema.sql'), 'utf8');
        await client.query(sql);
        console.log("Migration executed successfully.");
        client.end();
    } catch (e) {
        console.log("DB error:", e.message);
        client.end();
    }
}
run();
