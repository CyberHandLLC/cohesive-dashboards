
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'ADVERTISEMENT' | 'EVENT' | 'OTHER';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  leadSource: LeadSource;
  notes?: string | null;
  followUpDate?: string | null;
  convertedClientId?: string | null;
  convertedClient?: {
    id: string;
    name: string;
    companyName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  leadsBySource: Record<string, number>;
}

export interface LeadFormValues {
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  assignedToId?: string | null;
  leadSource: LeadSource;
  notes?: string;
  followUpDate?: string | null;
}

export interface ConvertLeadFormValues {
  companyName: string;
  industry?: string;
  websiteUrl?: string;
}
