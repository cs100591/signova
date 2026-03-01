import { NextResponse } from "next/server";

// One-time migration endpoint - protected by secret
// Call: POST /api/admin/migrate?secret=signova-migrate-2026
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "signova-migrate-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Use Supabase service role key to run DDL via the db-driver endpoint
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Supabase allows running SQL via the /rest/v1/rpc endpoint
  // We'll create a temporary helper function first, then use it
  
  const sqlStatements = [
    // contracts columns
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_a TEXT",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_b TEXT",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS governing_law TEXT",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_90_sent BOOLEAN DEFAULT false",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_30_sent BOOLEAN DEFAULT false",
    "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reminder_7_sent BOOLEAN DEFAULT false",
    // profiles columns
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT",
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyses_used INTEGER DEFAULT 0",
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyses_reset_date DATE",
    // workspaces table
    `CREATE TABLE IF NOT EXISTS workspaces (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id UUID,
      plan TEXT DEFAULT 'free',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    )`,
    "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'",
    "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id UUID",
    // workspace_members table
    `CREATE TABLE IF NOT EXISTS workspace_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workspace_id UUID,
      user_id UUID,
      role TEXT DEFAULT 'member',
      invited_email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    )`,
    "ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'",
    "ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS invited_email TEXT",
    // RLS
    "ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY",
    // Workspace policies
    "DROP POLICY IF EXISTS \"wsp_select\" ON workspaces",
    "CREATE POLICY \"wsp_select\" ON workspaces FOR SELECT USING (auth.uid() = owner_id)",
    "DROP POLICY IF EXISTS \"wsp_insert\" ON workspaces",
    "CREATE POLICY \"wsp_insert\" ON workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id)",
    "DROP POLICY IF EXISTS \"wsp_update\" ON workspaces",
    "CREATE POLICY \"wsp_update\" ON workspaces FOR UPDATE USING (auth.uid() = owner_id)",
    "DROP POLICY IF EXISTS \"wsp_delete\" ON workspaces",
    "CREATE POLICY \"wsp_delete\" ON workspaces FOR DELETE USING (auth.uid() = owner_id)",
    // Members policies
    "DROP POLICY IF EXISTS \"wsm_select\" ON workspace_members",
    "CREATE POLICY \"wsm_select\" ON workspace_members FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()))",
    "DROP POLICY IF EXISTS \"wsm_all\" ON workspace_members",
    "CREATE POLICY \"wsm_all\" ON workspace_members FOR ALL USING (EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()))",
    // Grants
    "GRANT ALL ON workspaces TO authenticated",
    "GRANT ALL ON workspaces TO service_role",
    "GRANT ALL ON workspace_members TO authenticated",
    "GRANT ALL ON workspace_members TO service_role",
    // Set business plan
    "UPDATE profiles SET plan = 'business' WHERE email = 'cs1005.91@gmail.com'",
  ];

  // Try running via Supabase's pg REST endpoint (internal)
  // This uses the service_role which can bypass RLS
  for (const sql of sqlStatements) {
    const label = sql.trim().split("\n")[0].slice(0, 60);
    try {
      // The Supabase postgres REST endpoint accepts raw queries
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });
      
      if (res.ok) {
        results[label] = "✓ ok";
      } else {
        const txt = await res.text();
        // 404 means function doesn't exist - try alternative
        if (res.status === 404 || txt.includes("PGRST202")) {
          results[label] = "⚠ rpc/query not available";
          break;
        }
        results[label] = `✗ ${res.status}: ${txt.slice(0, 100)}`;
      }
    } catch (e: any) {
      results[label] = `✗ exception: ${e.message}`;
    }
  }

  // Try using pg directly with Supabase connection string
  // Supabase Session Pooler: postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  let pgResult = "not attempted";
  try {
    const { Pool } = await import("pg");
    
    // Derive the Supabase connection URL from the project URL
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const supabaseDbUrl = process.env.SUPABASE_DB_URL || 
      `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`;
    
    if (process.env.SUPABASE_DB_URL || process.env.SUPABASE_DB_PASSWORD) {
      const pool = new Pool({ connectionString: supabaseDbUrl, ssl: { rejectUnauthorized: false } });
      
      for (const sql of sqlStatements) {
        const label = sql.trim().split("\n")[0].slice(0, 60);
        try {
          await pool.query(sql);
          results[label] = "✓ pg ok";
        } catch (e: any) {
          if (e.message.includes("already exists") || e.message.includes("does not exist")) {
            results[label] = `⚠ pg: ${e.message.slice(0, 80)}`;
          } else {
            results[label] = `✗ pg: ${e.message.slice(0, 80)}`;
          }
        }
      }
      
      await pool.end();
      pgResult = "completed";
    } else {
      pgResult = "no SUPABASE_DB_URL or SUPABASE_DB_PASSWORD env vars";
    }
  } catch (e: any) {
    pgResult = `pg failed: ${e.message}`;
  }

  return NextResponse.json({
    status: "Migration endpoint called",
    pgResult,
    results,
    instructions: "If all results show 'rpc/query not available', you need to run the SQL manually in Supabase Dashboard > SQL Editor.",
    sqlToRunManually: sqlStatements,
  });
}
