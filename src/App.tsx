import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";
import DailyPlanner from "./pages/DailyPlanner";
import Habits from "./pages/Habits";
import Reflections from "./pages/Reflections";
import Insights from "./pages/Insights";
import Photos from "./pages/Photos";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/planner" element={<ProtectedRoute><DailyPlanner /></ProtectedRoute>} />
                <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
                <Route path="/reflections" element={<ProtectedRoute><Reflections /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                <Route path="/photos" element={<ProtectedRoute><Photos /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
