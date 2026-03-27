import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import DoctorDashboard from "./pages/DoctorDashboard.tsx";
import StaffDashboard from "./pages/StaffDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LangProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/*" element={<DoctorDashboard />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/*" element={<StaffDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
