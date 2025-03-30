
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { ClientService } from '@/types/client';
import { Column, ResponsiveTable } from '@/components/ui/responsive-table';

interface ClientServiceTableProps {
  services: ClientService[];
  isLoading: boolean;
  searchQuery?: string;
  onViewDetails: (service: ClientService) => void;
}

const ClientServiceTable: React.FC<ClientServiceTableProps> = ({
  services,
  isLoading,
  searchQuery,
  onViewDetails
}) => {
  const columns: Column<ClientService>[] = [
    {
      id: 'name',
      header: 'Service',
      cell: (service) => (
        <span className="font-medium">{service.service?.name || 'Unknown Service'}</span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: (service) => (
        <Badge 
          variant={service.status === 'ACTIVE' ? 'default' : 'outline'}
          className={service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        >
          {service.status}
        </Badge>
      )
    },
    {
      id: 'price',
      header: 'Price',
      cell: (service) => formatCurrency(service.price),
      responsive: true
    },
    {
      id: 'startDate',
      header: 'Start Date',
      cell: (service) => formatDate(service.startDate),
      responsive: true
    },
    {
      id: 'endDate',
      header: 'End Date',
      cell: (service) => service.endDate ? formatDate(service.endDate) : 'Ongoing',
      responsive: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (service) => (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(service);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: "text-right"
    }
  ];

  return (
    <ResponsiveTable
      columns={columns}
      data={services}
      keyField="id"
      isLoading={isLoading}
      emptyMessage="No services found"
      searchQuery={searchQuery}
      onRowClick={onViewDetails}
    />
  );
};

export default ClientServiceTable;
