import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import DashboardShell from "@/components/layout/DashboardShell";
import SettingsPage from "./pages/SettingsPage";

// Dashboard Pages
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import StaffDashboard from "./pages/dashboards/StaffDashboard";
import ClientDashboard from "./pages/dashboards/ClientDashboard";
import ObserverDashboard from "./pages/dashboards/ObserverDashboard";

// Admin Account Pages
import ClientsPage from "./pages/accounts/ClientsPage";
import UsersPage from "./pages/accounts/UsersPage";
import UserDetailsPage from "./pages/accounts/UserDetailsPage";
import StaffManagementPage from "./pages/accounts/StaffManagementPage";
import AdminClientServicesPage from "./pages/accounts/ClientServicesPage";

// Admin Client Pages - Import the new admin client profile page
import AdminClientProfilePage from "./pages/admin/AdminClientProfilePage";
import AdminClientInvoicesPage from "./pages/admin/AdminClientInvoicesPage";
import AdminClientSupportPage from "./pages/admin/AdminClientSupportPage";
import ServiceRequestsPage from "./pages/admin/ServiceRequestsPage";

// Admin Portfolio Pages
import CategoriesPage from "./pages/portfolio/CategoriesPage";
import ServicesPage from "./pages/portfolio/ServicesPage";
import ServiceDetailPage from "./pages/portfolio/ServiceDetailPage";
import PackagesPage from "./pages/portfolio/PackagesPage";
import PackageDetailsPage from "./pages/portfolio/PackageDetailsPage";
import ServiceExpirationPage from "./pages/admin/ServiceExpirationPage";
import ServiceDashboardsPage from "./pages/admin/services/ServiceDashboardsPage";

// Admin Document Pages
import InvoicesPage from "./pages/documents/InvoicesPage";
import RecurringBillingPage from "./pages/documents/RecurringBillingPage";
import ReportsPage from "./pages/documents/ReportsPage";

// Admin Engagement Pages
import ContentManagementPage from "./pages/engagements/ContentManagementPage";
import LeadManagementPage from "./pages/engagements/LeadManagementPage";

// Client Pages
import ClientProfilePage from "./pages/client/ProfilePage";
import ClientServicePage from "./pages/client/ServicesPage";
import ClientInvoicesPage from "./pages/client/InvoicesPage";
import ClientSupportPage from "./pages/client/SupportPage";
import ClientContactsPage from "./pages/client/ContactsPage";

// Observer Pages
import ObserverServicesPage from "./pages/observer/ServicesPage";
import ObserverPackagesPage from "./pages/observer/PackagesPage";
import ObserverBlogPage from "./pages/observer/BlogPage";
import ObserverContactPage from "./pages/observer/ContactPage";

// Add import for the new StaffDetailsPage
import StaffDetailsPage from "./pages/accounts/StaffDetailsPage";

// Service Dashboard Pages
import ClientServiceDashboardPage from "./pages/services/ClientServiceDashboardPage";

// Service Lifecycle Pages
import AdminServiceLifecyclePage from "./pages/admin/services/ServiceLifecyclePage";
import ClientServiceLifecyclePage from "./pages/client/services/ServiceLifecyclePage";

// Staff Pages
import StaffClientsPage from "./pages/staff/StaffClientsPage";
import StaffSupportPage from "./pages/staff/StaffSupportPage";
import StaffLeadsPage from "./pages/staff/StaffLeadsPage";
import StaffTasksPage from "./pages/staff/StaffTasksPage";

const queryClient = new QueryClient();

