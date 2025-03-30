
import React, { useState } from 'react';
import { Package } from '@/hooks/usePackages';
import { Service } from '@/hooks/useServices';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronUp, Users, Search, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PackagesTableProps {
  packages: Package[];
  services?: Record<string, Service[]>;
  clientCounts?: Record<string, number>;
  loadingServices?: Record<string, boolean>;
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onClientUsageClick?: (packageId: string) => void;
  onPackageExpand?: (packageId: string) => void;
}

export function PackagesTable({ 
  packages, 
  services = {},
  clientCounts = {},
  loadingServices = {},
  onEdit, 
  onDelete,
  searchQuery = '',
  onSearchChange,
  onClientUsageClick,
  onPackageExpand
}: PackagesTableProps) {
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'name',
    direction: 'asc'
  });

  const toggleExpanded = (packageId: string) => {
    const newExpandedState = !expandedPackages[packageId];
    
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: newExpandedState
    }));
    
    // Trigger loading of services if expanding and onPackageExpand is provided
    if (newExpandedState && onPackageExpand) {
      onPackageExpand(packageId);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPackages = [...packages].sort((a, b) => {
    if (sortConfig.key === 'price' || sortConfig.key === 'monthlyPrice' || sortConfig.key === 'discount') {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    }
  });

  return (
    <div>
      {onSearchChange && (
        <div className="flex items-center pb-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8"
            />
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer w-[180px]"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Name
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('price')}
            >
              <div className="flex items-center">
                Price
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('monthlyPrice')}
            >
              <div className="flex items-center">
                Monthly Price
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('discount')}
            >
              <div className="flex items-center">
                Discount
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('availability')}>
              <div className="flex items-center">
                Status
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center">
                Created At
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Client Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPackages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                {searchQuery ? 'No packages found matching your search' : 'No packages found'}
              </TableCell>
            </TableRow>
          ) : (
            sortedPackages.map((pkg) => (
              <React.Fragment key={pkg.id}>
                <TableRow className="cursor-pointer" onClick={() => toggleExpanded(pkg.id)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {expandedPackages[pkg.id] ? (
                        <ChevronUp className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      )}
                      {pkg.name}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(pkg.price)}</TableCell>
                  <TableCell>{pkg.monthlyPrice !== null ? formatCurrency(pkg.monthlyPrice) : '-'}</TableCell>
                  <TableCell>{pkg.discount !== null ? `${pkg.discount}%` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      pkg.availability === 'ACTIVE' ? 'default' :
                      pkg.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
                    }>
                      {pkg.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(pkg.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {clientCounts[pkg.id] !== undefined ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={clientCounts[pkg.id] > 0 ? "text-blue-500" : "text-muted-foreground"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onClientUsageClick && clientCounts[pkg.id] > 0) {
                            onClientUsageClick(pkg.id);
                          }
                        }}
                        disabled={clientCounts[pkg.id] === 0}
                      >
                        <Users className="h-4 w-4 mr-1" /> 
                        {clientCounts[pkg.id]} {clientCounts[pkg.id] === 1 ? 'client' : 'clients'}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">Loading...</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(pkg)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(pkg)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedPackages[pkg.id] && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0 border-t-0">
                      <Collapsible open={expandedPackages[pkg.id]}>
                        <CollapsibleContent className="p-4 bg-muted/50">
                          <div className="space-y-4">
                            {pkg.description && (
                              <div>
                                <h4 className="font-medium mb-1">Description</h4>
                                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                              </div>
                            )}
                            
                            <div>
                              <h4 className="font-medium mb-2">Included Services</h4>
                              {loadingServices[pkg.id] ? (
                                <div className="py-2 text-muted-foreground text-sm">Loading services...</div>
                              ) : services[pkg.id]?.length > 0 ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {services[pkg.id]?.map((service) => (
                                    <li key={service.id} className="flex items-center space-x-2 text-sm">
                                      <Badge variant="outline" className="h-6">
                                        {service.name}
                                      </Badge>
                                      {service.price && (
                                        <span className="text-muted-foreground">
                                          {formatCurrency(service.price)}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="py-2 text-muted-foreground text-sm">No services added to this package</div>
                              )}
                            </div>
                            
                            {pkg.customFields && Object.keys(pkg.customFields).length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Custom Fields</h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {Object.entries(pkg.customFields).map(([key, value]) => (
                                    <li key={key} className="text-sm">
                                      <span className="font-medium">{key}:</span>{' '}
                                      <span className="text-muted-foreground">{String(value)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
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
