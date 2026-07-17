import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, BookOpen, Plus, Lock, Globe, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function StudyGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  
  // Create Form State
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newFaculty, setNewFaculty] = useState("");
  const [newMajor, setNewMajor] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (!user) return;
      
      // Get user profile to prioritize their major
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (profile) setUserProfile(profile);

      // Fetch Groups
      const { data: groupsData } = await supabase
        .from("study_groups")
        .select(`
          *,
          study_group_members(user_id, role),
          study_group_requests(user_id, status)
        `);
      
      if (groupsData) {
        // Sort: User's major first, then others
        const sorted = groupsData.sort((a, b) => {
          if (profile?.major_id) {
            if (a.major_id === profile.major_id && b.major_id !== profile.major_id) return -1;
            if (a.major_id !== profile.major_id && b.major_id === profile.major_id) return 1;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setGroups(sorted);
      }
      
      // Fetch faculties
      const { data: facs } = await supabase.from("faculties").select("*");
      if (facs) setFaculties(facs);

      setLoading(false);
    }
    init();
  }, [user]);

  useEffect(() => {
    if (newFaculty) {
      supabase.from("majors").select("*").eq("faculty_id", newFaculty).then(({ data }) => {
        if (data) setMajors(data);
      });
      setNewMajor("");
    }
  }, [newFaculty]);

  const handleCreateGroup = async () => {
    if (!newName || !newCourse || !newFaculty || !newMajor) return toast.error("Please fill all required fields");
    setCreateLoading(true);
    
    try {
      const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const { data: newGroup, error } = await supabase.from("study_groups").insert({
        name: newName,
        slug,
        description: newDesc,
        course_name: newCourse,
        faculty_id: newFaculty,
        major_id: newMajor,
        creator_id: user?.id,
        is_private: isPrivate
      }).select().single();

      if (error) throw error;

      // Add creator as owner
      await supabase.from("study_group_members").insert({
        group_id: newGroup.id,
        user_id: user?.id,
        role: "owner"
      });

      toast.success("Group created!");
      setCreateOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (group: any) => {
    if (!user) return;
    
    if (group.is_private) {
      const { error } = await supabase.from("study_group_requests").insert({
        group_id: group.id,
        user_id: user.id
      });
      if (error) toast.error("Failed to send request");
      else {
        toast.success("Request sent!");
        window.location.reload();
      }
    } else {
      const { error } = await supabase.from("study_group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member"
      });
      if (error) toast.error("Failed to join");
      else {
        toast.success("Joined group!");
        navigate(`/dashboard/study-groups/${group.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#36492e]">Study Groups</h1>
          <p className="text-[#36492e]/60 text-base">Find and join study groups for your courses.</p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#13273f] hover:bg-[#13273f]/80 text-white rounded-xl shadow-md h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a Study Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Algo Warriors" />
              </div>
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input value={newCourse} onChange={e => setNewCourse(e.target.value)} placeholder="e.g. Data Structures" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What is this group about?" />
              </div>
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select value={newFaculty} onValueChange={setNewFaculty}>
                  <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                  <SelectContent>
                    {faculties.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Major</Label>
                <Select value={newMajor} onValueChange={setNewMajor} disabled={!newFaculty}>
                  <SelectTrigger><SelectValue placeholder="Select Major" /></SelectTrigger>
                  <SelectContent>
                    {majors.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant={isPrivate ? "outline" : "default"} onClick={() => setIsPrivate(false)} className="flex-1">
                  <Globe className="w-4 h-4 mr-2" /> Public
                </Button>
                <Button variant={isPrivate ? "default" : "outline"} onClick={() => setIsPrivate(true)} className="flex-1">
                  <Lock className="w-4 h-4 mr-2" /> Private
                </Button>
              </div>
            </div>
            <Button onClick={handleCreateGroup} disabled={createLoading} className="w-full">
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Group"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, i) => {
          const isMember = group.study_group_members?.some((m: any) => m.user_id === user?.id);
          const hasRequested = group.study_group_requests?.some((r: any) => r.user_id === user?.id && r.status === 'pending');
          const isOwner = group.study_group_members?.some((m: any) => m.user_id === user?.id && m.role === 'owner');
          const isMyMajor = userProfile?.major_id === group.major_id;

          return (
            <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`glass-card hover:-translate-y-1 transition-all duration-300 border-[#e9d4cd] h-full flex flex-col ${isMyMajor ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#36492e]/10 rounded-lg flex items-center justify-center">
                      {group.is_private ? <Lock className="w-4 h-4 text-[#36492e]" /> : <Globe className="w-4 h-4 text-[#36492e]" />}
                    </div>
                    {isMyMajor && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1"><Check className="w-3 h-3"/> For You</span>}
                  </div>
                  <CardTitle className="text-xl text-[#36492e] truncate">{group.name}</CardTitle>
                  <CardDescription className="text-sm font-medium text-[#4e0000] truncate">
                    {group.course_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <p className="text-sm text-[#36492e]/70 line-clamp-2">
                    {group.description || "No description provided."}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-2 text-sm text-[#36492e]/60 pt-4 border-t border-[#e9d4cd]/50">
                      <Users className="w-4 h-4" />
                      <span>{group.study_group_members?.length || 0} Members</span>
                    </div>
                    
                    {isMember ? (
                      <Button onClick={() => navigate(`/dashboard/study-groups/${group.id}`)} className="w-full bg-[#13273f] text-white">
                        Enter Chat
                      </Button>
                    ) : hasRequested ? (
                      <Button variant="outline" disabled className="w-full">
                        Request Pending
                      </Button>
                    ) : (
                      <Button onClick={() => handleJoin(group)} variant="outline" className="w-full hover:bg-primary hover:text-white border-primary text-primary">
                        {group.is_private ? "Request to Join" : "Join Group"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {groups.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-[#36492e]/60">No study groups found. Be the first to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
