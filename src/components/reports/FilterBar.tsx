
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from './DateRangePicker';
import { DateRange } from 'react-day-picker';
import { Download } from 'lucide-react';

interface FilterBarProps {
  dateRange?: DateRange | undefined;
  setDateRange?: (dateRange: DateRange | undefined) => void;
  showDateFilter?: boolean;
  showClientFilter?: boolean;
  showCategoryFilter?: boolean;
  clientFilter?: string | null;
  setClientFilter?: (client: string | null) => void;
  categoryFilter?: string | null;
  setCategoryFilter?: (category: string | null) => void;
  clients?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  onExport?: () => void;
  children?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
  dateRange,
  setDateRange,
  showDateFilter = true,
  showClientFilter = false,
  showCategoryFilter = false,
  clientFilter,
  setClientFilter,
  categoryFilter,
  setCategoryFilter,
  clients = [],
  categories = [],
  onExport,
  children,
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-start mb-6">
      {showDateFilter && dateRange && setDateRange && (
        <div>
          <DatePickerWithRange 
            dateRange={dateRange} 
            setDateRange={setDateRange} 
          />
        </div>
      )}
      
      {showClientFilter && setClientFilter && (
        <div>
          <Select
            value={clientFilter || "all-clients"}
            onValueChange={(value) => setClientFilter(value === "all-clients" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-clients">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {showCategoryFilter && setCategoryFilter && (
        <div>
          <Select
            value={categoryFilter || "all-categories"}
            onValueChange={(value) => setCategoryFilter(value === "all-categories" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {children}
      
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
