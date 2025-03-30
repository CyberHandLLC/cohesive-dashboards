
import React, { useState } from 'react';
import { Package } from '@/hooks/usePackages';
import { Service } from '@/hooks/useServices';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { ChevronDown, ChevronUp, Edit, Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface PackagesTableProps {
  packages: Package[];
  services: Record<string, Service[]> | undefined;
  clientCounts: Record<string, number> | undefined;
  loadingServices: Record<string, boolean> | undefined;
  onEdit?: (pkg: Package) => void;
  onDelete?: (pkg: Package) => void;
  searchQuery: string | undefined;
  onSearchChange: (searchQuery: string) => void;
  onClientUsageClick?: (packageId: string) => void;
  onPackageExpand?: (packageId: string) => void;
  onPackageRowClick?: (packageId: string) => void;
}

export function PackagesTable({ 
  packages, 
  services, 
  clientCounts,
  loadingServices,
  onEdit, 
  onDelete,
  searchQuery,
  onSearchChange,
  onClientUsageClick,
  onPackageExpand,
  onPackageRowClick
}: PackagesTableProps) {
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Package | null;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

  const handleSort = (key: keyof Package) => {
    setSortConfig({ 
      key, 
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' 
    });
  };

  const handleToggleExpand = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    const newExpandedRowIds = new Set(expandedRowIds);
    if (newExpandedRowIds.has(id)) {
      newExpandedRowIds.delete(id);
    } else {
      newExpandedRowIds.add(id);
      if (onPackageExpand) {
        onPackageExpand(id);
      }
    }
    setExpandedRowIds(newExpandedRowIds);
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  // Apply sorting
  const sortedPackages = [...packages].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full rounded-l-none"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  Price
                  {sortConfig.key === 'price' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Services</TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('availability')}
                >
                  Status
                  {sortConfig.key === 'availability' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Client Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No packages found.
                </TableCell>
              </TableRow>
            ) : (
              sortedPackages.map((pkg) => (
                <React.Fragment key={pkg.id}>
                  <TableRow className="cursor-pointer" onClick={() => onPackageRowClick && onPackageRowClick(pkg.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mr-1 p-0 h-6 w-6"
                          onClick={(e) => handleToggleExpand(pkg.id, e)}
                        >
                          {expandedRowIds.has(pkg.id) ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                        {pkg.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(pkg.price)}</TableCell>
                    <TableCell>{pkg.services.length}</TableCell>
                    <TableCell>
                      <Badge variant={
                        pkg.availability === 'ACTIVE' ? 'default' :
                        pkg.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
                      }>
                        {pkg.availability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {clientCounts && clientCounts[pkg.id] !== undefined ? (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClientUsageClick && onClientUsageClick(pkg.id);
                          }}
                        >
                          {clientCounts[pkg.id]} clients
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit && onEdit(pkg);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete && onDelete(pkg);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedRowIds.has(pkg.id) && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 border-t-0">
                        <div className="bg-muted/50 p-4">
                          <div className="mb-2">
                            <h4 className="font-semibold">Description:</h4>
                            <p className="text-muted-foreground text-sm">
                              {pkg.description || 'No description available'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Services included:</h4>
                            {loadingServices && loadingServices[pkg.id] ? (
                              <p className="text-sm text-muted-foreground">Loading services...</p>
                            ) : services && services[pkg.id] && services[pkg.id].length > 0 ? (
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {services[pkg.id].map((service) => (
                                  <li key={service.id} className="bg-background p-2 rounded-md">
                                    {service.name} - {formatCurrency(service.price || 0)}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No services in this package</p>
                            )}
                          </div>
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
    </div>
  );
}
