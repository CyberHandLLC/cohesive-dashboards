
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  className?: string;
  responsive?: boolean; // If true, only show on desktop
  sortable?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  searchQuery?: string;
  expandable?: boolean;
  renderExpandedRow?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = 'No data found',
  loadingMessage = 'Loading data...',
  searchQuery,
  expandable = false,
  renderExpandedRow,
  onRowClick,
  onSort,
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleRow = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSort = (columnId: string) => {
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);
    if (onSort) {
      onSort(columnId, newDirection);
    }
  };

  // This will ensure we only show a subset of columns on mobile
  const visibleOnMobileColumns = columns.filter((col) => !col.responsive);
  const firstColumn = visibleOnMobileColumns[0]; // First column is always visible

  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-muted-foreground">
        {loadingMessage}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center py-8 text-muted-foreground">
        {searchQuery ? `No results found for "${searchQuery}"` : emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {expandable && (
              <TableHead className="w-[40px]"></TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.sortable && "cursor-pointer",
                  column.responsive && "hidden md:table-cell",
                  column.className
                )}
                onClick={() => column.sortable && handleSort(column.id)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && sortColumn === column.id && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const rowKey = String(item[keyField]);
            const isExpanded = expandedRows[rowKey];
            
            return (
              <React.Fragment key={rowKey}>
                <TableRow 
                  className={cn("group", onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {expandable && (
                    <TableCell className="w-[40px] p-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => toggleRow(rowKey, e)}
                      >
                        {isExpanded ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </TableCell>
                  )}
                  
                  {columns.map((column) => (
                    <TableCell 
                      key={`${rowKey}-${column.id}`}
                      className={cn(
                        column.responsive && "hidden md:table-cell",
                        column.className
                      )}
                      onClick={(e) => {
                        if (expandable && column.id === firstColumn?.id && !onRowClick) {
                          e.stopPropagation();
                          toggleRow(rowKey);
                        }
                      }}
                    >
                      {column.cell(item)}
                      
                      {/* On mobile, for the first column, show a summary of responsive columns */}
                      {column.id === firstColumn?.id && columns.some(col => col.responsive) && (
                        <div className="block md:hidden mt-1 text-xs text-muted-foreground">
                          {columns.filter(col => col.responsive).slice(0, 2).map((col, idx) => (
                            <div key={col.id} className="mt-1">
                              <span className="font-medium">{col.header}: </span>
                              {col.cell(item)}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                
                {expandable && isExpanded && renderExpandedRow && (
                  <TableRow className="bg-muted/30">
                    <TableCell 
                      colSpan={columns.length + (expandable ? 1 : 0)}
                      className="p-0"
                    >
                      <div className="p-4">
                        {renderExpandedRow(item)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
