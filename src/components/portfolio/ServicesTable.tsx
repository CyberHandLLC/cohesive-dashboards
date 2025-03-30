
import React, { useState } from 'react';
import { Service } from '@/hooks/useServices';
import { ServiceTier } from '@/hooks/useServiceTiers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronUp, Plus, Users, Search, ArrowUpDown, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  onTierClientUsageClick
}: ServicesTableProps) {
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'name',
    direction: 'asc'
  });

  const toggleExpanded = (serviceId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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
            <TableHead style={{ width: '30px' }}></TableHead>
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
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                {searchQuery ? 'No services found matching your search' : 'No services found'}
              </TableCell>
            </TableRow>
          ) : (
            sortedServices.map((service) => (
              <React.Fragment key={service.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(service.id)}
                    >
                      {expandedServices[service.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {service.name}
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
                      <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(service)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {expandedServices[service.id] && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0 bg-muted/30">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Service Tiers</h4>
                          <Button size="sm" onClick={() => onAddTier(service.id)}>
                            <Plus className="h-3 w-3 mr-1" /> Add Tier
                          </Button>
                        </div>
                        
                        {loadingTiers[service.id] ? (
                          <div className="text-center py-4 text-muted-foreground">Loading tiers...</div>
                        ) : !tiers[service.id] || tiers[service.id].length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No tiers for this service</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Monthly Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Client Usage</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tiers[service.id].map((tier) => (
                                <TableRow key={tier.id}>
                                  <TableCell className="font-medium">
                                    <div>
                                      {tier.name}
                                      {tier.features && tier.features.length > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1 space-x-1">
                                          {tier.features.slice(0, 2).map((feature, idx) => (
                                            <Badge key={idx} variant="outline" className="mr-1">
                                              {feature}
                                            </Badge>
                                          ))}
                                          {tier.features.length > 2 && (
                                            <Badge variant="outline">+{tier.features.length - 2} more</Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{formatCurrency(tier.price)}</TableCell>
                                  <TableCell>{tier.monthlyPrice !== null ? formatCurrency(tier.monthlyPrice) : '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      tier.availability === 'ACTIVE' ? 'success' :
                                      tier.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
                                    }>
                                      {tier.availability}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={tierClientCounts[tier.id] ? "text-primary font-medium" : "text-muted-foreground"}
                                      onClick={() => tierClientCounts[tier.id] && onTierClientUsageClick(tier.id)}
                                    >
                                      <Users className="h-4 w-4 mr-1" />
                                      {formatClientCount(tierClientCounts[tier.id] || 0)}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => onEditTier(tier)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => onDeleteTier(tier)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
