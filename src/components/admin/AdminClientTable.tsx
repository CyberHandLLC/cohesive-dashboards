
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { Client, ClientStatus } from '@/types/client';
import { Column, ResponsiveTable } from '@/components/ui/responsive-table';

interface AdminClientTableProps {
  clients: Client[];
  isLoading: boolean;
  searchQuery?: string;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const AdminClientTable: React.FC<AdminClientTableProps> = ({
  clients,
  isLoading,
  searchQuery,
  onView,
  onEdit,
  onDelete
}) => {
  const getStatusBadgeClass = (status: ClientStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-amber-100 text-amber-800';
      case 'PAST': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<Client>[] = [
    {
      id: 'companyName',
      header: 'Company Name',
      cell: (client) => <span className="font-medium">{client.companyName}</span>,
      sortable: true
    },
    {
      id: 'industry',
      header: 'Industry',
      cell: (client) => client.industry || '-',
      responsive: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (client) => (
        <Badge variant="outline" className={getStatusBadgeClass(client.status)}>
          {client.status}
        </Badge>
      ),
      sortable: true
    },
    {
      id: 'contactEmail',
      header: 'Email',
      cell: (client) => client.contactEmail || '-',
      responsive: true
    },
    {
      id: 'serviceStartDate',
      header: 'Start Date',
      cell: (client) => client.serviceStartDate ? formatDate(client.serviceStartDate) : '-',
      responsive: true,
      sortable: true
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (client) => formatDate(client.createdAt),
      responsive: true,
      sortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (client) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onView(client)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit(client)}
            title="Edit client"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(client)}
            title="Delete client"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ];

  return (
    <ResponsiveTable
      columns={columns}
      data={clients}
      keyField="id"
      isLoading={isLoading}
      emptyMessage="No clients found"
      searchQuery={searchQuery}
      onRowClick={onView}
    />
  );
};

export default AdminClientTable;
