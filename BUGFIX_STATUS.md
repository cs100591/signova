## 🔴 紧急修复完成但需验证

### 已部署的修复：

**1. 后端 API 修复** (`app/api/contracts/route.ts`):
- ✅ 确保 name 和 type 始终包含在 minimal insert 中
- ✅ 移除错误的条件逻辑

**2. 前端修复**:
- ✅ Terminal 动画 3 秒最小延迟
- ✅ Chatbox 用户消息颜色继承
- ✅ Confirm 页面底部 padding

### 需要您立即执行：

**在 Supabase Dashboard 执行以下 SQL（关键！）**：

```sql
-- 检查当前表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY ordinal_position;
```

**然后添加缺失列**：
```sql
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Untitled Contract';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS amount TEXT;
```

### 为什么还需要 SQL？

代码修复确保 API **尝试**包含 name 字段，但如果数据库表本身**没有 name 列**，插入会失败。

**代码逻辑**：
1. 尝试插入完整数据（包含 name）
2. 如果失败（列不存在），重试 minimal 数据（**仍然包含 name**）
3. 但如果 name 列真的不存在，依然会失败

**解决方案**：
必须在数据库层面添加 name 列！

### 临时 workaround（如果您不想执行 SQL）：

我可以修改代码跳过 name 验证，但这会导致数据不完整。

**请立即执行 SQL 或告诉我是否需要 workaround！**