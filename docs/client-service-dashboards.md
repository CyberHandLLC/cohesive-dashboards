# Client Service Dashboards

## Feature Overview
This feature creates detailed dashboards for visualizing and managing client services, including performance metrics for websites, marketing campaigns, and AI integrations. The dashboards provide both high-level overviews and detailed service-specific metrics.

## Database Requirements

The implementation will leverage these existing tables:

### Primary Tables
- `Client`: For basic client information
- `ClientService`: For service associations and status
- `Service`: For service details and pricing

### Additional Schema Considerations
We may need to create new tables for storing metrics data:

```sql
CREATE TABLE IF NOT EXISTS "ServiceMetric" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clientServiceId" UUID NOT NULL REFERENCES "ClientService"("id"),
  "metricType" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "metricValue" NUMERIC NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_service_metric_client_service" ON "ServiceMetric"("clientServiceId");
CREATE INDEX "idx_service_metric_type" ON "ServiceMetric"("metricType");
```

## Implementation Details

### 1. Client Service Dashboard Structure
The client service dashboard implementation consists of the following components:

#### Core Components
- `MetricCard`: Displays key performance indicators with trend indicators
- `MetricTimeSeriesChart`: Visualizes metric data over time with configurable time ranges
- `ClientServiceDashboard`: Main component that displays the appropriate dashboard based on service type
- `WebsitePerformanceDashboard`: Dashboard for website-related metrics
- `MarketingPerformanceDashboard`: Dashboard for marketing-related metrics
- `AIIntegrationDashboard`: Dashboard for AI-related metrics

#### Data Management
- `useServiceMetrics`: Custom hook for fetching and managing service metrics
- Mock data generation for development until real metrics are available

### 2. Routes and Navigation
The dashboards are accessible through the following routes:

- `/admin/accounts/clients/:clientId/service-dashboard`: Main service dashboard view
- `/admin/accounts/clients/:clientId/service-dashboard/:serviceId`: Dashboard for a specific service

### 3. Metrics Visualization
Three specialized dashboards have been implemented:

#### Website Performance Dashboard
- **Key Metrics**: Uptime, Load Speed, Traffic, and Error Count
- **Views**: Overview, Uptime Analysis, Performance Analysis, Traffic Analysis, Error Analysis
- **Features**: Trend indicators, Status alerts, Recommendations based on metric values

#### Marketing Performance Dashboard
- **Key Metrics**: SEO Rankings, Campaign Performance, Social Engagement, and ROI
- **Views**: Overview, SEO Performance, Campaign Analysis, Social Media Analysis, ROI Analysis
- **Features**: Performance summaries, Growth trends, Strategy recommendations

#### AI Integration Dashboard  
- **Key Metrics**: API Usage, Accuracy, User Engagement, and Value Perception
- **Views**: Overview, Usage Analysis, Accuracy Analysis, Engagement Analysis, Value Analysis
- **Features**: Performance insights, Trend tracking, Optimization recommendations

## Usage Guide

### Accessing Client Service Dashboards

1. Navigate to the Clients section in the admin portal
2. Select a specific client from the list
3. Click on the "Services" tab in the client profile
4. For any active service, click the chart icon (BarChart2) in the actions column to view its dashboard

### Using Service Dashboards

1. **Service Selection**: Use the dropdown at the top of the dashboard to switch between services
2. **Metric Overview**: View key performance metrics in the cards at the top of the dashboard
3. **Detailed Metrics**: Use the tabs to navigate between different metric views
4. **Time Range Selection**: Adjust the time range using the date range selector in chart views
5. **Recommendations**: Review the automatically generated recommendations based on metric values

### Interpreting Metrics

- **Trend Indicators**: Up/down arrows show the direction of change
- **Status Colors**: Green (good), Yellow (warning), Red (needs attention)
- **Percentage Changes**: Shows improvement or decline compared to previous period
- **Detailed Analysis**: Each metric has a dedicated view with deeper insights

### Adding New Metrics

For future development, metrics can be added through the ServiceMetric table or by extending the mock data generation in the useServiceMetrics hook.

## Future Enhancements

1. **Real-time Metrics**: Implement real-time data collection from client services
2. **Custom Dashboards**: Allow clients to customize their dashboard views
3. **Alerting System**: Add alerts for metric thresholds and anomalies
4. **Export Capabilities**: Enable exporting dashboard data as reports
5. **Client Portal Access**: Make dashboards available to clients with appropriate permissions

## Implementation Tasks

### 1. Create Client Dashboard Overview

#### Client Profile Component
```typescript
interface ClientProfileProps {
  clientId: string;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ clientId }) => {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Client')
        .select(`
          *,
          contacts:Contact(*)
        `)
        .eq('id', clientId)
        .single();
        
      if (error) throw error;
      return data;
    }
  });
  
  // Component rendering logic
};
```

#### Client Service Summary
Component that displays:
- Total active services
- Services by category
- Upcoming service expirations
- Recent service activities

### 2. Implement Service-Specific Dashboards

#### Website Performance Dashboard
For clients with web development and hosting services:
- Uptime tracking
- Page load speed metrics
- Traffic statistics
- Error monitoring

#### Marketing Campaign Dashboard
For clients with marketing services:
- SEO keyword rankings
- Campaign performance metrics
- Social media engagement
- ROI calculations

#### AI Integration Dashboard
For clients with AI services:
- Model usage statistics
- Accuracy metrics
- User engagement data
- Value demonstration

### 3. Add Metric Visualization Components

#### Time Series Charts
```typescript
interface TimeSeriesChartProps {
  clientServiceId: string;
  metricType: string;
  metricName: string;
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  clientServiceId,
  metricType,
  metricName,
  timeRange
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['serviceMetrics', clientServiceId, metricType, metricName, timeRange],
    queryFn: async () => {
      // Calculate date range based on timeRange
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day': startDate.setDate(startDate.getDate() - 1); break;
        case 'week': startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
        case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
        case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
      }
      
      const { data, error } = await supabase
        .from('ServiceMetric')
        .select('*')
        .eq('clientServiceId', clientServiceId)
        .eq('metricType', metricType)
        .eq('metricName', metricName)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Use Recharts to visualize time series data
};
```

#### Performance Indicators
Components for displaying current status and goal tracking:
- Current value vs target
- Trend indicators
- Status colors (red/yellow/green)

### 4. Create Data Collection System

#### API Integrations
- Set up integrations with website monitoring tools
- Create connections to marketing analytics platforms
- Establish AI system data collection

#### Metric Aggregation Service
- Scheduled jobs to collect and aggregate metrics
- Data normalization and processing
- Storage in ServiceMetric table

## Testing Strategy

### Unit Tests
- Test metric calculation functions
- Verify chart data processing
- Test dashboard component rendering

### Integration Tests
- Test data collection from external sources
- Verify metric storage and retrieval
- Test dashboard filtering and date ranges

### User Acceptance Tests
- Admin can navigate client dashboards
- Metrics display correctly with proper formatting
- Visualizations update with date range changes
- Performance indicators show correct status

## Implementation Phases

### Phase 1: Core Dashboard Framework
- Build client profile and service summary
- Implement basic metric visualization components
- Create dashboard layout and navigation

### Phase 2: Service-Specific Dashboards
- Implement website performance dashboard
- Create marketing campaign metrics
- Build AI integration statistics

### Phase 3: External Integrations
- Connect with website monitoring tools
- Integrate marketing analytics platforms
- Establish AI system data collection

## Related Components
- Service expiration management for upcoming renewals
- Billing system for service value demonstration
- Service lifecycle management for status updates
