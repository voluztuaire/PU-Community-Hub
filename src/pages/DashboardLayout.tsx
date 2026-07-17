import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { AIChatbot } from "@/components/AIChatbot";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        {/* Deep futuristic Pine background for the entire app -> Now Dark Navy */}
        <div className="min-h-screen flex w-full bg-[#13273f] relative overflow-hidden">
          
          {/* Subtle Accent Glows (Dark Maroon and Dark Navy) */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#4e0000]/40 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#13273f]/50 blur-[120px] pointer-events-none" />

          <DashboardSidebar />
          
          {/* Outer padding to create the floating app window effect */}
          <main className="flex-1 flex flex-col min-w-0 z-10 relative p-3 md:p-5 md:pl-0">
            {/* The giant rounded glass container */}
            <div className="flex-1 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#e9d4cd] flex flex-col relative">
              <header className="h-20 flex items-center justify-between px-8 bg-transparent sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-[#36492e] hover:bg-[#e9d4cd]/50 hover:text-[#36492e] transition-colors" />
                  
                  {/* Google Drive style search bar placeholder could go here */}
                  <div className="hidden md:flex items-center bg-[#e9d4cd]/40 border border-[#e9d4cd]/50 rounded-full px-4 py-2 w-96 shadow-sm">
                    <span className="text-[#36492e]/70 text-sm font-medium">Search Academic Compass...</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <NotificationBell />
                </div>
              </header>
              
              <div className="flex-1 overflow-auto px-6 pb-6 md:px-10 md:pb-10">
                <div className="max-w-7xl mx-auto">
                  <Outlet />
                </div>
              </div>
            </div>
            
            <AIChatbot />
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
