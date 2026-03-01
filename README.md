# Signova - AI Contract Companion

A minimal, AI-first contract companion that helps humans understand contracts clearly before signing.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL
- **AI**: OpenAI API (GPT-4o-mini)
- **Language**: TypeScript

## Features

✅ **Contract Workspace** - Clean, Notion-style card grid layout  
✅ **AI Terminal** - Light Console Mode for contract analysis  
✅ **Contract Upload** - PDF/DOC upload with AI metadata extraction  
✅ **Contract Detail** - PDF preview + extracted info + notes  
✅ **AI Analysis Flow** - Phase-based analysis with inline diff suggestions  
✅ **Two-Role Permission** - Owner/Member simple access control

## Quick Start

### 1. Install Dependencies

```bash
cd signova
npm install
```

### 2. Set Up Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/signova"

# AI
OPENAI_API_KEY="your-openai-api-key"

# App
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. Set Up Database

Start PostgreSQL (using Docker):

```bash
docker run -d \
  --name signova-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=signova \
  -p 5432:5432 \
  postgres:15
```

Initialize tables:

```sql
CREATE TABLE workspaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  amount VARCHAR(100),
  effective_date DATE,
  expiry_date DATE,
  summary TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Design System

### Workspace Colors
- Background: `#FFFBF5` (Soft Cream)
- Cards: `#FFFFFF`
- Border: `#EFE7DD`
- Primary: `#F59E0B` (Amber)
- Text: `#1A1A1A`

### Terminal Colors
- Background: `#FAF7F2`
- Font: JetBrains Mono
- Accent: `#F59E0B`

## Architecture

```
/app
  /(dashboard)/         # Group route for dashboard layout
    /contracts/page.tsx  # Contract library (card grid)
    /terminal/page.tsx   # AI Terminal (Light Console Mode)
    /upload/page.tsx     # Upload flow
    /extracting/page.tsx # AI extraction animation
    /confirm/page.tsx    # Metadata confirmation
    layout.tsx           # Dashboard layout with sidebar
  /api
    /contracts/route.ts  # CRUD API
    /upload/route.ts     # File upload + AI extraction
    /ai/analyze/route.ts # AI analysis endpoint
/components
  /ui/                   # shadcn components
  sidebar.tsx           # Navigation sidebar
/lib
  db.ts                 # PostgreSQL connection
  ai.ts                 # OpenAI integration
```

## API Endpoints

- `GET /api/contracts` - List all contracts
- `POST /api/contracts` - Create contract
- `POST /api/upload` - Upload file + AI extraction
- `POST /api/ai/analyze` - Analyze contract clause

## AI Prompts

All AI prompts follow strict template:

```
Instruction:
  - Act as a calm AI contract analyst
  - Do not be academic
  - Do not produce legal advice
  - Follow output format rules

Input:
  - Contract text
  - User focus area

Output Format:
  1. What clause says
  2. Why it matters
  3. What is typical
  4. Suggested improvement (inline diff)

Tone: Clear, Human, Not verbose
```

## Constraints (MVP Only)

✅ Simple 2-role permission (Owner/Member)  
✅ 4 database tables only  
✅ No SSO, no analytics, no dashboards  
✅ No vector DBs or complex AI pipelines  
✅ Single-turn AI requests (no streaming)

## Deployment

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

Or deploy to Vercel:

```bash
vercel --prod
```

## License

MIT

## Disclaimer

AI analysis is for informational purposes only. Not legal advice.
