import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (isSignUp) {
      supabase.from("faculties").select("*").then(({ data }) => {
        if (data) setFaculties(data);
      });
    }
  }, [isSignUp]);

  useEffect(() => {
    if (selectedFaculty) {
      supabase.from("majors").select("*").eq("faculty_id", selectedFaculty).then(({ data }) => {
        if (data) setMajors(data);
      });
      setSelectedMajor("");
    } else {
      setMajors([]);
    }
  }, [selectedFaculty]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      if (!selectedFaculty || !selectedMajor || !fullName) {
        toast.error("Please fill in all fields (Full Name, Faculty, Major).");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        // Create user profile in public.users table
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            faculty_id: selectedFaculty,
            major_id: selectedMajor,
            role: 'student'
          });
        }
        toast.success("Registration successful! You can sign in now.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleDemo = async (role: "student" | "admin") => {
    setLoading(true);
    const demoEmail = role === "admin" ? "demoadmin@student.president.ac.id" : "demostudent@student.president.ac.id";
    const demoPass = "password123";
    
    // Attempt sign in
    const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPass });
    
    if (error) {
       toast.info(`Creating ${role} demo account...`);
       const { data, error: signUpError } = await supabase.auth.signUp({ email: demoEmail, password: demoPass });
       if (signUpError) {
         toast.error("Failed to create demo account: " + signUpError.message);
       } else if (data.user) {
         await supabase.from('users').insert({
           id: data.user.id,
           email: data.user.email,
           role: role,
           full_name: role === "admin" ? "Demo Admin" : "Demo Student"
         });
         toast.success("Demo account created! Logging in...");
         
         const { error: signInErr } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPass });
         if (!signInErr) {
           navigate("/dashboard");
         } else {
           toast.error(signInErr.message);
         }
       }
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent w-full" />
          <CardHeader className="space-y-3 pb-6 pt-8">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold text-foreground">
              {isSignUp ? "Create an Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {isSignUp ? "Register to access Academic Compass" : "Sign in to your Academic Compass account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAuth} className="space-y-4">
              
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe" 
                    required 
                    className="bg-white/50 border-white/40 focus-visible:ring-primary/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@student.president.ac.id" 
                  required 
                  className="bg-white/50 border-white/40 focus-visible:ring-primary/50"
                />
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                      <SelectTrigger className="w-full bg-white/50 border-white/40 focus-visible:ring-primary/50">
                        <SelectValue placeholder="Select your faculty">
                          {faculties.find(f => f.id === selectedFaculty)?.name || "Select your faculty"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Major</Label>
                    <Select value={selectedMajor} onValueChange={setSelectedMajor} disabled={!selectedFaculty || majors.length === 0}>
                      <SelectTrigger className="w-full bg-white/50 border-white/40 focus-visible:ring-primary/50">
                        <SelectValue placeholder={selectedFaculty ? "Select your major" : "Select faculty first"}>
                          {majors.find(m => m.id === selectedMajor)?.name || (selectedFaculty ? "Select your major" : "Select faculty first")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {majors.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                  className="bg-white/50 border-white/40 focus-visible:ring-primary/50"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-secondary text-white shadow-md rounded-xl h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
              </Button>
            </form>

            <div className="text-center text-sm mt-2">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 backdrop-blur px-2 text-muted-foreground rounded-full">
                  Or try demo accounts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="outline" type="button" onClick={() => handleDemo("student")} disabled={loading} className="glass border-white/30 hover:bg-white/40 text-foreground">
                Student Demo
              </Button>
              <Button variant="outline" type="button" onClick={() => handleDemo("admin")} disabled={loading} className="glass border-white/30 hover:bg-white/40 text-foreground">
                Admin Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
