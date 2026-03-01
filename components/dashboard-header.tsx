"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase";

export default function DashboardHeader() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("user@example.com");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-[#E5E7EB]">
      <div className="flex items-center gap-4">
        <Link 
          href="/contracts" 
          className="text-sm text-[#6B7280] hover:text-[#1A1A1A] flex items-center gap-1"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F7F4]">
          <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-[#374151] truncate max-w-[200px]">{userEmail}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
