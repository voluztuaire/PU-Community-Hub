import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trash2, Shield, Users, MessageSquare, Calendar, Plus, CheckCircle2,
  XCircle, Pencil, ShieldOff, ShieldCheck, HelpCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

type EventForm = {
  id?: string;
  title: string; description: string;
  event_date: string; event_time: string;
  location_or_link: string; event_type: string;
  organizer_name: string; organizer_contact: string;
  payment_status: string;
};

const blankEvent: EventForm = {
  title: "", description: "", event_date: "", event_time: "",
  location_or_link: "", event_type: "webinar",
  organizer_name: "", organizer_contact: "", payment_status: "pending",
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRole();
  const [users, setUsers] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const [eventDialog, setEventDialog] = useState(false);
  const [eventForm, setEventForm] = useState<EventForm>(blankEvent);
  const [savingEvent, setSavingEvent] = useState(false);

  const load = async () => {
    const [{ data: u }, { data: e }, { data: p }, { data: t }, { data: roles }] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("start_at", { ascending: false }),
      supabase.from("community_posts").select("*, users(full_name, avatar_url), community_comments(*, users(full_name, avatar_url))").order("created_at", { ascending: false }).limit(50),
      supabase.from("questions").select("*, users(full_name, avatar_url), answers(*, users(full_name, avatar_url))").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("*"),
    ]);
    const roleMap: Record<string, string[]> = {};
    ((roles ?? []) as any[]).forEach((r) => { (roleMap[r.user_id] ??= []).push(r.role); });
    setUsers(((u ?? []) as any[]).map((x) => ({ ...x, roles: roleMap[x.id] ?? [] })));
    setAllEvents((e ?? []) as any); setPosts((p ?? []) as any); setQuestions((t ?? []) as any);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const deletePost = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    toast.success("Post deleted"); load();
  };
  const deleteQuestion = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    toast.success("Question deleted"); load();
  };
  const deleteComment = async (id: string) => {
    await supabase.from("community_comments").delete().eq("id", id);
    toast.success("Comment deleted"); load();
  };
  const deleteAnswer = async (id: string) => {
    await supabase.from("answers").delete().eq("id", id);
    toast.success("Answer deleted"); load();
  };
  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted"); load();
  };

  const openNewEvent = () => { setEventForm(blankEvent); setEventDialog(true); };
  const openEditEvent = (ev: any) => {
    const dt = new Date(ev.start_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEventForm({
      id: ev.id,
      title: ev.title ?? "",
      description: ev.description ?? "",
      event_date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
      event_time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
      location_or_link: ev.location_or_link ?? "",
      event_type: ev.event_type ?? "webinar",
      organizer_name: ev.organizer_name ?? "",
      organizer_contact: ev.organizer_contact ?? "",
      payment_status: ev.payment_status ?? "pending",
    });
    setEventDialog(true);
  };

  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.event_date) { toast.error("Title & date required"); return; }
    setSavingEvent(true);
    const start = new Date(`${eventForm.event_date}T${eventForm.event_time || "09:00"}:00`).toISOString();
    const end = new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const payload = {
      title: eventForm.title,
      description: eventForm.description || null,
      start_at: start,
      end_at: end,
      location_or_link: eventForm.location_or_link || null,
      event_type: eventForm.event_type,
      organizer_name: eventForm.organizer_name || null,
      organizer_contact: eventForm.organizer_contact || null,
      payment_status: eventForm.payment_status,
      is_verified: eventForm.payment_status === "paid",
    };
    let error;
    if (eventForm.id) {
      ({ error } = await supabase.from("events").update(payload).eq("id", eventForm.id));
    } else {
      ({ error } = await supabase.from("events").insert({ ...payload, posted_by: user!.id, status: "upcoming" }));
    }
    setSavingEvent(false);
    if (error) { toast.error(error.message); return; }
    toast.success(eventForm.id ? "Event updated" : "Event published");
    setEventDialog(false);
    load();
  };

  const verifyEvent = async (id: string, verified: boolean) => {
    await supabase.from("events").update({
      is_verified: verified,
      payment_status: verified ? "paid" : "pending",
    }).eq("id", id);
    toast.success(verified ? "Event verified" : "Verification removed");
    load();
  };

  const toggleAdmin = async (u: any) => {
    if (u.id === user?.id) { toast.error("You can't change your own role"); return; }
    const isAdminRole = u.roles.includes("admin");
    if (isAdminRole) {
      await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
      toast.success(`Removed admin from ${u.full_name}`);
    } else {
      await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
      toast.success(`${u.full_name} is now admin`);
    }
    load();
  };

  const stats = [
    { label: "Users", value: users.length, icon: Users, bgColor: "bg-[#36492e]", textColor: "text-white", iconColor: "text-white/70" },
    { label: "Events", value: allEvents.length, icon: Calendar, bgColor: "bg-[#4e0000]", textColor: "text-white", iconColor: "text-white/70" },
    { label: "Pending Verification", value: allEvents.filter(e => !e.is_verified).length, icon: Shield, bgColor: "bg-[#8c4315]", textColor: "text-white", iconColor: "text-white/70" },
    { label: "Community Posts", value: posts.length, icon: MessageSquare, bgColor: "bg-[#13273f]", textColor: "text-white", iconColor: "text-white/70" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#13273f]" />
          <div>
            <h1 className="text-2xl font-bold text-[#13273f]">Admin Dashboard</h1>
            <p className="text-sm text-[#13273f]/60">Manage content, users, and event listings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className={`border-none shadow-md ${s.bgColor} ${s.textColor} rounded-[1.5rem]`}>
            <CardContent className="pt-5 pb-5">
              <s.icon className={`w-5 h-5 mb-3 ${s.iconColor}`} />
              <p className="text-3xl font-bold mb-1">{s.value}</p>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-90">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events" className="flex flex-col gap-6">
        <TabsList className="bg-[#e9d4cd]/40 h-auto p-2 rounded-2xl w-full justify-start overflow-x-auto gap-2">
          <TabsTrigger value="events" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Event Management</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Users & Roles</TabsTrigger>
          <TabsTrigger value="posts" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Community</TabsTrigger>
          <TabsTrigger value="qa" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Q&A</TabsTrigger>
        </TabsList>

        {/* EVENT MANAGEMENT */}
        <TabsContent value="events" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Event Management</CardTitle>
                <p className="text-xs text-muted-foreground">Manually upload and verify events after receiving payment from organizers.</p>
              </div>
              <Button onClick={openNewEvent} size="sm"><Plus className="w-4 h-4 mr-1" />New Event</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {allEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No events yet.</p>
              ) : allEvents.map(ev => (
                <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{ev.title}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{ev.event_type}</Badge>
                      {ev.is_verified ? (
                        <Badge className="text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">Payment: {ev.payment_status ?? "pending"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(ev.start_at), "PPP · HH:mm")} · {ev.location_or_link ?? "—"}
                    </p>
                    {ev.organizer_name && (
                      <p className="text-xs text-muted-foreground">Organizer: {ev.organizer_name}{ev.organizer_contact ? ` · ${ev.organizer_contact}` : ""}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {ev.is_verified ? (
                      <Button size="icon" variant="ghost" title="Unverify" onClick={() => verifyEvent(ev.id, false)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" title="Verify payment" onClick={() => verifyEvent(ev.id, true)}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => openEditEvent(ev)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteEvent(ev.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS & ROLES */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Accounts</CardTitle>
              <p className="text-xs text-muted-foreground">View user details and manage admin permissions.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}{u.student_id ? ` · ID: ${u.student_id}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.roles.map((r: string) => (
                      <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>
                    ))}
                    {u.id !== user?.id && (
                      <Button size="sm" variant="ghost" onClick={() => toggleAdmin(u)}>
                        {u.roles.includes("admin")
                          ? <><ShieldOff className="w-3 h-3 mr-1" />Revoke</>
                          : <><ShieldCheck className="w-3 h-3 mr-1" />Make Admin</>}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMUNITY */}
        <TabsContent value="posts" className="space-y-4 mt-6">
          {posts.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No posts.</p> :
            posts.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{p.users?.full_name || "Unknown User"}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, HH:mm")}</span>
                      </div>
                      {p.title && <p className="text-sm font-medium">{p.title}</p>}
                      <p className="text-sm text-muted-foreground">{p.body}</p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => deletePost(p.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete Post</Button>
                  </div>
                  
                  {p.community_comments && p.community_comments.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Replies ({p.community_comments.length})</p>
                      {p.community_comments.map((c: any) => (
                        <div key={c.id} className="flex items-start justify-between gap-3 bg-slate-50 p-3 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs">{c.users?.full_name || "Unknown"}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d, HH:mm")}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{c.body}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteComment(c.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        {/* Q&A */}
        <TabsContent value="qa" className="space-y-4 mt-6">
          {questions.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No questions.</p> :
            questions.map(t => (
              <Card key={t.id}>
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{t.users?.full_name || "Unknown User"}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, HH:mm")}</span>
                      </div>
                      <p className="text-sm font-medium flex items-center gap-1"><HelpCircle className="w-3 h-3" />{t.title}</p>
                      <p className="text-sm text-muted-foreground">{t.body}</p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => deleteQuestion(t.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete Question</Button>
                  </div>
                  
                  {t.answers && t.answers.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Answers ({t.answers.length})</p>
                      {t.answers.map((a: any) => (
                        <div key={a.id} className="flex items-start justify-between gap-3 bg-slate-50 p-3 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs">{a.users?.full_name || "Unknown"}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "MMM d, HH:mm")}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{a.body}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteAnswer(a.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Event create/edit dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <div className="bg-[#13273f] px-6 py-5 flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-bold tracking-wide">
              {eventForm.id ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </div>
          
          <div className="px-6 py-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Title</Label>
              <Input 
                className="bg-slate-50 border-slate-200 focus:border-[#13273f] focus:ring-1 focus:ring-[#13273f] rounded-xl h-11"
                value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
                placeholder="Enter event title"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Description</Label>
              <Textarea 
                rows={3} 
                className="bg-slate-50 border-slate-200 focus:border-[#13273f] focus:ring-1 focus:ring-[#13273f] rounded-xl resize-none"
                value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} 
                placeholder="Describe the event details..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Date</Label>
                <Input type="date" className="bg-slate-50 border-slate-200 focus:border-[#13273f] rounded-xl h-11" value={eventForm.event_date} onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Time</Label>
                <Input type="time" className="bg-slate-50 border-slate-200 focus:border-[#13273f] rounded-xl h-11" value={eventForm.event_time} onChange={e => setEventForm({ ...eventForm, event_time: e.target.value })} />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Location / Link</Label>
              <Input className="bg-slate-50 border-slate-200 focus:border-[#13273f] rounded-xl h-11" value={eventForm.location_or_link} onChange={e => setEventForm({ ...eventForm, location_or_link: e.target.value })} placeholder="Hall A or Zoom URL" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Type</Label>
                <Select value={eventForm.event_type} onValueChange={(v: string | null) => setEventForm({ ...eventForm, event_type: v || "webinar" })}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Payment Status</Label>
                <Select value={eventForm.payment_status || "pending"} onValueChange={(v: string | null) => setEventForm({ ...eventForm, payment_status: v || "pending" })}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid (verified)</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Organizer Name</Label>
                <Input className="bg-slate-50 border-slate-200 focus:border-[#13273f] rounded-xl h-11" value={eventForm.organizer_name} onChange={e => setEventForm({ ...eventForm, organizer_name: e.target.value })} placeholder="Name of organization" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#13273f]/70 uppercase tracking-wider">Contact</Label>
                <Input className="bg-slate-50 border-slate-200 focus:border-[#13273f] rounded-xl h-11" value={eventForm.organizer_contact} onChange={e => setEventForm({ ...eventForm, organizer_contact: e.target.value })} placeholder="Email or phone" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
            <Button variant="ghost" className="rounded-xl" onClick={() => setEventDialog(false)}>Cancel</Button>
            <Button onClick={saveEvent} disabled={savingEvent} className="bg-[#13273f] hover:bg-[#193656] text-white rounded-xl px-6">
              {savingEvent ? "Saving…" : eventForm.id ? "Save Changes" : "Publish Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
