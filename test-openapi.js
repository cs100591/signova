require('dotenv').config({ path: '.env.local' });

async function getOpenAPI() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const defs = data.definitions;

    if (defs && defs.contracts) {
        console.log("Contracts foreign keys or relationships:", defs.contracts['x-pgrst-fks']);
    }
    if (defs && defs.workspaces) {
        console.log("Workspaces foreign keys or relationships:", defs.workspaces['x-pgrst-fks']);
    }
}
getOpenAPI();
