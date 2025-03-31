
export type ServiceRequestStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED';

export interface ServiceRequest {
  id: string;
  userid: string;
  serviceid: string;
  firstname: string;
  lastname: string;
  companyname: string;
  email: string;
  phone?: string | null;
  message: string;
  status: ServiceRequestStatus;
  createdat: string;
  processedat?: string | null;
  service?: {
    name: string;
    description?: string;
    price: number;
    features: string[];
  };
}
