# Cross-Cutting Concerns

## Overview
This document covers aspects that span multiple feature areas in the Admin Dashboard enhancement project. These cross-cutting concerns include authentication and authorization, data access optimization, error handling, UI/UX consistency, and shared component libraries.

## Authentication and Authorization

### Role-Based Access Control
The enhanced dashboard must maintain strict role-based access control:

```typescript
// Example role-based route guard
export const withRoleGuard = (Component: React.ComponentType, allowedRoles: UserRole[]) => {
  return function WithRoleGuard(props: any) {
    const { role, isLoading } = useRole();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <Component {...props} />;
  };
};

// Usage example
const ProtectedServiceExpirationDashboard = withRoleGuard(
  ServiceExpirationDashboard, 
  ['ADMIN', 'STAFF']
);
```

### Feature-Level Permissions
For more granular control, implement feature-level permissions:

```typescript
// Permission checking hook
export const useHasPermission = (permission: string) => {
  const { user } = useAuth();
  const { data: userPermissions } = useQuery({
    queryKey: ['userPermissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('UserPermission')
        .select('permission')
        .eq('userId', user?.id);
        
      if (error) throw error;
      return data?.map(p => p.permission) || [];
    },
    enabled: !!user?.id,
  });
  
  return {
    hasPermission: userPermissions?.includes(permission) || false,
    isLoading: !userPermissions,
  };
};

// Usage
const ManageBillingButton = () => {
  const { hasPermission, isLoading } = useHasPermission('billing:manage');
  
  if (isLoading) return null;
  
  return hasPermission ? (
    <Button>Manage Billing</Button>
  ) : null;
};
```

## Data Access Optimization

### Query Optimization
Strategies for optimizing database queries:

1. **Selective Column Selection**
   ```typescript
   // Only select needed columns
   const { data, error } = await supabase
     .from('ClientService')
     .select('id, status, startDate, endDate, client:clientId(companyName)')
     .eq('status', 'ACTIVE');
   ```

2. **Pagination**
   ```typescript
   // Implement pagination for large datasets
   export const usePaginatedClientServices = (
     page: number = 1, 
     pageSize: number = 10, 
     filters: Record<string, any> = {}
   ) => {
     return useQuery({
       queryKey: ['clientServices', page, pageSize, filters],
       queryFn: async () => {
         let query = supabase
           .from('ClientService')
           .select('*, client:clientId(*), service:serviceId(*)', { count: 'exact' });
           
         // Apply filters
         Object.entries(filters).forEach(([key, value]) => {
           if (value !== undefined && value !== null && value !== '') {
             query = query.eq(key, value);
           }
         });
         
         // Apply pagination
         const from = (page - 1) * pageSize;
         const to = from + pageSize - 1;
         
         const { data, error, count } = await query
           .range(from, to)
           .order('createdAt', { ascending: false });
           
         if (error) throw error;
         
         return {
           data: data || [],
           totalCount: count || 0,
           page,
           pageSize,
           totalPages: Math.ceil((count || 0) / pageSize),
         };
       }
     });
   };
   ```

3. **Caching Strategy**
   ```typescript
   // Configure React Query caching
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 30 * 60 * 1000, // 30 minutes
         refetchOnWindowFocus: false,
         retry: 1,
       },
     },
   });
   ```

## Error Handling

### Centralized Error Processing
Create a consistent error handling approach:

```typescript
// Error processing utility
export const processApiError = (error: any): {
  message: string;
  code?: string;
  status?: number;
  details?: any;
} => {
  // Supabase errors
  if (error?.code && error?.message) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }
  
  // HTTP errors
  if (error?.status && error?.statusText) {
    return {
      message: error.statusText,
      status: error.status,
      details: error.data,
    };
  }
  
  // Generic errors
  return {
    message: error?.message || 'An unknown error occurred',
  };
};

// Usage with toast notifications
try {
  // API call
} catch (error) {
  const processedError = processApiError(error);
  toast({
    title: 'Error',
    description: processedError.message,
    variant: 'destructive',
  });
  
  // Log for debugging
  console.error('API Error:', processedError);
}
```

### Error Boundary Components
Implement error boundaries for component-level error handling:

```typescript
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
    // Optionally log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorFallback />}>
  <ServiceDashboard />
</ErrorBoundary>
```

## UI/UX Consistency

### Design System Components
Extend the existing shadcn/ui components with custom ones for domain-specific needs:

