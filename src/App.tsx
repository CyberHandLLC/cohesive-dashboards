
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import StaffDashboard from "./pages/dashboards/StaffDashboard";
import ClientDashboard from "./pages/dashboards/ClientDashboard";
import ObserverDashboard from "./pages/dashboards/ObserverDashboard";

// Account Pages
import ClientsPage from "./pages/accounts/ClientsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/accounts/clients" element={<ClientsPage />} />

          {/* Staff Routes */}
          <Route path="/staff" element={<StaffDashboard />} />

          {/* Client Routes */}
          <Route path="/client" element={<ClientDashboard />} />

          {/* Observer Routes */}
          <Route path="/observer" element={<ObserverDashboard />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
