'use client';

import Link from 'next/link';
import { SignovaLogoIcon } from './SignovaLogo';
import WorkspaceSwitcher from './workspace-switcher';

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 md:hidden bg-white border-b border-[#e0d9ce] flex items-center px-4 gap-3" style={{ height: 52 }}>
      {/* Logo */}
      <Link href="/contracts" className="flex-shrink-0">
        <SignovaLogoIcon size={28} />
      </Link>

      {/* Workspace switcher — fills middle */}
      <div className="flex-1 min-w-0">
        <WorkspaceSwitcher />
      </div>
    </header>
  );
}
