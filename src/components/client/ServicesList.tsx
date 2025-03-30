
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ClientService } from '@/types/client';

interface ServicesListProps {
  services: ClientService[];
  isLoading: boolean;
  onViewDetails: (service: ClientService) => void;
  onResetFilters: () => void;
  hasFilters: boolean;
}

const ServicesList: React.FC<ServicesListProps> = ({
  services,
  isLoading,
  onViewDetails,
  onResetFilters,
  hasFilters
}) => {
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-amber-100 text-amber-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    SUSPENDED: 'bg-red-100 text-red-800'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading services...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No services found</p>
        {hasFilters && (
          <Button 
            variant="outline" 
            onClick={onResetFilters} 
            className="mt-4"
          >
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.service?.name}</TableCell>
              <TableCell>
                {service.service?.monthlyPrice ? (
                  <div>
                    <div>{formatCurrency(service.service.monthlyPrice)}/month</div>
                    {service.service.price && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(service.service.price)} one-time
                      </div>
                    )}
                  </div>
                ) : (
                  service.service?.price && formatCurrency(service.service.price)
                )}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-md ${
                  statusColors[service.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                }`}>
                  {service.status}
                </span>
              </TableCell>
              <TableCell>{formatDate(service.startDate)}</TableCell>
              <TableCell>{service.endDate ? formatDate(service.endDate) : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onViewDetails(service)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ServicesList;