```typescript
// Example of a consistent status badge component
interface StatusBadgeProps {
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const statusConfig = {
    active: { label: 'Active', color: 'bg-green-100 text-green-800' },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  };
  
  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
};
```

### Consistent Layout Templates
Create standard layout templates for different dashboard sections:

```typescript
interface DashboardPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  title,
  description,
  children,
  actions,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <Separator />
      <div>
        {children}
      </div>
    </div>
  );
};
```

## Shared Utilities

### Date Formatting
Create consistent date handling utilities:

```typescript
export const dateUtils = {
  format: (date: Date | string | null | undefined, format: string = 'MMM d, yyyy'): string => {
    if (!date) return 'N/A';
    return formatDate(new Date(date), format);
  },
  
  formatRelative: (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    return formatRelative(new Date(date), new Date());
  },
  
  isExpired: (date: Date | string | null | undefined): boolean => {
    if (!date) return false;
    return new Date(date) < new Date();
  },
  
  daysUntil: (date: Date | string | null | undefined): number => {
    if (!date) return 0;
    const diff = differenceInDays(new Date(date), new Date());
    return Math.max(0, diff);
  },
};
```

### Money Formatting
Create utilities for consistent currency formatting:

```typescript
export const formatCurrency = (
  amount: number | null | undefined,
  options: {
    currency?: string;
    notation?: 'standard' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  const {
    currency = 'USD',
    notation = 'standard',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
};
```

## Testing Conventions

### Test Structure
Consistent approach to component testing:

```typescript
// Example test structure for a component
describe('ServiceExpirationCard', () => {
  const mockService = {
    id: '123',
    clientId: '456',
    serviceId: '789',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    status: 'ACTIVE',
    client: {
      companyName: 'Acme Inc.',
    },
    service: {
      name: 'Web Hosting',
    },
  };

  it('renders service information correctly', () => {
    render(<ServiceExpirationCard service={mockService} />);
    
    expect(screen.getByText('Web Hosting')).toBeInTheDocument();
    expect(screen.getByText('Acme Inc.')).toBeInTheDocument();
    expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument();
  });

  it('shows correct expiration indicator based on date', () => {
    // Test for expiring soon
    const expiringService = {
      ...mockService,
      endDate: addDays(new Date(), 10).toISOString(),
    };
    
    const { rerender } = render(<ServiceExpirationCard service={expiringService} />);
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    
    // Test for expired
    const expiredService = {
      ...mockService,
      endDate: subDays(new Date(), 10).toISOString(),
    };
    
    rerender(<ServiceExpirationCard service={expiredService} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});
```

## Documentation Standards

### Component Documentation
Use consistent documentation for components:

```typescript
/**
 * ServiceExpirationCard Component
 * 
 * Displays information about a service that is approaching expiration
 * 
 * @param {Object} props - Component props
 * @param {ClientService} props.service - The service to display
 * @param {Function} props.onRenew - Function called when the renew button is clicked
 * @param {boolean} props.compact - Whether to display in compact mode
 * 
 * @example
 * <ServiceExpirationCard
 *   service={clientService}
 *   onRenew={handleRenewal}
 *   compact={false}
 * />
 */
export const ServiceExpirationCard: React.FC<ServiceExpirationCardProps> = ({
  service,
  onRenew,
  compact = false,
}) => {
  // Component implementation
};
```

### Code Organization
Follow consistent patterns for organizing code:

1. **Feature-Based Organization**
   - Group related components, hooks, and utilities by feature
   - Use index files to expose public API of each feature

2. **Component Structure**
   - Props interface at the top
   - Component implementation
   - Helper functions at the bottom or in separate files
   - Styles either co-located or in separate files

3. **Hook Patterns**
   - Prefix custom hooks with `use`
   - Return objects with named properties
   - Handle loading, error, and empty states consistently

## Implementation Considerations

When implementing cross-cutting concerns, follow these guidelines:

1. **Incremental Adoption**
   - Start with the most critical shared components
   - Refactor existing code gradually
   - Prioritize components needed by multiple features

2. **Documentation First**
   - Document shared components before implementing
   - Create usage examples
   - Consider creating a simple Storybook for key components

3. **Testing Shared Code**
   - Higher test coverage for shared utilities
   - Test edge cases thoroughly
   - Create reusable test fixtures

4. **Performance Awareness**
   - Monitor performance impact of shared code
   - Optimize critical paths
   - Consider code splitting for larger components
