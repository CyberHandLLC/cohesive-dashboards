
import { Json } from "@/integrations/supabase/types";

export interface ClientService {
  id: string;
  serviceId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  price: number | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  service?: {
    name: string;
    description: string | null;
    price: number | null;
    monthlyPrice: number | null;
    features: string[];
    customFields?: Record<string, any>;
  };
}

export interface ClientMetrics {
  activeServices: number;
  totalSpent: number;
  pendingInvoices: number;
  upcomingRenewals: number;
  openSupportTickets: number;
  lastLogin?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: any;
  status: string;
}

export interface ClientDashboardData {
  services: ClientService[];
  invoices: any[];
  supportTickets: any[];
  auditLogs: AuditLogItem[];
  metrics: ClientMetrics;
}
