
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'ADVERTISEMENT' | 'EVENT' | 'OTHER';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  leadSource: LeadSource;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId: string | null;
  convertedClientId: string | null;
  assignedTo?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  convertedClient?: {
    id: string;
    companyName: string;
  };
}

export interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  status?: LeadStatus;
  leadSource?: LeadSource;
  notes?: string;
  followUpDate?: string;
  assignedToId?: string;
}

export interface UpdateLeadData {
  name?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  leadSource?: LeadSource;
  notes?: string;
  followUpDate?: string;
  assignedToId?: string;
  convertedClientId?: string;
}
