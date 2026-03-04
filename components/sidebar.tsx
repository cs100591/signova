"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Sparkles, Settings, HelpCircle } from "lucide-react";
import WorkspaceSwitcher from "./workspace-switcher";
import { SignovaLogo } from "./SignovaLogo";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[260px] bg-[#F8F7F4] border-r border-[#E5E7EB] flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-[#E5E7EB]">
        <SignovaLogo size={30} />
      </div>

      {/* Workspace Switcher */}
      <div className="p-4 border-b border-[#E5E7EB]">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <Link
            href="/contracts"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/contracts" || pathname.startsWith("/contracts/")
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B7280] hover:bg-white hover:text-[#374151]"
            }`}
          >
            <FileText className="w-4 h-4" />
            Contracts
          </Link>

          <Link
            href="/terminal"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/terminal"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B7280] hover:bg-white hover:text-[#374151]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Terminal
          </Link>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="space-y-1">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B7280] hover:bg-white hover:text-[#374151]"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6B7280] hover:bg-white hover:text-[#374151] transition-colors">
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </button>
        </div>
      </div>
    </aside>
  );
}
