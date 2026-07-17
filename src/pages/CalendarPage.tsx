import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Calendar as CalendarIcon, Clock, MapPin, Plus, ListTodo, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("task");
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editType, setEditType] = useState("task");

  const loadCalendar = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_at", { ascending: true });
    
    if (error) {
      toast.error("Failed to load events");
    } else if (data) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCalendar();
  }, [user]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !title) return;
    
    setSubmitting(true);
    
    // Combine date and time
    const [hours, minutes] = time.split(':');
    const startAt = new Date(date);
    startAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 1);

    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      type,
      color: type === 'academic' ? 'primary' : 'accent'
    });

    if (error) {
      toast.error("Failed to add event: " + error.message);
    } else {
      toast.success("Event added to calendar!");
      setTitle("");
      loadCalendar(); // Reload events
    }
    setSubmitting(false);
  };

  const handleEditClick = (ev: any) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    
    const evDate = new Date(ev.start_at);
    // Format to YYYY-MM-DD for date input
    const yyyy = evDate.getFullYear();
    const mm = String(evDate.getMonth() + 1).padStart(2, '0');
    const dd = String(evDate.getDate()).padStart(2, '0');
    setEditDate(`${yyyy}-${mm}-${dd}`);
    
    // Format to HH:mm for time input
    const hh = String(evDate.getHours()).padStart(2, '0');
    const min = String(evDate.getMinutes()).padStart(2, '0');
    setEditTime(`${hh}:${min}`);
    
    setEditType(ev.type);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);

    const [yyyy, mm, dd] = editDate.split('-');
    const [hours, minutes] = editTime.split(':');
    
    const startAt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hours), parseInt(minutes), 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 1);

    const { error } = await supabase
      .from("calendar_events")
      .update({
        title: editTitle,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        type: editType,
        color: editType === 'academic' ? 'primary' : 'accent'
      })
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Failed to update event: " + error.message);
    } else {
      toast.success("Event updated successfully!");
      setEditingEvent(null);
      loadCalendar();
    }
    setSubmitting(false);
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Failed to delete event: " + error.message);
    } else {
      toast.success("Event deleted!");
      setEditingEvent(null);
      loadCalendar();
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const selectedDateEvents = events.filter(ev => date && isSameDay(new Date(ev.start_at), date));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#36492e]">My Calendar</h1>
        <p className="text-[#36492e]/60 text-base">Plan your academic schedule and daily tasks.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Calendar UI & Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card shadow-xl border-white/40 overflow-hidden">
            <CardContent className="p-0 flex justify-center bg-white/40">
              <div className="p-2 w-full flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="bg-transparent"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-xl border-white/40">
            <CardHeader className="pb-3 bg-white/30 border-b border-white/20">
              <CardTitle className="text-lg font-bold text-[#13273f] flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add New Task
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold text-[#13273f] uppercase">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Finish Math Homework" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-white/60 border-white/50 placeholder:text-[#36492e]/40 shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-xs font-bold text-[#13273f] uppercase">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="bg-white/60 border-white/50 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#13273f] uppercase">Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="bg-white/60 border-white/50 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="task">Task / To-Do</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-secondary text-white shadow-lg rounded-xl mt-2" disabled={!date || submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListTodo className="w-4 h-4 mr-2" />}
                  Save Task
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Events List */}
        <div className="lg:col-span-8 space-y-4 lg:pl-4">
          <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-[#36492e]/20">
            <h2 className="text-2xl font-bold text-[#13273f]">
              {date ? format(date, "EEEE, MMMM d") : "Schedule"}
            </h2>
            <div className="px-4 py-1.5 bg-[#13273f] rounded-full text-sm font-bold text-white shadow-md">
              {selectedDateEvents.length} items
            </div>
          </div>

          <div className="grid gap-4">
            {selectedDateEvents.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground bg-gradient-to-br from-white to-[#e9d4cd]/50 rounded-[2rem] border border-white shadow-inner">
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full shadow-md flex items-center justify-center">
                  <CalendarIcon className="w-10 h-10 text-[#36492e]" />
                </div>
                <p className="text-lg font-medium text-[#13273f]">No tasks or events scheduled.</p>
                <p className="text-[#36492e]/70 mt-1">Use the form to add something!</p>
              </div>
            ) : (
              selectedDateEvents.map(ev => {
                // Determine rich gradient based on event type
                let bgGradient = "";
                if (ev.type === 'academic') {
                  bgGradient = "bg-gradient-to-br from-[#13273f] to-[#1c3a5e] text-white"; // Dark Navy
                } else if (ev.type === 'task') {
                  bgGradient = "bg-gradient-to-br from-[#36492e] to-[#4a6340] text-white"; // Dark Olive
                } else {
                  bgGradient = "bg-gradient-to-br from-[#4e0000] to-[#6b0000] text-white"; // Dark Maroon
                }

                return (
                  <Card 
                    key={ev.id} 
                    onClick={() => handleEditClick(ev)}
                    className={`overflow-hidden border-none shadow-xl rounded-2xl ${bgGradient} transition-all hover:scale-[1.02] hover:ring-2 hover:ring-white/50 cursor-pointer duration-300`}
                  >
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold tracking-tight">{ev.title}</CardTitle>
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/20 shadow-sm backdrop-blur-md uppercase tracking-wider">
                          {ev.type}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0 pb-5 space-y-2 text-sm text-white/90">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 opacity-80" />
                        <span>{format(new Date(ev.start_at), "h:mm a")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit/Delete Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-md bg-white border-[#e9d4cd] shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#13273f]">Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your scheduled task or remove it completely.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateEvent} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-xs font-bold text-[#13273f] uppercase">Title</Label>
              <Input 
                id="edit-title" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="bg-white/60 border-[#e9d4cd] shadow-sm focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-date" className="text-xs font-bold text-[#13273f] uppercase">Date</Label>
              <Input 
                id="edit-date" 
                type="date" 
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
                className="bg-white/60 border-[#e9d4cd] shadow-sm focus-visible:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-time" className="text-xs font-bold text-[#13273f] uppercase">Time</Label>
                <Input 
                  id="edit-time" 
                  type="time" 
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="bg-white/60 border-[#e9d4cd] shadow-sm focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#13273f] uppercase">Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="bg-white/60 border-[#e9d4cd] shadow-sm focus-visible:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="task">Task / To-Do</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6 flex sm:justify-between items-center w-full">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDeleteEvent}
                disabled={submitting}
                className="rounded-xl shadow-md w-full sm:w-auto mb-2 sm:mb-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-secondary text-white rounded-xl shadow-md w-full sm:w-auto"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
