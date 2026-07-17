import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCalendar() {
      if (!user) return;
      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_at", { ascending: true });
      
      if (data) setEvents(data);
      setLoading(false);
    }
    loadCalendar();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#36492e]">My Calendar</h1>
        <p className="text-[#36492e]/60 text-base">Your upcoming academic schedule and tasks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Your calendar is empty. Enjoy your free time!</p>
          </div>
        ) : (
          events.map(ev => (
            <Card key={ev.id} className={`glass-card border-l-4 ${ev.color === 'primary' ? 'border-l-primary' : 'border-l-accent'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#13273f]">{ev.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[#36492e]/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(ev.start_at), "MMM d, yyyy h:mm a")}</span>
                </div>
                <div className="flex items-center gap-2 capitalize">
                  <MapPin className="w-4 h-4" />
                  <span>{ev.type.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
