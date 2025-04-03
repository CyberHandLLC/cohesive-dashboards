# Service Lifecycle Flow

## Feature Overview
This feature streamlines the process from service request to maintenance, implementing a complete lifecycle for services including request, approval, activation, maintenance, and renewal or termination. It improves the user experience for both clients and administrators.

## Database Schema Validation

The implementation will leverage these existing tables:

- `ServiceRequest`: For initial service requests
- `ClientService`: For active service associations
- `SupportTicket`: For service-related support issues

Let's check if we need additional fields for tracking the service lifecycle:

```sql
-- Potential additions to ClientService table if not already present
ALTER TABLE "ClientService" ADD COLUMN IF NOT EXISTS "activationDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ClientService" ADD COLUMN IF NOT EXISTS "lastMaintenanceDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "ClientService" ADD COLUMN IF NOT EXISTS "healthStatus" TEXT DEFAULT 'GOOD';
ALTER TABLE "ClientService" ADD COLUMN IF NOT EXISTS "maintenanceNotes" TEXT;
```

## Implementation Tasks

### 1. Enhanced Service Request Process

#### Service Configuration Options
Extend the service request form to include:
- Service tier selection
- Custom configuration options
- Add-on selections
- Timeline preferences

```typescript
const serviceRequestSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID"),
  clientId: z.string().uuid("Invalid client ID").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
  message: z.string().min(10, "Please provide more details"),
  // New fields
  serviceTier: z.string().optional(),
  configOptions: z.record(z.string(), z.any()).optional(),
  addOns: z.array(z.string()).optional(),
  preferredStartDate: z.date().optional(),
});
```

#### Dynamic Pricing Calculator
Component that:
- Calculates service price based on selections
- Shows base price plus add-ons
- Displays recurring vs. one-time fees
- Updates in real-time as options change

### 2. Service Activation Workflow

#### Approval Process Automation
Enhance the approval workflow to:
1. Validate service configuration details
2. Generate client-ready service agreement
3. Create invoices for initial setup
4. Set up recurring billing if applicable
5. Notify clients of approval

#### Service Provisioning
Create a system that:
1. Tracks provisioning status with multiple steps
2. Assigns tasks to appropriate staff members
3. Sends notifications at key milestones
4. Updates client on provisioning progress

```typescript
interface ServiceProvisioningStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  blockedReason?: string;
  notes?: string;
}

const createServiceProvisioningSteps = async (clientServiceId: string, serviceType: string) => {
  // Get template steps based on service type
  const templateSteps = getProvisioningTemplateSteps(serviceType);
  
  // Create provisioning steps in database
  const steps = templateSteps.map(template => ({
    clientServiceId,
    name: template.name,
    description: template.description,
    status: 'pending',
    displayOrder: template.displayOrder,
  }));
  
  const { data, error } = await supabase
    .from('ServiceProvisioningStep')
    .insert(steps)
    .select();
    
  if (error) throw error;
  
  return data;
};
```

### 3. Service Maintenance System

#### Maintenance Scheduling
Create components for:
1. Setting up regular maintenance schedules
2. Tracking maintenance history
3. Scheduling one-off maintenance tasks
4. Sending maintenance notifications

#### Support Ticket Integration
Enhance support tickets to:
1. Link directly to specific client services
2. Track service-specific issues over time
3. Identify maintenance needs from support patterns
4. Trigger maintenance based on support issues

```typescript
interface ServiceRelatedTicketProps {
  clientServiceId: string;
}

export const ServiceRelatedTickets: React.FC<ServiceRelatedTicketProps> = ({ clientServiceId }) => {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['serviceTickets', clientServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SupportTicket')
        .select(`
          *,
          user:userId(firstName, lastName, email),
          assignedTo:assignedToUserId(firstName, lastName)
        `)
        .eq('clientServiceId', clientServiceId)
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Component rendering
};
```

### 4. Service Health Monitoring

#### Health Status Dashboard
Create a dashboard that:
1. Shows overall health status for all client services
2. Highlights services needing attention
3. Displays key performance indicators
4. Enables drill-down to specific service issues

#### Automated Health Checks
Implement a system that:
1. Periodically checks service health metrics
2. Updates health status in database
3. Generates alerts for degraded services
4. Recommends maintenance actions

```typescript
const updateServiceHealth = async (clientServiceId: string) => {
  // Gather health metrics
  const metrics = await gatherServiceHealthMetrics(clientServiceId);
  
  // Determine health status based on metrics
  const healthStatus = calculateHealthStatus(metrics);
  
  // Update the service record
  const { error } = await supabase
    .from('ClientService')
    .update({
      healthStatus,
      lastHealthCheckDate: new Date().toISOString(),
    })
    .eq('id', clientServiceId);
    
  if (error) throw error;
  
  // Create health check record
  const { error: logError } = await supabase
    .from('ServiceHealthLog')
    .insert({
      clientServiceId,
      status: healthStatus,
      metrics: metrics,
    });
    
  if (logError) throw logError;
  
  return { healthStatus, metrics };
};
```

## Testing Strategy

### Unit Tests
- Test service request validation
- Verify pricing calculations
- Test health status determination

### Integration Tests
- Test full provisioning workflow
- Verify support ticket integration
- Test health monitoring system

### User Acceptance Tests
- Admin can process service requests
- Admin can track provisioning steps
- Admin can monitor service health
- Admin can schedule maintenance

## Implementation Phases

### Phase 1: Enhanced Request Process
- Improve service request form
- Implement dynamic pricing calculator
- Create service configuration options

### Phase 2: Activation Workflow
- Build service provisioning system
- Create activation status tracking
- Implement client notifications

### Phase 3: Maintenance System
- Develop maintenance scheduling
- Enhance support ticket integration
- Create maintenance history tracking

### Phase 4: Health Monitoring
- Build service health dashboard
- Implement automated health checks
- Create alerting system for service issues

## Related Components
- Billing system for service invoicing
- Client dashboards for service status display
- Service expiration management for renewals
