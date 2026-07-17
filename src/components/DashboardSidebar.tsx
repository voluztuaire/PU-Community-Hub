import {
  LayoutDashboard, Users, MessageCircle, HelpCircle,
  Calendar, CalendarDays, GraduationCap, Settings, LogOut, Shield, Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Study Groups", url: "/dashboard/study-groups", icon: Users },
  { title: "Community", url: "/dashboard/community", icon: MessageCircle },
  { title: "Q&A Forum", url: "/dashboard/qa", icon: HelpCircle },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "AI Summary", url: "/dashboard/ai-summary", icon: Sparkles },
];

const bottomItems = [
  { title: "Profile", url: "/dashboard/profile", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  return (
    <Sidebar collapsible="icon" className="border-none !bg-[#13273f] md:bg-transparent [&>[data-sidebar=sidebar]]:!bg-[#13273f] md:[&>[data-sidebar=sidebar]]:bg-transparent !shadow-none pt-4 text-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-6 mt-2 ml-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-lg flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              {!collapsed && <span className="font-bold text-white tracking-tight text-lg drop-shadow-sm">Academic Compass</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    className="hover:bg-white/10 hover:text-white"
                    render={
                      <NavLink 
                        to={item.url} 
                        end 
                        className="text-white/80 transition-all rounded-full px-4 py-5 hover:text-white" 
                        activeClassName="bg-white text-primary font-bold shadow-md hover:bg-white hover:text-primary" 
                      />
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="hover:bg-white/10 hover:text-white"
                    render={
                      <NavLink 
                        to="/dashboard/admin" 
                        end 
                        className="text-white/80 transition-all rounded-full px-4 py-5 hover:text-white" 
                        activeClassName="bg-white text-primary font-bold shadow-md hover:bg-white hover:text-primary" 
                      />
                    }
                  >
                    <Shield className="mr-3 h-5 w-5" />
                    {!collapsed && <span className="text-sm">Admin</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mb-6">
        <SidebarMenu className="gap-2 px-2">
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                className="hover:bg-white/10 hover:text-white"
                render={
                  <NavLink 
                    to={item.url} 
                    end 
                    className="text-white/80 transition-all rounded-full px-4 py-5 hover:text-white" 
                    activeClassName="bg-white text-primary font-bold shadow-md hover:bg-white hover:text-primary" 
                  />
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-white/70 hover:bg-white/10 hover:text-red-300 transition-colors mt-2 rounded-full px-4 py-5">
              <LogOut className="mr-3 h-5 w-5" />
              {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
