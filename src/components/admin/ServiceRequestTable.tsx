
import React from 'react';
import { Column, ResponsiveTable } from '@/components/ui/responsive-table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { ServiceRequest } from '@/types/service-request';
import { CheckCircle, XCircle } from 'lucide-react';

interface ServiceRequestTableProps {
  data: ServiceRequest[];
  isLoading: boolean;
  searchQuery: string;
  onProcess: (request: ServiceRequest) => void;
  onReject: (request: ServiceRequest) => void;
  onViewDetails: (request: ServiceRequest) => void;
}

const ServiceRequestTable: React.FC<ServiceRequestTableProps> = ({
  data,
  isLoading,
  searchQuery,
  onProcess,
  onReject,
  onViewDetails,
}) => {
  const columns: Column<ServiceRequest>[] = [
    {
      id: 'requestDate',
      header: 'Date',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      id: 'name',
      header: 'Name',
      cell: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      id: 'companyName',
      header: 'Company',
      cell: (row) => row.companyName,
      responsive: true,
    },
    {
      id: 'email',
      header: 'Email',
      cell: (row) => row.email,
    },
    {
      id: 'service',
      header: 'Service',
      cell: (row) => row.service?.name || 'Unknown Service',
      responsive: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => {
        const getStatusBadgeClass = () => {
          switch (row.status) {
            case 'PENDING':
              return 'bg-amber-100 text-amber-800';
            case 'PROCESSING':
              return 'bg-blue-100 text-blue-800';
            case 'APPROVED':
              return 'bg-green-100 text-green-800';
            case 'REJECTED':
              return 'bg-red-100 text-red-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };

        return (
          <Badge variant="outline" className={getStatusBadgeClass()}>
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2 justify-end">
          {row.status === 'PENDING' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onProcess(row);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Process
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(row);
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <ResponsiveTable
      columns={columns}
      data={data}
      keyField="id"
      isLoading={isLoading}
      emptyMessage="No service requests found"
      searchQuery={searchQuery}
      onRowClick={onViewDetails}
    />
  );
};

export default ServiceRequestTable;
