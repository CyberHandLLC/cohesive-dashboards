# Service Expiration Management

## Feature Overview
This feature leverages the existing `ClientService` table structure to implement a comprehensive system for tracking service expirations, sending notifications, and managing renewals.

## Database Schema Validation

The existing `ClientService` table already contains the necessary fields for tracking service durations:

| Column Name | Data Type | Purpose |
|-------------|-----------|---------|
| id | uuid | Primary identifier |
| clientId | uuid | Reference to Client table |
| serviceId | uuid | Reference to Service table |
| startDate | timestamp with time zone | Service activation date |
| endDate | timestamp with time zone | Service expiration date |
| status | text | Current status (ACTIVE, EXPIRED, etc.) |
| price | numeric | Service price for this client |
| createdAt | timestamp with time zone | Record creation timestamp |
| updatedAt | timestamp with time zone | Record update timestamp |

No schema changes are required for basic functionality, but we may consider adding:
- Notification preferences for different expiration thresholds
- Renewal history tracking

## Implementation Tasks

### 1. Create Expiration Tracking System

#### Backend Requirements
```typescript
// Example hook for fetching expiring services
export const useExpiringServices = (daysThreshold: number = 30) => {
  const [services, setServices] = useState<ClientService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchExpiringServices = async () => {
      setIsLoading(true);
      try {
        // Calculate the date threshold
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
        
        // Query for services expiring within the threshold
        const { data, error } = await supabase
          .from('ClientService')
          .select(`
            *,
            client:clientId(id, companyName),
            service:serviceId(id, name, description)
          `)
          .gte('endDate', new Date().toISOString())
          .lte('endDate', thresholdDate.toISOString())
          .eq('status', 'ACTIVE');
          
        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching expiring services:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpiringServices();
  }, [daysThreshold]);
  
  return { services, isLoading };
};
```

#### Frontend Components
1. **ExpirationDashboard**: Main view showing upcoming expirations by timeframe
2. **ExpirationCard**: Card component showing individual expiring service details
3. **ExpirationFilters**: Filters for timeframe, service type, and client
4. **RenewalDialog**: Modal for processing service renewals

### 2. Implement Notification System

#### Email Notification Service
Create a scheduled function that runs daily to:
1. Check for services expiring in the next 30, 15, and 7 days
2. Send appropriate email notifications to administrators
3. Log the notification in the `AuditLog` table

#### Admin Notification Center
Create a notification center in the admin dashboard that shows:
1. Recent notifications sent
2. Upcoming expirations requiring attention
3. Expired services needing follow-up

### 3. Build Renewal Workflow

#### Renewal Process
1. Admin selects service to renew from expiration dashboard
2. System displays renewal dialog with service details and pricing
3. Admin specifies renewal terms (duration, price adjustments)
4. System updates the `ClientService` record:
   - Extends the `endDate`
   - Updates `price` if changed
   - Sets `status` to remain 'ACTIVE'
   - Updates `updatedAt` timestamp
5. System generates a renewal invoice
6. System logs the renewal action in `AuditLog`

#### Renewal Dialog Component
```typescript
interface RenewalDialogProps {
  clientService: ClientService;
  onRenew: (renewalData: RenewalFormData) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const renewalFormSchema = z.object({
  duration: z.number().min(1, "Duration must be at least 1 month"),
  price: z.number().min(0, "Price cannot be negative"),
  notes: z.string().optional(),
});

type RenewalFormData = z.infer<typeof renewalFormSchema>;
```

## Testing Strategy

### Unit Tests
- Test expiration calculation logic
- Verify notification threshold calculations
- Test renewal form validation

### Integration Tests
- Test database queries for expiring services
- Verify email notification sending
- Test full renewal workflow

### User Acceptance Tests
- Admin can view expiring services dashboard
- Admin can filter and sort expirations
- Admin can process renewals
- Admin receives appropriate notifications

## Implementation Phases

### Phase 1: Core Expiration Tracking
- Build expiration dashboard view
- Implement expiration filters and sorting
- Create service expiration cards

### Phase 2: Notification System
- Implement email notification templates
- Set up scheduled notification checks
- Create admin notification center

### Phase 3: Renewal Process
- Build renewal dialog component
- Implement renewal workflow
- Add invoice generation on renewal
- Create renewal history tracking

## Related Components
- Billing system for invoice generation
- Client dashboard for client-side expiration view
- Audit logging for tracking renewal actions
