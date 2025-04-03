export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'PARTIALLY_PAID';

export type InvoicePaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CHECK' | 'CASH' | 'OTHER';

export type RecurringFrequency = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  clientServiceId?: string; // Link to the service this item is for
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentMethod: InvoicePaymentMethod | null;
  lineItems: LineItem[] | null;
  // New fields for recurring billing
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  paidAmount?: number;
  nextBillingDate?: string;
  notes?: string;
}

export interface CreateInvoiceData {
  clientId: string;
  amount: number;
  dueDate: string;
  status?: InvoiceStatus;
  paymentMethod?: InvoicePaymentMethod;
  invoiceNumber?: string;
  lineItems?: LineItem[];
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  nextBillingDate?: string;
  notes?: string;
}

export interface UpdateInvoiceData {
  amount?: number;
  status?: InvoiceStatus;
  dueDate?: string;
  paymentMethod?: InvoicePaymentMethod;
  lineItems?: LineItem[];
  paidAt?: string | null;
  paidAmount?: number;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  nextBillingDate?: string;
  notes?: string;
}

// Payment tracking interfaces
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: InvoicePaymentMethod;
  transactionId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  method: InvoicePaymentMethod;
  transactionId?: string;
  paymentDate?: string;
}

export interface InvoiceWithPayments extends Invoice {
  payments?: Payment[];
}
