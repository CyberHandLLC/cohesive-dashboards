
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus } from 'lucide-react';

interface StaffSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddClick: () => void;
  onAssignTaskClick: () => void;
}

const StaffSearchBar: React.FC<StaffSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onAddClick,
  onAssignTaskClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff members..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button onClick={onAssignTaskClick} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Assign Task
        </Button>
        <Button onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>
    </div>
  );
};

export default StaffSearchBar;