// Helper component to wrap dashboard routes with DashboardShell
const DashboardRoute = ({ element }) => {
  return <DashboardShell>{element}</DashboardShell>;
};

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
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<DashboardRoute element={<AdminDashboard />} />} />
          
          {/* Admin Account Routes */}
          <Route path="/admin/accounts/clients" element={<DashboardRoute element={<ClientsPage />} />} />
          <Route path="/admin/accounts/clients/services" element={<DashboardRoute element={<AdminClientServicesPage />} />} />
          <Route path="/admin/accounts/users" element={<DashboardRoute element={<UsersPage />} />} />
          <Route path="/admin/accounts/users/:id" element={<DashboardRoute element={<UserDetailsPage />} />} />
          <Route path="/admin/accounts/staff" element={<DashboardRoute element={<StaffManagementPage />} />} />
          <Route path="/admin/accounts/staff/:id" element={<DashboardRoute element={<StaffDetailsPage />} />} />
          
          {/* Admin Client Detail Routes - Updated with consistent paths */}
          <Route path="/admin/accounts/clients/:id/overview" element={<DashboardRoute element={<AdminClientProfilePage />} />} />
          <Route path="/admin/accounts/clients/:id/services" element={<DashboardRoute element={<AdminClientServicesPage />} />} />
          <Route path="/admin/accounts/clients/:id/invoices" element={<DashboardRoute element={<AdminClientInvoicesPage />} />} />
          <Route path="/admin/accounts/clients/:id/support" element={<DashboardRoute element={<AdminClientSupportPage />} />} />
          <Route path="/admin/accounts/clients/:id/contacts" element={<DashboardRoute element={<ClientContactsPage />} />} />
          
          {/* Service Dashboard Routes */}
          <Route path="/admin/accounts/clients/:clientId/service-dashboard" element={<DashboardRoute element={<ClientServiceDashboardPage />} />} />
          <Route path="/admin/accounts/clients/:clientId/service-dashboard/:serviceId" element={<DashboardRoute element={<ClientServiceDashboardPage />} />} />
          
          {/* Service Lifecycle Routes - Admin */}
          <Route path="/admin/accounts/clients/:clientId/services/:serviceId/lifecycle" element={<DashboardRoute element={<AdminServiceLifecyclePage />} />} />
          
          {/* Add the collective support page route */}
          <Route path="/admin/accounts/clients/support" element={<DashboardRoute element={<AdminClientSupportPage />} />} />
          
          {/* Admin Portfolio Routes */}
          <Route path="/admin/portfolio/categories" element={<DashboardRoute element={<CategoriesPage />} />} />
          <Route path="/admin/portfolio/services" element={<DashboardRoute element={<ServicesPage />} />} />
          <Route path="/admin/portfolio/services/:id" element={<DashboardRoute element={<ServiceDetailPage />} />} />
          <Route path="/admin/portfolio/packages" element={<DashboardRoute element={<PackagesPage />} />} />
          <Route path="/admin/portfolio/packages/:id" element={<DashboardRoute element={<PackageDetailsPage />} />} />
          <Route path="/admin/portfolio/service-expirations" element={<DashboardRoute element={<ServiceExpirationPage />} />} />
          <Route path="/admin/portfolio/service-dashboards" element={<DashboardRoute element={<ServiceDashboardsPage />} />} />
          
          {/* Admin Document Routes */}
          <Route path="/admin/documents/invoices" element={<DashboardRoute element={<InvoicesPage />} />} />
          <Route path="/admin/documents/recurring-billing" element={<DashboardRoute element={<RecurringBillingPage />} />} />
          <Route path="/admin/documents/reports" element={<DashboardRoute element={<ReportsPage />} />} />
          
          {/* Admin Engagement Routes */}
          <Route path="/admin/engagements/content" element={<DashboardRoute element={<ContentManagementPage />} />} />
          <Route path="/admin/engagements/leads" element={<DashboardRoute element={<LeadManagementPage />} />} />
          <Route path="/admin/engagements/service-requests" element={<DashboardRoute element={<ServiceRequestsPage />} />} />
          
          {/* Admin Settings */}
          <Route path="/admin/settings" element={<DashboardRoute element={<SettingsPage />} />} />

          {/* Staff Routes */}
          <Route path="/staff" element={<DashboardRoute element={<StaffDashboard />} />} />
          <Route path="/staff/accounts/clients" element={<DashboardRoute element={<StaffClientsPage />} />} />
          <Route path="/staff/accounts/support" element={<DashboardRoute element={<StaffSupportPage />} />} />
          <Route path="/staff/accounts/leads" element={<DashboardRoute element={<StaffLeadsPage />} />} />
          <Route path="/staff/tasks" element={<DashboardRoute element={<StaffTasksPage />} />} />

          {/* Client Routes */}
          <Route path="/client" element={<DashboardRoute element={<ClientDashboard />} />} />
          <Route path="/client/accounts/services" element={<DashboardRoute element={<ClientServicePage />} />} />
          <Route path="/client/accounts/services/dashboard/:serviceId" element={<DashboardRoute element={<ClientServiceDashboardPage />} />} />
          
          {/* Service Lifecycle Routes - Client */}
          <Route path="/client/accounts/services/:serviceId/lifecycle" element={<DashboardRoute element={<ClientServiceLifecyclePage />} />} />
          
          <Route path="/client/accounts/invoices" element={<DashboardRoute element={<ClientInvoicesPage />} />} />
          <Route path="/client/accounts/support" element={<DashboardRoute element={<ClientSupportPage />} />} />
          <Route path="/client/accounts/profile" element={<DashboardRoute element={<ClientProfilePage />} />} />

          {/* Observer Routes */}
          <Route path="/observer" element={<DashboardRoute element={<ObserverDashboard />} />} />
          <Route path="/observer/explore/services" element={<DashboardRoute element={<ObserverServicesPage />} />} />
          <Route path="/observer/explore/packages" element={<DashboardRoute element={<ObserverPackagesPage />} />} />
          <Route path="/observer/explore/blog" element={<DashboardRoute element={<ObserverBlogPage />} />} />
          <Route path="/observer/explore/contact" element={<DashboardRoute element={<ObserverContactPage />} />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
