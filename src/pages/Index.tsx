import { GraduationCap, ArrowRight, BookOpen, Users, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Index() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Futuristic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">Academic Compass</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-foreground hover:bg-white/20">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-secondary text-white shadow-lg">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/30 text-sm font-medium text-primary shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Empowering Your Academic Journey</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
          >
            Navigate Your Campus <br /> Like a Pro.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl"
          >
            Join study groups, discover events, ask questions, and get AI-powered summaries of your course materials—all in one seamless, futuristic hub.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Button asChild size="lg" className="bg-primary hover:bg-secondary text-white shadow-xl h-14 px-8 text-lg rounded-xl">
              <Link to="/login">
                Explore Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
          {[
            {
              title: "Study Groups",
              description: "Form or join groups for your classes and collaborate in real-time.",
              icon: Users,
              color: "text-blue-500",
              bg: "bg-blue-500/10"
            },
            {
              title: "AI Summaries",
              description: "Upload PDFs and instantly get topic breakdowns and flashcards via Groq AI.",
              icon: BookOpen,
              color: "text-accent",
              bg: "bg-accent/10"
            },
            {
              title: "Campus Events",
              description: "Never miss a club meeting, career fair, or workshop again.",
              icon: CalendarDays,
              color: "text-primary",
              bg: "bg-primary/10"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-8 rounded-3xl"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
