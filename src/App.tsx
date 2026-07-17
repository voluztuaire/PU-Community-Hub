import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import DashboardLayout from "@/pages/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import StudyGroups from "@/pages/StudyGroups";
import Community from "@/pages/Community";
import QAForum from "@/pages/QAForum";
import AISummary from "@/pages/AISummary";
import EventsPage from "@/pages/EventsPage";
import CalendarPage from "@/pages/CalendarPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboard from "@/pages/AdminDashboard";
import StudyGroupChat from "@/pages/StudyGroupChat";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="study-groups" element={<StudyGroups />} />
              <Route path="study-groups/:id" element={<StudyGroupChat />} />
              <Route path="community" element={<Community />} />
              <Route path="qa" element={<QAForum />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="ai-summary" element={<AISummary />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
