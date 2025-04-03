-- Create enum type for service lifecycle states
CREATE TYPE service_lifecycle_state AS ENUM (
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PENDING_INFO',
  'PROVISIONING',
  'READY',
  'ACTIVE',
  'MAINTENANCE',
  'WARNING',
  'EXPIRING_SOON',
  'PENDING_RENEWAL',
  'RENEWING',
  'CANCELLING',
  'SUSPENDED',
  'EXPIRED',
  'ARCHIVED'
);

-- Create enum type for service lifecycle actions
CREATE TYPE service_lifecycle_action AS ENUM (
  'REQUEST',
  'APPROVE',
  'REJECT',
  'REQUEST_INFO',
  'PROVIDE_INFO',
  'START_PROVISION',
  'COMPLETE_PROVISION',
  'ACTIVATE',
  'START_MAINTENANCE',
  'COMPLETE_MAINTENANCE',
  'FLAG_ISSUE',
  'RESOLVE_ISSUE',
  'NOTIFY_EXPIRATION',
  'REQUEST_RENEWAL',
  'PROCESS_RENEWAL',
  'COMPLETE_RENEWAL',
  'REQUEST_CANCELLATION',
  'PROCESS_CANCELLATION',
  'SUSPEND',
  'REACTIVATE',
  'EXPIRE',
  'ARCHIVE'
);

-- Create enum type for priority levels
CREATE TYPE priority_level AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

-- Create enum type for task status
CREATE TYPE task_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED'
);

-- Update the ClientService table to include lifecycle state
ALTER TABLE "ClientService" 
ADD COLUMN IF NOT EXISTS "lifecycleState" service_lifecycle_state DEFAULT 'ACTIVE';

-- Create ServiceLifecycleHistory table to track all state transitions
CREATE TABLE IF NOT EXISTS "ServiceLifecycleHistory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clientServiceId" UUID NOT NULL REFERENCES "ClientService" ("id") ON DELETE CASCADE,
  "state" service_lifecycle_state NOT NULL,
  "action" service_lifecycle_action NOT NULL,
  "performedBy" UUID REFERENCES "User" ("id"),
  "performedByRole" TEXT NOT NULL,
  "comments" TEXT,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries on clientServiceId
CREATE INDEX IF NOT EXISTS "idx_service_lifecycle_history_client_service_id" 
ON "ServiceLifecycleHistory" ("clientServiceId");

-- Create ServiceLifecycleEvent table for scheduled and pending events
CREATE TABLE IF NOT EXISTS "ServiceLifecycleEvent" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clientServiceId" UUID NOT NULL REFERENCES "ClientService" ("id") ON DELETE CASCADE,
  "state" service_lifecycle_state NOT NULL,
  "action" service_lifecycle_action NOT NULL,
  "scheduledTime" TIMESTAMP WITH TIME ZONE,
  "isCompleted" BOOLEAN DEFAULT FALSE NOT NULL,
  "completedTime" TIMESTAMP WITH TIME ZONE,
  "assignedTo" UUID REFERENCES "User" ("id"),
  "priority" priority_level DEFAULT 'MEDIUM' NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries on pending events
CREATE INDEX IF NOT EXISTS "idx_service_lifecycle_event_is_completed" 
ON "ServiceLifecycleEvent" ("isCompleted");

-- Create ServiceLifecycleTask table for staff/admin tasks
CREATE TABLE IF NOT EXISTS "ServiceLifecycleTask" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "eventId" UUID NOT NULL REFERENCES "ServiceLifecycleEvent" ("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "assignedTo" UUID REFERENCES "User" ("id"),
  "dueDate" TIMESTAMP WITH TIME ZONE,
  "status" task_status DEFAULT 'PENDING' NOT NULL,
  "completedBy" UUID REFERENCES "User" ("id"),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "priority" priority_level DEFAULT 'MEDIUM' NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create NotificationTemplate table for service lifecycle notifications
CREATE TABLE IF NOT EXISTS "ServiceNotificationTemplate" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "fromState" service_lifecycle_state,
  "toState" service_lifecycle_state,
  "action" service_lifecycle_action,
  "forRole" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ServiceLifecycleNotification junction table
CREATE TABLE IF NOT EXISTS "ServiceLifecycleNotification" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "historyId" UUID NOT NULL REFERENCES "ServiceLifecycleHistory" ("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "templateId" UUID REFERENCES "ServiceNotificationTemplate" ("id"),
  "isRead" BOOLEAN DEFAULT FALSE NOT NULL,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add RLS policies
ALTER TABLE "ServiceLifecycleHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceLifecycleEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceLifecycleTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceNotificationTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceLifecycleNotification" ENABLE ROW LEVEL SECURITY;

-- Create policies for ServiceLifecycleHistory
CREATE POLICY "Admins can see all lifecycle history" 
ON "ServiceLifecycleHistory" FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid() AND "User".role = 'ADMIN'
  )
);

