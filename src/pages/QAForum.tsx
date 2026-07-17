import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowUpCircle, Eye, MessageCircle, Languages, Send, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function QAForum() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [upvotedQuestions, setUpvotedQuestions] = useState<string[]>([]);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*, users(full_name, avatar_url), answers(*, users(full_name, avatar_url))")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setQuestions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAskQuestion = async () => {
    if (!newTitle.trim() || !newBody.trim() || !user) return toast.error("Title and body are required");
    setCreating(true);

    let finalBody = newBody.trim();
    if (newImage) {
      const fileExt = newImage.name.split('.').pop();
      const filePath = `qa/${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("chat_attachments").upload(filePath, newImage);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);
        finalBody += `\n\n[Image] ${publicUrl}`;
      }
    }

    const { error } = await supabase.from("questions").insert({
      user_id: user.id,
      title: newTitle.trim(),
      body: finalBody
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Question posted!");
      setCreateOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewImage(null);
      fetchQuestions();
    }
    setCreating(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Question deleted");
      fetchQuestions();
    }
  };

  const handleDeleteAnswer = async (id: string) => {
    const { error } = await supabase.from("answers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Answer deleted");
      fetchQuestions();
    }
  };

  const handleUpvote = async (qId: string, currentVotes: number) => {
    const isUpvoted = upvotedQuestions.includes(qId);
    const newVotes = isUpvoted ? Math.max(0, (currentVotes || 0) - 1) : (currentVotes || 0) + 1;
    
    if (isUpvoted) {
      setUpvotedQuestions(upvotedQuestions.filter(id => id !== qId));
    } else {
      setUpvotedQuestions([...upvotedQuestions, qId]);
    }

    setQuestions(questions.map(q => q.id === qId ? { ...q, upvotes_count: newVotes } : q));
    await supabase.from("questions").update({ upvotes_count: newVotes }).eq("id", qId);
  };

  const handleTranslate = async (qId: string, text: string) => {
    if (translations[qId]) {
      const newT = { ...translations };
      delete newT[qId];
      setTranslations(newT);
      return;
    }
    
    setTranslatingId(qId);
    try {
      const res = await fetch("http://127.0.0.1:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.status === "success") {
        setTranslations(prev => ({ ...prev, [qId]: data.translated_text }));
      }
    } catch (e) {
      console.error(e);
    }
    setTranslatingId(null);
  };

  const submitReply = async (qId: string) => {
    if (!replyText.trim() || !user) return;
    const { error } = await supabase.from("answers").insert({
      question_id: qId,
      user_id: user.id,
      body: replyText
    });
    
    if (!error) {
      setReplyText("");
      fetchQuestions();
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
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#36492e]">Q&A Forum</h1>
          <p className="text-[#36492e]/60 text-base">Ask questions anonymously or publicly.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#13273f] hover:bg-[#13273f]/80 text-white rounded-xl shadow-md h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                placeholder="Question title..." 
              />
              <Textarea 
                value={newBody} 
                onChange={e => setNewBody(e.target.value)} 
                placeholder="Describe your problem or question..." 
                className="min-h-[120px]"
              />
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Attach Image (Optional)</Label>
                <Input type="file" accept="image/*" onChange={e => setNewImage(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button onClick={handleAskQuestion} disabled={creating} className="w-full">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Question"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          
          const renderBody = (text: string) => {
            const parts = text.split('\n\n[Image] ');
            if (parts.length > 1) {
              return (
                <>
                  <p className="whitespace-pre-wrap mb-4">{parts[0]}</p>
                  <img src={parts[1]} alt="Attached" className="max-w-full rounded-xl border border-[#e9d4cd] bg-black/5 max-h-[400px] object-contain" />
                </>
              );
            }
            return <p className="whitespace-pre-wrap">{text}</p>;
          };

          return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-[#e9d4cd] overflow-hidden flex flex-row p-0 gap-0 transition-shadow hover:shadow-md">
              <div className="flex flex-col items-center gap-4 p-6 bg-[#36492e]/5 border-r border-[#e9d4cd]/50 min-w-[80px]">
                <button 
                  onClick={() => handleUpvote(q.id, q.upvotes_count)}
                  className={`flex flex-col items-center gap-1 transition-colors ${upvotedQuestions.includes(q.id) ? 'text-[#4e0000]' : 'text-[#36492e]/60 hover:text-[#4e0000]'}`}
                >
                  <ArrowUpCircle className="w-8 h-8" />
                  <span className="font-bold text-lg">{q.upvotes_count || 0}</span>
                </button>
                <div className="flex flex-col items-center gap-1 text-[#36492e]/40 mt-4">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">{q.views_count || 0}</span>
                </div>
              </div>
              
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    {q.tags_json && (typeof q.tags_json === 'string' ? JSON.parse(q.tags_json) : q.tags_json).map((tag: string) => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-[#36492e] bg-[#36492e]/10 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {user?.id === q.user_id && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 -mt-2 -mr-2" onClick={() => handleDeleteQuestion(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <CardTitle className="text-xl text-[#36492e] mb-3">{q.title}</CardTitle>
                <div className="text-sm text-[#36492e]/70 mb-4">
                  {renderBody(q.body)}
                </div>
                
                {translations[q.id] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 px-4 pb-4 pt-8 rounded-xl bg-[#13273f]/5 border border-[#13273f]/10 text-[#13273f]/90 relative"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#13273f]/50 absolute top-2 right-3">Translated</span>
                    {translations[q.id]}
                  </motion.div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#e9d4cd]/50">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#4e0000] hover:text-[#4e0000]/80 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {q.answers?.length || 0} Answers
                    </button>
                    <button 
                      onClick={() => handleTranslate(q.id, q.body)}
                      disabled={translatingId === q.id}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#13273f]/60 hover:text-[#13273f] transition-colors"
                    >
                      {translatingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                      {translations[q.id] ? 'Original' : 'Translate'}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-[#13273f]/80 font-medium">
                    <img src={q.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=Anon`} alt="" className="w-6 h-6 rounded-full border border-[#e9d4cd]" />
                    <span>{q.user_id ? (q.users?.full_name || 'Anonymous') : 'Anonymous'}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedQ === q.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 space-y-4"
                    >
                      {q.answers?.map((ans: any) => (
                        <div key={ans.id} className={`p-4 rounded-xl border relative group ${ans.is_accepted ? 'bg-primary/5 border-primary/20' : 'bg-white border-[#e9d4cd]'}`}>
                          {ans.is_accepted && (
                            <span className="absolute -top-3 -right-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md">
                              Accepted Answer
                            </span>
                          )}
                          <div className="flex gap-3">
                            <img src={ans.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.user_id}`} alt="" className="w-8 h-8 rounded-full border border-black/5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-[#13273f]">{ans.users?.full_name}</p>
                              <p className="text-sm text-[#13273f]/80 mt-1 whitespace-pre-wrap">{ans.body}</p>
                            </div>
                            {user?.id === ans.user_id && (
                              <button onClick={() => handleDeleteAnswer(ans.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-3 pt-2">
                        <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="" className="w-8 h-8 rounded-full border border-black/5 shrink-0" />
                        <div className="flex-1 relative flex items-center">
                          <input 
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitReply(q.id)}
                            placeholder="Write an answer..."
                            className="w-full bg-white/50 border border-[#13273f]/10 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f]/20"
                          />
                          <button 
                            onClick={() => submitReply(q.id)}
                            className="absolute right-2 p-1 text-[#13273f]/60 hover:text-[#13273f]"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
          );
        })}

        {questions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#36492e]/60">No questions found. Be the first to ask!</p>
          </div>
        )}
      </div>
    </div>
  );
}
