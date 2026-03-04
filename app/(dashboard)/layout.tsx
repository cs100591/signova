import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F8F7F4]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top header (logo + workspace switcher) */}
        <MobileHeader />

        {/* Desktop top bar */}
        <DashboardHeader />

        {/* Main content — extra bottom padding on mobile to clear bottom nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