CREATE POLICY "Staff can see all lifecycle history" 
ON "ServiceLifecycleHistory" FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid() AND "User".role = 'STAFF'
  )
);

CREATE POLICY "Clients can see their own services lifecycle history" 
ON "ServiceLifecycleHistory" FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    JOIN "ClientService" ON "ClientService"."clientId" = "User"."clientId"
    WHERE "User".id = auth.uid() 
    AND "User".role = 'CLIENT'
    AND "ServiceLifecycleHistory"."clientServiceId" = "ClientService".id
  )
);

-- Create policies for ServiceLifecycleEvent
CREATE POLICY "Admins can manage all lifecycle events" 
ON "ServiceLifecycleEvent" FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid() AND "User".role = 'ADMIN'
  )
);

CREATE POLICY "Staff can manage lifecycle events" 
ON "ServiceLifecycleEvent" FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid() AND "User".role = 'STAFF'
  )
);

CREATE POLICY "Clients can view their own service events" 
ON "ServiceLifecycleEvent" FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    JOIN "ClientService" ON "ClientService"."clientId" = "User"."clientId"
    WHERE "User".id = auth.uid() 
    AND "User".role = 'CLIENT'
    AND "ServiceLifecycleEvent"."clientServiceId" = "ClientService".id
  )
);

-- Add function to update ClientService lifecycle state
CREATE OR REPLACE FUNCTION update_service_lifecycle_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the lifecycle state in the ClientService table
  UPDATE "ClientService"
  SET "lifecycleState" = NEW.state,
      "updatedAt" = NOW()
  WHERE id = NEW."clientServiceId";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ClientService state when history is added
CREATE TRIGGER service_lifecycle_state_update
AFTER INSERT ON "ServiceLifecycleHistory"
FOR EACH ROW
EXECUTE FUNCTION update_service_lifecycle_state();

-- Add functions for automatic notifications
CREATE OR REPLACE FUNCTION create_service_lifecycle_notifications()
RETURNS TRIGGER AS $$
DECLARE
  template_id UUID;
  user_record RECORD;
BEGIN
  -- Find appropriate notification template
  SELECT id INTO template_id FROM "ServiceNotificationTemplate"
  WHERE action = NEW.action
  AND (fromState IS NULL OR fromState = NEW.state)
  AND isActive = TRUE
  LIMIT 1;
  
  IF template_id IS NOT NULL THEN
    -- Create notifications for admins if needed
    IF NEW.performedByRole = 'CLIENT' OR NEW.performedByRole = 'SYSTEM' THEN
      FOR user_record IN 
        SELECT id FROM "User" WHERE role = 'ADMIN'
      LOOP
        INSERT INTO "ServiceLifecycleNotification" 
          (historyId, userId, templateId, sentAt)
        VALUES 
          (NEW.id, user_record.id, template_id, NOW());
      END LOOP;
    END IF;
    
    -- Create notification for the client
    IF NEW.performedByRole = 'ADMIN' OR NEW.performedByRole = 'STAFF' OR NEW.performedByRole = 'SYSTEM' THEN
      FOR user_record IN 
        SELECT "User".id 
        FROM "User"
        JOIN "ClientService" ON "ClientService"."clientId" = "User"."clientId"
        WHERE "ClientService".id = NEW."clientServiceId"
        AND "User".role = 'CLIENT'
      LOOP
        INSERT INTO "ServiceLifecycleNotification" 
          (historyId, userId, templateId, sentAt)
        VALUES 
          (NEW.id, user_record.id, template_id, NOW());
      END LOOP;
    END IF;
    
    -- Create notification for assigned staff if applicable
    IF EXISTS (
      SELECT 1 FROM "ServiceLifecycleEvent" 
      WHERE "clientServiceId" = NEW."clientServiceId" 
      AND action = NEW.action
      AND assignedTo IS NOT NULL
    ) THEN
      FOR user_record IN 
        SELECT assignedTo as id
        FROM "ServiceLifecycleEvent"
        WHERE "clientServiceId" = NEW."clientServiceId"
        AND action = NEW.action
        AND assignedTo IS NOT NULL
      LOOP
        INSERT INTO "ServiceLifecycleNotification" 
          (historyId, userId, templateId, sentAt)
        VALUES 
          (NEW.id, user_record.id, template_id, NOW());
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automated notifications
CREATE TRIGGER service_lifecycle_notifications
AFTER INSERT ON "ServiceLifecycleHistory"
FOR EACH ROW
EXECUTE FUNCTION create_service_lifecycle_notifications();
