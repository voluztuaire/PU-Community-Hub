import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Heart, Pin, Languages, Send, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Community() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*, users(full_name, avatar_url), community_comments(*, users(full_name, avatar_url))")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newBody.trim() || !user) return toast.error("Title and body are required");
    setCreating(true);
    
    let uploadedImageUrl = null;
    if (newImage) {
      const fileExt = newImage.name.split('.').pop();
      const filePath = `community/${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("chat_attachments").upload(filePath, newImage);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);
        uploadedImageUrl = publicUrl;
      }
    }

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      category: 'general',
      title: newTitle.trim(),
      body: newBody.trim(),
      image_url: uploadedImageUrl
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Post created!");
      setCreateOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewImage(null);
      fetchPosts();
    }
    setCreating(false);
  };

  const handleDeletePost = async (id: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Post deleted");
      fetchPosts();
    }
  };

  const handleDeleteComment = async (id: string) => {
    const { error } = await supabase.from("community_comments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Comment deleted");
      fetchPosts();
    }
  };
  
  const handleLike = async (postId: string, currentLikes: number) => {
    const isLiked = likedPosts.includes(postId);
    const newLikes = isLiked ? Math.max(0, (currentLikes || 0) - 1) : (currentLikes || 0) + 1;
    
    if (isLiked) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
    } else {
      setLikedPosts([...likedPosts, postId]);
    }

    setPosts(posts.map(p => p.id === postId ? { ...p, upvotes_count: newLikes } : p));
    await supabase.from("community_posts").update({ upvotes_count: newLikes }).eq("id", postId);
  };

  const handleTranslate = async (postId: string, text: string) => {
    if (translations[postId]) {
      const newT = { ...translations };
      delete newT[postId];
      setTranslations(newT);
      return;
    }
    
    setTranslatingId(postId);
    try {
      const res = await fetch("http://127.0.0.1:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.status === "success") {
        setTranslations(prev => ({ ...prev, [postId]: data.translated_text }));
      }
    } catch (e) {
      console.error(e);
    }
    setTranslatingId(null);
  };

  const submitReply = async (postId: string) => {
    if (!replyText.trim() || !user) return;
    
    const { error } = await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: user.id,
      body: replyText
    });
    
    if (!error) {
      setReplyText("");
      fetchPosts();
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
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#13273f]">Community</h1>
          <p className="text-[#13273f]/60 text-base">Connect, share, and engage with your peers.</p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#13273f] hover:bg-[#13273f]/80 text-white rounded-xl shadow-md h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                placeholder="Post title..." 
              />
              <Textarea 
                value={newBody} 
                onChange={e => setNewBody(e.target.value)} 
                placeholder="What's on your mind?" 
                className="min-h-[120px]"
              />
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Attach Image (Optional)</Label>
                <Input type="file" accept="image/*" onChange={e => setNewImage(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button onClick={handleCreatePost} disabled={creating} className="w-full">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`glass-card border-[#e9d4cd] overflow-hidden ${post.is_pinned ? 'bg-[#e9d4cd]/20 border-[#13273f]/20' : ''}`}>
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div className="flex items-center gap-3">
                  <img 
                    src={post.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full bg-white border border-[#e9d4cd]" 
                  />
                  <div>
                    <CardTitle className="text-lg text-[#13273f]">{post.title}</CardTitle>
                    <p className="text-sm text-[#13273f]/60">
                      {post.users?.full_name} • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.is_pinned && (
                    <div className="p-1.5 bg-[#4e0000]/10 rounded-full text-[#4e0000]">
                      <Pin className="w-4 h-4" />
                    </div>
                  )}
                  {user?.id === post.user_id && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeletePost(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {post.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-[#e9d4cd] bg-black/5">
                    <img src={post.image_url} alt="Post attachment" className="w-full max-h-[400px] object-contain" />
                  </div>
                )}
                <div className="text-[#13273f]/80 whitespace-pre-wrap">
                  {post.body}
                </div>
                
                {translations[post.id] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 px-4 pb-4 pt-8 rounded-xl bg-[#13273f]/5 border border-[#13273f]/10 text-[#13273f]/90 relative"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#13273f]/50 absolute top-2 right-3">Translated</span>
                    {translations[post.id]}
                  </motion.div>
                )}
                
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#e9d4cd]/50">
                  <button 
                    onClick={() => handleLike(post.id, post.upvotes_count)}
                    className={`flex items-center gap-2 text-sm transition-colors ${likedPosts.includes(post.id) ? 'text-[#4e0000]' : 'text-[#13273f]/60 hover:text-[#4e0000]'}`}
                  >
                    <Heart className="w-5 h-5" />
                    <span>{post.upvotes_count || 0}</span>
                  </button>
                  <button 
                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-sm text-[#13273f]/60 hover:text-[#13273f] transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>{post.community_comments?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleTranslate(post.id, post.body)}
                    disabled={translatingId === post.id}
                    className="flex items-center gap-2 text-sm text-[#13273f]/60 hover:text-[#13273f] transition-colors ml-auto"
                  >
                    {translatingId === post.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Languages className="w-5 h-5" />
                    )}
                    <span>{translations[post.id] ? 'Original' : 'Translate'}</span>
                  </button>
                </div>
                
                <AnimatePresence>
                  {replyingTo === post.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-black/5 overflow-hidden"
                    >
                      {/* Comments List */}
                      {post.community_comments && post.community_comments.length > 0 && (
                        <div className="space-y-4 mb-4">
                          {post.community_comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-3 group relative">
                              <img src={comment.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} alt="avatar" className="w-8 h-8 rounded-full border border-black/5" />
                              <div className="bg-[#13273f]/5 rounded-2xl rounded-tl-none p-3 flex-1 relative">
                                <p className="font-semibold text-sm text-[#13273f]">{comment.users?.full_name}</p>
                                <p className="text-sm text-[#13273f]/80 mt-1">{comment.body}</p>
                                
                                {user?.id === comment.user_id && (
                                  <button onClick={() => handleDeleteComment(comment.id)} className="absolute top-2 right-2 p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reply Input */}
                      <div className="flex items-center gap-3">
                        <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="avatar" className="w-8 h-8 rounded-full border border-black/5 shrink-0" />
                        <div className="flex-1 relative flex items-center">
                          <input 
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitReply(post.id)}
                            placeholder="Write a reply..."
                            className="w-full bg-[#13273f]/5 border border-[#13273f]/10 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f]/20"
                          />
                          <button 
                            onClick={() => submitReply(post.id)}
                            className="absolute right-2 p-1 text-[#13273f]/60 hover:text-[#13273f]"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#13273f]/60">No community posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
