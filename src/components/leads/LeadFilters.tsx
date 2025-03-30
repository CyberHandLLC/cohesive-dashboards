
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  staffFilter: string;
  onStaffFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  startDateFilter: string;
  onStartDateFilterChange: (value: string) => void;
  endDateFilter: string;
  onEndDateFilterChange: (value: string) => void;
  staffMembers: StaffMember[];
  onResetFilters: () => void;
}

const LeadFilters: React.FC<LeadFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  staffFilter,
  onStaffFilterChange,
  sourceFilter,
  onSourceFilterChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange,
  staffMembers,
  onResetFilters,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="icon"
            className="hidden sm:flex" 
            title="Filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onResetFilters}
              className="ml-auto sm:ml-0"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <Select 
            value={statusFilter} 
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="QUALIFIED">Qualified</SelectItem>
              <SelectItem value="CONVERTED">Converted</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select 
            value={staffFilter} 
            onValueChange={onStaffFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Staff</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {staffMembers.map(staff => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.firstName || staff.lastName ? 
                    `${staff.firstName || ''} ${staff.lastName || ''}`.trim() : 
                    staff.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select 
            value={sourceFilter} 
            onValueChange={onSourceFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
              <SelectItem value="REFERRAL">Referral</SelectItem>
              <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
              <SelectItem value="EVENT">Event</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input 
            type="date" 
            placeholder="Start date" 
            value={startDateFilter}
            onChange={(e) => onStartDateFilterChange(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input 
            type="date" 
            placeholder="End date" 
            value={endDateFilter}
            onChange={(e) => onEndDateFilterChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default LeadFilters;
