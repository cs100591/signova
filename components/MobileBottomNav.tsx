'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, Sparkles, Settings } from 'lucide-react';

const navItems = [
  { label: 'Home',      Icon: Home,      route: '/contracts'  },
  { label: 'Contracts', Icon: FileText,   route: '/contracts'  },
  { label: 'AI',        Icon: Sparkles,   route: '/terminal'   },
  { label: 'Settings',  Icon: Settings,   route: '/settings'   },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-[#e0d9ce] flex items-center justify-around"
      style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ label, Icon, route }) => {
        const isActive = pathname === route || (route !== '/contracts' && pathname.startsWith(route));
        return (
          <button
            key={label}
            onClick={() => router.push(route)}
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <Icon
              className={`w-5 h-5 ${isActive ? 'text-[#c8873a]' : 'text-[#9a8f82]'}`}
            />
            <span
              className={`text-[10px] font-medium ${isActive ? 'text-[#c8873a]' : 'text-[#9a8f82]'}`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
