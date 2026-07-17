import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Send, ArrowLeft, Image as ImageIcon, Mic, X, Paperclip, Reply, Info, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StudyGroupChat() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      if (!groupId || !user) return;
      
      const { data: g } = await supabase.from("study_groups").select("*").eq("id", groupId).single();
      if (!g) {
        toast.error("Group not found");
        navigate("/dashboard/study-groups");
        return;
      }
      setGroup(g);
      
      const { data: m } = await supabase.from("study_group_members").select("role, users(full_name, avatar_url, email)").eq("group_id", groupId);
      if (m) setMembers(m);
      
      await loadMessages();
      setLoading(false);
    }
    init();
  }, [groupId, user]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("group_discussions")
      .select(`
        *,
        users (full_name, avatar_url),
        parent:parent_id (content, users(full_name))
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
      
    if (data) setMessages(data);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (fileUrl: string | null = null, fileType: string | null = null, forceText?: string) => {
    const textToSend = forceText !== undefined ? forceText : inputText.trim();
    if (!textToSend && !fileUrl) return;
    
    setSending(true);
    try {
      let finalContent = textToSend;
      if (fileUrl) {
        if (fileType?.startsWith('image/')) finalContent = `[Image] ${fileUrl}`;
        else if (fileType?.startsWith('audio/')) finalContent = `[Audio] ${fileUrl}`;
        else finalContent = `[Attachment] ${fileUrl}`;
      }

      const { error } = await supabase.from("group_discussions").insert({
        group_id: groupId,
        user_id: user?.id,
        content: finalContent,
        parent_id: replyingTo?.id || null
      });

      if (error) throw error;
      
      setInputText("");
      setReplyingTo(null);
      await loadMessages();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${groupId}/${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage.from("chat_attachments").upload(filePath, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);
      await handleSend(publicUrl, file.type, "");
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        setUploading(true);
        try {
          const filePath = `${groupId}/${user?.id}-voice-${Date.now()}.webm`;
          const { error } = await supabase.storage.from("chat_attachments").upload(filePath, audioBlob);
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);
          await handleSend(publicUrl, 'audio/webm', "");
        } catch (e: any) {
          toast.error("Voice upload failed: " + e.message);
        } finally {
          setUploading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    const { error } = await supabase.from("group_discussions").delete().eq("id", msgId);
    if (error) toast.error(error.message);
    else {
      toast.success("Message deleted");
      await loadMessages();
    }
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith("[Image] ")) {
      const url = content.replace("[Image] ", "");
      return <img src={url} alt="Attachment" className="max-w-[200px] sm:max-w-[300px] rounded-lg mt-1" />;
    }
    if (content.startsWith("[Audio] ")) {
      const url = content.replace("[Audio] ", "");
      return <audio controls src={url} className="mt-1 max-w-[200px] sm:max-w-xs" />;
    }
    if (content.startsWith("[Attachment] ")) {
      const url = content.replace("[Attachment] ", "");
      return <a href={url} target="_blank" rel="noreferrer" className="underline text-blue-200">View Attachment</a>;
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white/50 backdrop-blur-md rounded-2xl border border-white/40 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm p-4 flex items-center gap-3 border-b border-white/20 shadow-sm shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/study-groups")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[#13273f] text-lg truncate">{group?.name}</h2>
          <p className="text-xs text-[#36492e]/70 truncate">{group?.course_name}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Group Info">
              <Info className="w-5 h-5 text-[#13273f]" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#13273f]">{group?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Course</p>
                <p className="text-sm font-medium">{group?.course_name}</p>
              </div>
              {group?.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-foreground/90">{group.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Members ({members.length})
                </p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 overflow-hidden">
                          {m.users?.avatar_url ? (
                            <img src={m.users.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-primary font-bold">
                              {m.users?.full_name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.users?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.users?.email}</p>
                        </div>
                      </div>
                      {m.role === "owner" && (
                        <div className="flex items-center gap-1 shrink-0 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          <Shield className="w-3 h-3" /> Admin
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollRef as any}>
        <div ref={scrollRef} className="space-y-4 pb-4">
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Reply Bubble Context */}
                  {msg.parent && (
                    <div className={`text-xs p-2 mb-1 rounded-lg opacity-80 border-l-2 truncate max-w-full ${isMe ? 'bg-primary/20 text-[#13273f] border-[#13273f]' : 'bg-white/50 text-[#36492e] border-[#36492e]'}`}>
                      <span className="font-semibold block">{msg.parent.users?.full_name || 'Someone'}</span>
                      {msg.parent.content}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 overflow-hidden shadow-sm">
                        {msg.users?.avatar_url ? <img src={msg.users.avatar_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs text-primary font-bold">{msg.users?.full_name?.charAt(0)}</div>}
                      </div>
                    )}
                    
                    <div className="relative group/msg flex items-center gap-2">
                      {isMe && (
                        <div className="opacity-0 group-hover/msg:opacity-100 flex gap-1 transition-opacity">
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-white shadow-sm rounded-full" title="Reply">
                            <Reply className="w-4 h-4 text-primary" />
                          </button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 bg-white shadow-sm rounded-full" title="Unsend">
                            <X className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      )}
                      
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? 'bg-[#13273f] text-white rounded-br-sm' : 'bg-white border border-[#e9d4cd] text-[#36492e] rounded-bl-sm'}`}>
                        {!isMe && <span className="text-[10px] font-semibold opacity-70 block mb-0.5">{msg.users?.full_name}</span>}
                        {renderMessageContent(msg.content)}
                      </div>
                      
                      {!isMe && (
                        <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover/msg:opacity-100 p-1.5 bg-white shadow-sm rounded-full transition-opacity" title="Reply">
                          <Reply className="w-4 h-4 text-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {format(new Date(msg.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-white/60 p-3 sm:p-4 border-t border-white/20 shrink-0 z-10">
        
        {replyingTo && (
          <div className="mb-2 bg-primary/10 rounded-lg p-2 px-3 flex items-center justify-between border-l-2 border-primary text-sm">
            <div className="truncate">
              <span className="font-semibold text-primary block text-xs">Replying to {replyingTo.users?.full_name}</span>
              <span className="text-muted-foreground truncate">{replyingTo.content}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-black/5 rounded-full"><X className="w-4 h-4 text-muted-foreground"/></button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex gap-1 shrink-0">
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-black/5 rounded-full" disabled={uploading}>
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              </Button>
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-10 w-10 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'text-muted-foreground hover:bg-black/5'}`} 
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </div>
          
          <Input 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
            placeholder={isRecording ? "Recording voice message..." : "Type a message..."}
            className="h-11 bg-white/80 border-white/50 focus-visible:ring-primary shadow-inner rounded-xl"
            disabled={sending || isRecording}
          />
          
          <Button 
            size="icon" 
            className="h-11 w-11 rounded-xl bg-[#13273f] hover:bg-[#13273f]/90 text-white shrink-0 shadow-md transition-transform active:scale-95" 
            onClick={() => handleSend()}
            disabled={sending || (!inputText.trim() && !isRecording)}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
