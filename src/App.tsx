import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import CommunityOnlyRoute from "./components/CommunityOnlyRoute";
import Index from "./pages/Index.tsx";
import TablePage from "./pages/TablePage.tsx";
import FloodReportPage from "./pages/FloodReportPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import CommunityTelegramPage from "./pages/CommunityTelegramPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<"loading" | "auth" | "unauth">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session ? "auth" : "unauth");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "auth" : "unauth");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return authState === "auth" ? <>{children}</> : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route path="/" element={<Index />} />
            
            {/* Community-only routes */}
            <Route element={<CommunityOnlyRoute />}>
              <Route path="/table" element={<TablePage />} />
              <Route path="/laporkan" element={<FloodReportPage />} />
              <Route path="/telegram" element={<CommunityTelegramPage />} />
            </Route>
            
            {/* Available to all authenticated users */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
