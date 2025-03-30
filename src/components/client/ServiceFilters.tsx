
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ServiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string | null;
  onStatusChange: (value: string | null) => void;
  onReset: () => void;
  showResetButton: boolean;
}

const ServiceFilters: React.FC<ServiceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onReset,
  showResetButton
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="w-full md:w-[200px]">
        <Select
          value={statusFilter || ''}
          onValueChange={(value) => onStatusChange(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showResetButton && (
        <Button variant="ghost" onClick={onReset} className="md:self-start">
          Reset
        </Button>
      )}
    </div>
  );
};

export default ServiceFilters;
