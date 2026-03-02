-- 修复 Foreign Key Constraints 错误
-- 请将以下 SQL 复制并粘贴到 Supabase Dashboard -> SQL Editor 中运行

ALTER TABLE "public"."contracts" DROP CONSTRAINT IF EXISTS "contracts_user_id_fkey";
ALTER TABLE "public"."contracts" 
ADD CONSTRAINT "contracts_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."workspaces" DROP CONSTRAINT IF EXISTS "workspaces_owner_id_fkey";
ALTER TABLE "public"."workspaces" 
ADD CONSTRAINT "workspaces_owner_id_fkey" 
FOREIGN KEY ("owner_id") 
REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."workspace_members" DROP CONSTRAINT IF EXISTS "workspace_members_user_id_fkey";
ALTER TABLE "public"."workspace_members" 
ADD CONSTRAINT "workspace_members_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."terminal_chats" DROP CONSTRAINT IF EXISTS "terminal_chats_user_id_fkey";
ALTER TABLE "public"."terminal_chats" 
ADD CONSTRAINT "terminal_chats_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_id_fkey";
ALTER TABLE "public"."profiles" 
ADD CONSTRAINT "profiles_id_fkey" 
FOREIGN KEY ("id") 
REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- 验证：如果不小心在 public 的下层生成了一个 users 表（比如被 Prisma 或其他第三方代码生成过），可以清除它
-- 仅供清理：
-- DROP TABLE IF EXISTS "public"."users" CASCADE;
