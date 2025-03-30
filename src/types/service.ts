
import { Json } from './supabase';

export type ServiceAvailability = 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
export type TierAvailability = 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  monthlyPrice: number | null;
  features: string[];
  customFields: Record<string, any> | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  availability?: ServiceAvailability;
}

export interface ServiceTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  monthlyPrice: number | null;
  features: string[];
  serviceId: string;
  availability: TierAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  monthlyPrice: number | null;
  discount: number | null;
  services: string[];
  availability: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  customFields: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  price?: number | null;
  monthlyPrice?: number | null;
  features: string[];
  categoryId: string;
  customFields?: Record<string, any>;
}

export interface UpdateServiceData {
  name?: string;
  description?: string | null;
  price?: number | null;
  monthlyPrice?: number | null;
  features?: string[];
  categoryId?: string;
  customFields?: Record<string, any> | null;
}

export interface CreateServiceTierData {
  name: string;
  description?: string;
  price: number;
  monthlyPrice?: number | null;
  features: string[];
  serviceId: string;
  availability?: TierAvailability;
}

export interface UpdateServiceTierData {
  name?: string;
  description?: string | null;
  price?: number;
  monthlyPrice?: number | null;
  features?: string[];
  availability?: TierAvailability;
}
