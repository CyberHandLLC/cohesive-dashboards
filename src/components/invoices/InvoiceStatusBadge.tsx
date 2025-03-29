
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
  switch(status) {
    case 'PAID':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
    case 'OVERDUE':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
    case 'REFUNDED':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default InvoiceStatusBadge;
