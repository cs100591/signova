# Signova 部署配置完成

## ✅ 已完成文件

### 核心库文件
1. **`lib/supabase.ts`** - Supabase 客户端
   - Browser 客户端（前端使用）
   - Server 客户端（API routes 使用）

2. **`lib/r2.ts`** - Cloudflare R2 文件上传
   - `uploadFile()` - 上传文件到 R2
   - `getDownloadUrl()` - 获取预签名下载链接
   - `deleteFile()` - 删除文件
   - `generateFileKey()` - 生成唯一文件 key

3. **`lib/vision.ts`** - Google Vision OCR（Vercel 适配）
   - 支持本地环境（GOOGLE_APPLICATION_CREDENTIALS）
   - 支持 Vercel 环境（GOOGLE_VISION_KEY_JSON）
   - `ocrImage()` - 图片 OCR
   - `processPDF()` - PDF 文字提取（自动判断文字版/扫描版）
   - `extractText()` - 统一入口

4. **`app/auth/callback/route.ts`** - Supabase Auth 回调
   - 使用 @supabase/ssr 处理 OAuth 回调
   - 登录成功后重定向到 /contracts

### 环境变量更新
`.env.local` 已更新，包含：
- Supabase 配置（URL, Anon Key, Service Role Key）
- Cloudflare R2 配置（Account ID, Access Key, Secret Key, Bucket, Endpoint）
- Google Vision（本地文件路径 + Vercel JSON 内容）
- Resend 邮件配置
- Cron/Admin 安全密钥

## 📦 已安装依赖

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Cloudflare R2 (S3 compatible)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 🚀 下一步（部署到 Vercel）

### 1. Supabase 设置
1. 登录 [supabase.com](https://supabase.com) 创建项目
2. 执行数据库迁移 SQL（见 signova-deploy.md）
3. 获取环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Cloudflare R2 设置
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 创建 R2 bucket: `signova-contracts`
3. 创建 API Token（Object Read & Write 权限）
4. 获取环境变量：
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY`
   - `CLOUDFLARE_R2_SECRET_KEY`
   - `CLOUDFLARE_R2_ENDPOINT`

### 3. Google Vision 设置
1. 已存在 `gcp-key.json` 在本地
2. Vercel 部署时，将整个 JSON 内容复制到 `GOOGLE_VISION_KEY_JSON`

### 4. Resend 邮件设置
1. 登录 [resend.com](https://resend.com) 获取 API Key
2. 添加域名 `signova.me` 并验证

### 5. Vercel 部署

#### 环境变量设置
在 Vercel Dashboard → Project → Settings → Environment Variables 中添加：

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Google Vision (Vercel - 粘贴完整 JSON)
GOOGLE_VISION_KEY_JSON={"type":"service_account",...}

# R2
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=signova-contracts
CLOUDFLARE_R2_ENDPOINT=

# Email
RESEND_API_KEY=

# Security
CRON_SECRET=openssl rand -base64 32
ADMIN_SECRET=openssl rand -base64 32

# App
NEXT_PUBLIC_APP_URL=https://signova.me
```

#### 绑定域名
1. Vercel → Project → Settings → Domains
2. 添加 `signova.me`
3. 在域名注册商添加 DNS 记录：
   - Type: A, Name: @, Value: 76.76.21.21
   - 或 Type: CNAME, Name: @, Value: cname.vercel-dns.com

#### 配置 Cron Job（到期提醒邮件）
在 `vercel.json` 中添加：

```json
{
  "crons": [
    {
      "path": "/api/cron/expiry-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 6. 部署检查清单

```
□ 代码推送到 GitHub
□ Vercel 连接 GitHub repo
□ 所有环境变量已设置
□ Build 成功（无错误）
□ 自定义域名已绑定
□ SSL 证书已生效
□ Supabase 数据库迁移已执行
□ Google Vision JSON 已配置
□ Resend 域名已验证
□ 测试用户注册/登录
□ 测试 PDF 上传
□ 测试 AI 分析
□ 测试 Email 提醒（手动触发）
```

## 🐛 已知问题

1. **canvas 类型兼容性** - 已使用 `as any` 绕过（lib/vision.ts:75-76）
2. **pdf.js 路径** - 使用 `/legacy/build/pdf.mjs` 避免 DOMMatrix 错误
3. **Supabase Auth** - 使用 @supabase/ssr 而非已弃用的 auth-helpers

## 📚 参考文档

- `signova-deploy.md` - 完整部署指南
- `docs/EMAIL_REMINDERS.md` - 邮件系统文档
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
