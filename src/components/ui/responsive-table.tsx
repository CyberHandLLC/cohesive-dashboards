
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  responsive?: boolean;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T | ((item: T) => string);
  isLoading?: boolean;
  emptyMessage?: string;
  searchQuery?: string;
  onRowClick?: (item: T) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyField,
  isLoading = false,
  emptyMessage = 'No data available',
  searchQuery = '',
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: ResponsiveTableProps<T>) {
  const getKey = (item: T): string => {
    if (typeof keyField === 'function') {
      return keyField(item);
    }
    return String(item[keyField]);
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    
    const key = column.sortKey || column.id;
    const newDirection = sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  // Show a loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show an empty state
  if (data.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">
          {searchQuery ? `No results found for "${searchQuery}"` : emptyMessage}
        </p>
      </div>
    );
  }

  // Render the table with data
  return (
    <div className={cn("w-full overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.id}
                className={cn(
                  column.responsive && "hidden md:table-cell",
                  column.sortable && "cursor-pointer hover:text-primary",
                  column.className
                )}
                onClick={() => column.sortable && handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortColumn === (column.sortKey || column.id) && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={getKey(item)}
              className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((column) => (
                <TableCell 
                  key={`${getKey(item)}-${column.id}`}
                  className={cn(
                    column.responsive && "hidden md:table-cell", 
                    column.className
                  )}
                >
                  {column.cell(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
