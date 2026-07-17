import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, MapPin, ExternalLink, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("events")
        .select(`
          *,
          event_rsvps(user_id)
        `)
        .order("start_at", { ascending: true });
      
      if (data) setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, []);

  const handleRSVP = async (eventId: string, hasRSVPd: boolean) => {
    if (!user) return;
    if (hasRSVPd) {
      await supabase.from("event_rsvps").delete().match({ event_id: eventId, user_id: user.id });
      toast.success("RSVP Cancelled");
    } else {
      await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
      toast.success("RSVP Successful!");
    }
    // Optimistic update
    setEvents(events.map(ev => {
      if (ev.id === eventId) {
        const rsvps = hasRSVPd 
          ? ev.event_rsvps.filter((r: any) => r.user_id !== user.id)
          : [...(ev.event_rsvps || []), { user_id: user.id }];
        return { ...ev, event_rsvps: rsvps };
      }
      return ev;
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#36492e]">Campus Events</h1>
        <p className="text-[#36492e]/60 text-base">Discover and register for upcoming events.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {events.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <p>No upcoming events at the moment.</p>
          </div>
        ) : (
          events.map(ev => {
            const hasRSVPd = ev.event_rsvps?.some((r: any) => r.user_id === user?.id);
            const rsvpCount = ev.event_rsvps?.length || 0;

            return (
              <Card key={ev.id} className="glass-card overflow-hidden flex flex-col h-full border-[#e9d4cd]">
                {ev.cover_image_url && (
                  <div className="h-48 bg-muted w-full relative">
                    <img src={ev.cover_image_url} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {ev.event_type}
                    </span>
                    <span className="text-xs text-muted-foreground">{ev.status}</span>
                  </div>
                  <CardTitle className="text-xl text-[#13273f]">{ev.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{ev.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="space-y-2 text-sm text-[#36492e]/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4e0000]" />
                      <span>{format(new Date(ev.start_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#4e0000]" />
                      <span>{ev.location_or_link || "TBA"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#4e0000]" />
                      <span>{rsvpCount} Attending</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-2">
                    {ev.external_register_url ? (
                      <Button asChild className="flex-1 bg-[#13273f] text-white">
                        <a href={ev.external_register_url} target="_blank" rel="noreferrer">
                          Register <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        variant={hasRSVPd ? "outline" : "default"} 
                        className={hasRSVPd ? "flex-1 border-[#4e0000] text-[#4e0000]" : "flex-1 bg-[#4e0000] text-white hover:bg-[#4e0000]/90"}
                        onClick={() => handleRSVP(ev.id, hasRSVPd)}
                      >
                        {hasRSVPd ? "Cancel RSVP" : "RSVP Now"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
