import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Msg = { role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; updated_at: string };

const WELCOME: Msg = { role: "assistant", content: "Hi! I'm your PU Hub Assistant. Ask me about study groups, Q&A, events, or how to use anything in the app." };

export const AIChatbot = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, [messages, open]);

  const loadSessions = async () => {
    if (!user) return;
    const { data } = await supabase.from("chatbot_sessions").select("id, title, updated_at")
      .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20);
    setSessions((data ?? []) as any);
  };

  useEffect(() => { if (open) loadSessions(); }, [open, user]);

  const loadSession = async (id: string) => {
    const { data } = await supabase.from("chatbot_messages").select("role, content")
      .eq("session_id", id).order("created_at");
    const msgs = ((data ?? []) as any[]).map((m) => ({ role: m.role, content: m.content })) as Msg[];
    setMessages(msgs.length ? msgs : [WELCOME]);
    setCurrentSession(id);
    setShowHistory(false);
  };

  const newChat = () => {
    setMessages([WELCOME]);
    setCurrentSession(null);
    setShowHistory(false);
  };

  const deleteSession = async (id: string) => {
    await supabase.from("chatbot_sessions").delete().eq("id", id);
    if (currentSession === id) newChat();
    loadSessions();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy || !user) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // Ensure session exists
      let sid = currentSession;
      if (!sid) {
        const { data: s, error: sErr } = await supabase.from("chatbot_sessions")
          .insert({ user_id: user.id, title: text.slice(0, 60) }).select("id").single();
        if (sErr) {
          if (sErr.message.includes("foreign key constraint")) {
            toast.error("Session expired (Database reset). Logging you out...");
            await supabase.auth.signOut();
            window.location.reload();
            return;
          }
          throw sErr;
        }
        sid = (s as any).id;
        setCurrentSession(sid);
      }
      // Save user message
      await supabase.from("chatbot_messages").insert({ session_id: sid!, user_id: user.id, role: "user", content: text });

      const res = await fetch("http://127.0.0.1:8000/ai-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      if (!res.ok) throw new Error("Chatbot API failed");
      const data = await res.json();
      
      const reply = data.reply ?? "…";
      setMessages([...next, { role: "assistant", content: reply }]);
      // Save assistant message + bump session
      await supabase.from("chatbot_messages").insert({ session_id: sid!, user_id: user.id, role: "assistant", content: reply });
      await supabase.from("chatbot_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sid!);
      loadSessions();
    } catch (e: any) {
      toast.error(e.message ?? "Chatbot error");
      setMessages([...next, { role: "assistant", content: "Sorry, I had trouble responding. Try again in a moment." }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(19,32,65,0.4)] hover:scale-105 transition-all flex items-center justify-center border border-white/20 backdrop-blur-md"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] glass-card rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-primary/5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary truncate">PU Hub Assistant</p>
                <p className="text-[10px] text-muted-foreground">Powered by Groq AI</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20" onClick={newChat} title="New chat">
                <Plus className="w-4 h-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20" onClick={() => setShowHistory(s => !s)} title="History">
                <History className="w-4 h-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20" onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>

          {showHistory ? (
            <ScrollArea className="flex-1 p-2">
              {sessions.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No chat history yet.</p>
              ) : (
                <div className="space-y-1">
                  {sessions.map(s => (
                    <div key={s.id} className={`flex items-center gap-1 p-2 rounded-lg hover:bg-white/40 transition-colors group ${currentSession === s.id ? "bg-white/40" : ""}`}>
                      <button onClick={() => loadSession(s.id)} className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}</p>
                      </button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10" onClick={() => deleteSession(s.id)}>
                        <Trash2 className="w-3 h-3 text-accent" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
              <div ref={scrollRef} className="space-y-3 max-h-full overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm ${m.role === "user" ? "bg-primary text-white rounded-br-sm bg-gradient-to-br from-[#132041] to-[#193656]" : "bg-white/60 text-foreground rounded-bl-sm border border-white/40"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="bg-white/60 border border-white/40 rounded-2xl px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {!showHistory && (
            <div className="border-t border-white/20 p-3 flex gap-2 bg-white/30">
              <Input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
                className="bg-white/50 border-white/40 focus-visible:ring-primary/50"
                placeholder="Ask anything…" disabled={busy} />
              <Button size="icon" onClick={send} disabled={busy || !input.trim()} className="bg-primary hover:bg-[#193656] text-white shadow-md">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
