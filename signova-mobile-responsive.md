BEFORE DOING ANYTHING:
1. Read memory.md — understand full project state
2. Show me:
   - Current layout component (sidebar + main content)
   - Current CSS/Tailwind breakpoints used
   - Where is the sidebar rendered?
   - Where is the bottom navigation (if any)?
   - What pages/routes exist?
3. List ALL files you plan to create or modify
4. Wait for my confirmation before writing any code

PROTECTION RULES — NON NEGOTIABLE
⛔ DO NOT modify any existing logic or functionality
⛔ DO NOT modify any API routes
⛔ DO NOT modify auth, billing, or workspace logic
⛔ DO NOT change desktop layout — it must stay exactly the same
⛔ DO NOT install new packages without telling me first
⛔ ONLY modify layout/navigation components for mobile

━━━━━━━━━━━━━━━━━━━━━━
BUG — Mobile layout broken
━━━━━━━━━━━━━━━━━━━━━━
Current behavior:
  Sidebar and main content sit side by side on mobile
  Screen too narrow — both get squished
  Unusable on phone

Expected behavior:
  Mobile: sidebar hidden, bottom navigation bar appears
  Desktop: sidebar stays exactly as it is now

━━━━━━━━━━━━━━━━━━━━━━
SOLUTION — Responsive Layout
━━━━━━━━━━━━━━━━━━━━━━
Breakpoint: 768px (md in Tailwind)

Desktop (md and above):
  Sidebar visible on left — NO changes
  Main content fills remaining space — NO changes
  Everything exactly as it is now

Mobile (below md):
  Sidebar hidden completely (hidden md:block)
  Bottom navigation bar fixed at bottom of screen
  Main content fills full width
  Main content has padding-bottom to avoid bottom nav overlap

━━━━━━━━━━━━━━━━━━━━━━
BOTTOM NAVIGATION BAR
━━━━━━━━━━━━━━━━━━━━━━
Create: components/MobileBottomNav.jsx

Position: fixed, bottom 0, full width, z-index 50

Style:
  background: white
  border-top: 1px solid #e0d9ce
  height: 64px
  padding-bottom: env(safe-area-inset-bottom) for iPhone notch

4 nav items:

  Home (Dashboard)
    icon: house or grid
    label: Home
    route: /dashboard

  Contracts
    icon: document
    label: Contracts
    route: /contracts

  AI
    icon: sparkles or terminal
    label: AI
    route: /ai-terminal
    amber color when active

  Settings
    icon: gear
    label: Settings
    route: /settings

Active state:
  icon color: #c8873a
  label color: #c8873a
  inactive color: #9a8f82

Component:
```jsx
'use client'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { label: 'Home',      icon: HomeIcon,      route: '/dashboard'   },
  { label: 'Contracts', icon: DocumentIcon,  route: '/contracts'   },
  { label: 'AI',        icon: SparklesIcon,  route: '/ai-terminal' },
  { label: 'Settings',  icon: CogIcon,       route: '/settings'    },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                    bg-white border-t border-[#e0d9ce]
                    h-16 flex items-center justify-around
                    pb-safe">
      {navItems.map(item => {
        const isActive = pathname.startsWith(item.route)
        return (
          <button
            key={item.route}
            onClick={() => router.push(item.route)}
            className="flex flex-col items-center gap-1 px-4"
          >
            <item.icon
              className={`w-5 h-5 ${isActive ? 'text-[#c8873a]' : 'text-[#9a8f82]'}`}
            />
            <span className={`text-[10px] font-medium
              ${isActive ? 'text-[#c8873a]' : 'text-[#9a8f82]'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
```

━━━━━━━━━━━━━━━━━━━━━━
LAYOUT CHANGES
━━━━━━━━━━━━━━━━━━━━━━
In main layout component:

1. Sidebar — add md:block hidden:
   Current:  <aside className="...existing classes...">
   Change:   <aside className="...existing classes... hidden md:flex">

2. Main content — add mobile padding bottom:
   Current:  <main className="...existing classes...">
   Change:   <main className="...existing classes... pb-20 md:pb-0">
   (pb-20 = 80px to clear the bottom nav)

3. Add MobileBottomNav to layout:
   <MobileBottomNav />  ← add this at bottom of layout
   Only renders on mobile (md:hidden inside component)

━━━━━━━━━━━━━━━━━━━━━━
MOBILE HEADER
━━━━━━━━━━━━━━━━━━━━━━
On mobile, show a slim top header instead of sidebar header:

Create: components/MobileHeader.jsx

Shows on mobile only (md:hidden):
  Left:  Signova logo icon (small, 28px)
  Right: User avatar

Style:
  background: white
  border-bottom: 1px solid #e0d9ce
  height: 52px
  padding: 0 16px
  position: sticky top-0
  z-index: 40

Add to layout, visible only on mobile.

━━━━━━━━━━━━━━━━━━━━━━
WORKSPACE SELECTOR ON MOBILE
━━━━━━━━━━━━━━━━━━━━━━
Currently workspace selector is in the sidebar.
On mobile it needs to be accessible.

Option: Add workspace name in mobile header center
  Left:  Logo
  Center: "Personal Space ▾" (tappable, opens sheet)
  Right: Avatar

Or keep it simple for now and show workspace
in a banner below the mobile header.

Show me current workspace selector component
before deciding — wait for my confirmation.

━━━━━━━━━━━━━━━━━━━━━━
EXECUTION ORDER
━━━━━━━━━━━━━━━━━━━━━━
Step 1 — Audit
  Show main layout file
  Show sidebar component
  Show all current Tailwind breakpoints
  Show current routes/pages
  Wait for confirmation

Step 2 — Hide sidebar on mobile
  Add hidden md:flex to sidebar
  Add pb-20 md:pb-0 to main content
  Test: sidebar hidden on mobile, visible on desktop
  Screenshot both desktop and mobile
  git commit: "fix: hide sidebar on mobile"

Step 3 — Create MobileBottomNav
  components/MobileBottomNav.jsx
  4 items: Home, Contracts, AI, Settings
  Active state in amber
  Fixed at bottom, md:hidden
  Add to layout
  Screenshot mobile bottom nav
  git commit: "feat: mobile bottom navigation"

Step 4 — Create MobileHeader
  components/MobileHeader.jsx
  Logo + avatar
  Sticky top, md:hidden
  Add to layout
  Screenshot mobile header
  git commit: "feat: mobile top header"

Step 5 — Test all pages on mobile
  Dashboard
  Contracts list
  Contract detail
  AI Terminal
  Settings
  Screenshot each page on mobile view
  git commit: "fix: mobile responsive all pages"

Step 6 — Update memory.md:
  MobileBottomNav component location
  MobileHeader component location
  Mobile breakpoint used (768px / md)
  Layout changes for mobile
