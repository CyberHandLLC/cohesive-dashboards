
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAST';

export interface ClientService {
  id: string;
  clientId: string;
  serviceId: string;
  status: string;
  price: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  service?: {
    name: string;
    description: string;
    price: number;
    monthlyPrice: number | null;
    features: string[];
    customFields?: Record<string, any> | null;
  };
}

export interface Client {
  id: string;
  companyName: string;
  industry: string | null;
  websiteUrl: string | null;
  notes: string | null;
  status: ClientStatus;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  accountManagerId: string | null;
  billingContactId: string | null;
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateClientData {
  companyName: string;
  industry?: string;
  websiteUrl?: string;
  notes?: string;
  status?: ClientStatus;
  serviceStartDate?: string;
  serviceEndDate?: string;
  accountManagerId?: string;
  billingContactId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateClientData {
  companyName?: string;
  industry?: string;
  websiteUrl?: string;
  notes?: string;
  status?: ClientStatus;
  serviceStartDate?: string;
  serviceEndDate?: string;
  accountManagerId?: string;
  billingContactId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ClientMetrics {
  totalServices: number;
  activeServices: number;
  pendingInvoices: number;
  totalSpent: number;
  openTickets: number;
}

export interface ClientDashboardData {
  metrics: ClientMetrics;
  recentServices: ClientService[];
  recentInvoices: any[];
  recentTickets: any[];
  recentActivity: any[];
}
