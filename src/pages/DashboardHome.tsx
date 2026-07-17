import { Card } from "@/components/ui/card";
import { Users, FileText, CalendarDays, MoreHorizontal, Link as LinkIcon, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardHome() {
  const { user } = useAuth();
  
  const [counts, setCounts] = useState({ groups: 0, posts: 0, events: 0 });
  const [recentData, setRecentData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Counts
      const { count: gCount } = await supabase.from("study_group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: eCount } = await supabase.from("events").select("*", { count: "exact", head: true }).gte("start_at", new Date().toISOString());
      const { count: pCount } = await supabase.from("community_posts").select("*", { count: "exact", head: true });
      
      setCounts({ groups: gCount || 0, posts: pCount || 0, events: eCount || 0 });

      // Recent Activity
      const { data: latestGroups } = await supabase.from("study_groups").select("name, created_at").order("created_at", { ascending: false }).limit(2);
      const { data: latestEvents } = await supabase.from("events").select("title, created_at").order("created_at", { ascending: false }).limit(2);
      const { data: latestPosts } = await supabase.from("community_posts").select("title, created_at").order("created_at", { ascending: false }).limit(2);
      
      const combined = [
        ...(latestGroups || []).map(g => ({ name: g.name, type: "Study Group", owner: `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.name}`, date: new Date(g.created_at).toLocaleString(), size: "-", icon: Users, iconColor: "text-[#36492e]" })),
        ...(latestEvents || []).map(e => ({ name: e.title, type: "Event", owner: `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.title}`, date: new Date(e.created_at).toLocaleString(), size: "-", icon: CalendarDays, iconColor: "text-[#4e0000]" })),
        ...(latestPosts || []).map(p => ({ name: p.title, type: "Community Post", owner: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.title}`, date: new Date(p.created_at).toLocaleString(), size: "-", icon: MessageSquare, iconColor: "text-[#13273f]" }))
      ];
      
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentData(combined.slice(0, 5));
    };
    fetchData();
  }, [user]);

  const quickAccess = [
    { title: "My Groups", count: `${counts.groups} Active`, icon: Users, tabColor: "bg-[#4f6445]", bodyColor: "bg-[#36492e]", textColor: "text-white", url: "/dashboard/study-groups", avatars: ["https://api.dicebear.com/7.x/avataaars/svg?seed=1", "https://api.dicebear.com/7.x/avataaars/svg?seed=2", "https://api.dicebear.com/7.x/avataaars/svg?seed=3"] },
    { title: "Community Posts", count: `${counts.posts} Posts`, icon: MessageSquare, tabColor: "bg-[#a65624]", bodyColor: "bg-[#8c4315]", textColor: "text-white", url: "/dashboard/community", avatars: ["https://api.dicebear.com/7.x/avataaars/svg?seed=4", "https://api.dicebear.com/7.x/avataaars/svg?seed=5"] },
    { title: "Upcoming Events", count: `${counts.events} Soon`, icon: CalendarDays, tabColor: "bg-[#780000]", bodyColor: "bg-[#4e0000]", textColor: "text-white", url: "/dashboard/events", avatars: ["https://api.dicebear.com/7.x/avataaars/svg?seed=6", "https://api.dicebear.com/7.x/avataaars/svg?seed=7", "https://api.dicebear.com/7.x/avataaars/svg?seed=8"] },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#36492e]">
          Welcome, {user?.email?.split('@')[0] || 'Student'}
        </h1>
        <p className="text-[#36492e]/60 text-base">Your academic workspace is ready.</p>
      </div>

      {/* Quick Access (Folders) */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold tracking-wider text-[#13273f] uppercase">Quick Access</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {quickAccess.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link to={item.url} className="group block">
                {/* Folder Design */}
                <div className="relative pt-3">
                  {/* Folder Tab */}
                  <div className={`absolute top-0 left-0 w-1/3 h-6 rounded-t-2xl ${item.tabColor} z-0`} style={{ clipPath: 'polygon(0 0, 85% 0, 100% 100%, 0% 100%)' }}></div>
                  
                  {/* Folder Body */}
                  <Card className={`relative z-10 h-32 rounded-[1.5rem] rounded-tl-none p-5 flex flex-col justify-between border-none shadow-sm group-hover:shadow-md transition-all ${item.bodyColor} ${item.textColor}`}>
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-bold uppercase opacity-70 tracking-widest mt-1">
                        {item.count}
                      </div>
                      {/* Overlapping Avatars */}
                      <div className="flex -space-x-2">
                        {item.avatars.map((avatar, idx) => (
                          <img key={idx} src={avatar} alt="Avatar" className={`w-8 h-8 rounded-full border-2 ${item.textColor === 'text-white' ? 'border-transparent' : 'border-white'} bg-white`} />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-5 h-5 opacity-90" />
                        <h3 className="font-bold text-lg">{item.title}</h3>
                      </div>
                    </div>
                  </Card>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity / All Files */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold tracking-wider text-[#13273f] uppercase mt-8">Recent Activity</h2>
        
        <div className="bg-[#e9d4cd]/20 rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-black/5 text-xs font-semibold text-[#13273f] uppercase tracking-wider">
            <div className="col-span-6 md:col-span-6 pl-2">Name</div>
            <div className="col-span-3 hidden md:block text-center">Owner</div>
            <div className="col-span-6 md:col-span-3">Date</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-black/5">
            {recentData.length > 0 ? recentData.map((file, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-black/[0.02] transition-colors group"
              >
                {/* Name */}
                <div className="col-span-6 md:col-span-6 flex items-center gap-3 pl-2">
                  <file.icon className={`w-5 h-5 ${file.iconColor}`} />
                  <div>
                    <p className="font-semibold text-sm text-[#36492e] truncate">{file.name}</p>
                    <p className="text-xs text-[#36492e]/60">{file.type}</p>
                  </div>
                </div>

                {/* Owner */}
                <div className="col-span-3 hidden md:flex justify-center items-center">
                  <img src={file.owner} alt="Owner" className="w-7 h-7 rounded-full bg-white border border-black/5" />
                </div>

                {/* Date */}
                <div className="col-span-6 md:col-span-3 flex items-center">
                  <p className="text-sm text-[#36492e]/60">{file.date}</p>
                </div>
              </motion.div>
            )) : (
              <div className="p-8 text-center text-sm text-[#36492e]/60">
                No recent activity found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
