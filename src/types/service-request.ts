
export type ServiceRequestStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED';

export interface ServiceRequest {
  id: string;
  userId: string;
  serviceId: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone?: string | null;
  message: string;
  status: ServiceRequestStatus;
  createdAt: string;
  processedAt?: string | null;
  service?: {
    name: string;
    description?: string;
    price: number;
    features: string[];
  };
}
