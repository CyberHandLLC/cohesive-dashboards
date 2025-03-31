
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAST';
export type ContactStatus = 'ACTIVE' | 'INACTIVE';
export type ContactType = 'PRIMARY' | 'BILLING' | 'TECHNICAL' | 'OTHER';
export type PreferredContactMethod = 'EMAIL' | 'PHONE' | 'SMS' | 'MAIL';

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

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
  clientId: string;
  status: ContactStatus;
  contactType?: ContactType | null;
  preferredContactMethod?: PreferredContactMethod | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  companyName: string;
  industry?: string | null;
  websiteUrl?: string | null;
  notes?: string | null;
  status?: ClientStatus;
  serviceStartDate?: string | null;
  serviceEndDate?: string | null;
  accountManagerId?: string | null;
  billingContactId?: string | null;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateClientData {
  companyName?: string;
  industry?: string | null;
  websiteUrl?: string | null;
  notes?: string | null;
  status?: ClientStatus;
  serviceStartDate?: string | null;
  serviceEndDate?: string | null;
  accountManagerId?: string | null;
  billingContactId?: string | null;
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
