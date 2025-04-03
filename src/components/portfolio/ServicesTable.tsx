import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '@/hooks/useServices';
import { ServiceTier } from '@/hooks/useServiceTiers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users, Search, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';

interface ServicesTableProps {
  services: Service[];
  tiers: Record<string, ServiceTier[]>;
  clientCounts: Record<string, number>;
  tierClientCounts: Record<string, number>;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAddTier: (serviceId: string) => void;
  onEditTier: (tier: ServiceTier) => void;
  onDeleteTier: (tier: ServiceTier) => void;
  loadingTiers: Record<string, boolean>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClientUsageClick: (serviceId: string) => void;
  onTierClientUsageClick: (tierId: string) => void;
  onServiceExpand?: (serviceId: string) => void;
}

export function ServicesTable({
  services,
  tiers,
  clientCounts,
  tierClientCounts,
  onEdit,
  onDelete,
  onAddTier,
  onEditTier,
  onDeleteTier,
  loadingTiers,
  searchQuery,
  onSearchChange,
  onClientUsageClick,
  onTierClientUsageClick,
  onServiceExpand
}: ServicesTableProps) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'name',
    direction: 'asc'
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewServiceDetails = (serviceId: string) => {
    navigate(`/admin/portfolio/services/${serviceId}`);
  };

  const sortedServices = [...services].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    else if (sortConfig.key === 'category') {
      const categoryA = a.category?.name || '';
      const categoryB = b.category?.name || '';
      return sortConfig.direction === 'asc'
        ? categoryA.localeCompare(categoryB)
        : categoryB.localeCompare(categoryA);
    }
    else if (sortConfig.key === 'price') {
      const priceA = a.price || 0;
      const priceB = b.price || 0;
      return sortConfig.direction === 'asc'
        ? priceA - priceB
        : priceB - priceA;
    }
    else if (sortConfig.key === 'monthlyPrice') {
      const monthlyPriceA = a.monthlyPrice || 0;
      const monthlyPriceB = b.monthlyPrice || 0;
      return sortConfig.direction === 'asc'
        ? monthlyPriceA - monthlyPriceB
        : monthlyPriceB - monthlyPriceA;
    }
    else if (sortConfig.key === 'createdAt') {
      return sortConfig.direction === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // Format client count for display
  const formatClientCount = (count: number) => {
    if (count === 0) return '-';
    return count.toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services by name, description or category..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
              <div className="flex items-center">
                Name
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
              <div className="flex items-center">
                Category
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
              <div className="flex items-center">
                Price
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('monthlyPrice')}>
              <div className="flex items-center">
                Monthly Price
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Client Usage</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
              <div className="flex items-center">
                Created At
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedServices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                {searchQuery ? 'No services found matching your search' : 'No services found'}
              </TableCell>
            </TableRow>
          ) : (
            sortedServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  <div>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-medium text-left"
                      onClick={() => handleViewServiceDetails(service.id)}
                    >
                      {service.name}
                    </Button>
                    {service.features && service.features.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 space-x-1">
                        {service.features.slice(0, 2).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="mr-1">
                            {feature}
                          </Badge>
                        ))}
                        {service.features.length > 2 && (
                          <Badge variant="outline">+{service.features.length - 2} more</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{service.category?.name || '-'}</TableCell>
                <TableCell>{service.price !== null ? formatCurrency(service.price) : '-'}</TableCell>
                <TableCell>{service.monthlyPrice !== null ? formatCurrency(service.monthlyPrice) : '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={clientCounts[service.id] ? "text-primary font-medium" : "text-muted-foreground"}
                    onClick={() => clientCounts[service.id] && onClientUsageClick(service.id)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {formatClientCount(clientCounts[service.id] || 0)}
                  </Button>
                </TableCell>
                <TableCell>{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleViewServiceDetails(service.id)}
                      title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(service)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
