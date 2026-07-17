import { GraduationCap, ArrowRight, BookOpen, Users, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Index() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#13273f] rounded-lg shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-[#13273f] tracking-tight">PU Community Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-gray-600 hover:text-[#13273f] hover:bg-gray-100">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-[#13273f] hover:bg-[#13273f]/90 text-white shadow-md transition-all rounded-full px-6 font-semibold">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className="w-full flex flex-col items-center pb-32">
        
        {/* Hero Section - 80vh so it leaves space at the bottom, but content below is pushed down */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-full h-[85vh] min-h-[500px] overflow-hidden flex flex-col justify-center"
        >
          {/* Illustration Image (Cartoon/Vector) */}
          <img 
            src="https://cdn.pixabay.com/photo/2020/07/08/04/12/work-5382501_1280.jpg" 
            alt="Campus Illustration" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#13273f]/95 via-[#13273f]/80 to-[#13273f]/40" />
          
          {/* Hero Content */}
          <div className="relative z-10 flex flex-col justify-center px-6 md:px-20 max-w-7xl mx-auto w-full pt-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white w-fit mb-6">
                <Sparkles className="w-3 h-3 text-[#af1c1e]" />
                <span>Welcome to PU Community Hub</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-6">
                A Centralized Platform for President University Students.
              </h1>

              <p className="text-sm md:text-lg text-gray-200 max-w-lg leading-relaxed mb-10">
                Collaborate with peers, discover campus events, participate in academic discussions, and leverage AI to summarize course materials—all within a single, unified environment.
              </p>

              <Button size="lg" asChild className="bg-[#af1c1e] hover:bg-[#af1c1e]/90 text-white text-sm md:text-base font-semibold h-14 px-8 rounded-full shadow-lg w-fit transition-transform hover:-translate-y-1">
                <Link to="/login">
                  Explore Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Section Title - mt-32 pushes it down so it stays below the fold initially */}
        <div className="mt-32 mb-12 text-center max-w-2xl mx-auto px-4">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2 block">Services</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#13273f]">
            Empowering Your Academic Journey to Achieve the Extraordinary
          </h2>
        </div>

        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 max-w-[1200px] w-full px-4 md:px-6"
        >
          {/* Feature 1 (Light Card) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Collaboration</span>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#36492e] group-hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#13273f] mb-3">Study Groups</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Form or join groups tailored to your classes. Engage in real-time collaboration and share insights.
              </p>
            </div>
            <div className="mt-8 h-32 rounded-xl flex items-center justify-center bg-[#36492e]/10">
               <Users className="w-16 h-16 text-[#36492e]/40" />
            </div>
          </div>

          {/* Feature 2 (Prominent Center Card - Original Brand Navy) */}
          <div className="bg-[#13273f] p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -z-0" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Artificial Intelligence</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 leading-tight">AI Summaries & Vision</h3>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                Upload complex PDFs or lecture materials and instantly receive structured topic breakdowns and flashcards via Groq Vision AI.
              </p>
            </div>
            <div className="mt-8 flex justify-center z-10">
               <BookOpen className="w-24 h-24 text-white/20" />
            </div>
          </div>

          {/* Feature 3 (Light Card) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Campus Life</span>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#af1c1e] group-hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#13273f] mb-3">Campus Events</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Stay informed about essential activities. Never miss a club meeting or academic workshop with our integrated calendar.
              </p>
            </div>
            <div className="mt-8 h-32 rounded-xl flex items-center justify-center bg-[#af1c1e]/10">
               <CalendarDays className="w-16 h-16 text-[#af1c1e]/40" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
