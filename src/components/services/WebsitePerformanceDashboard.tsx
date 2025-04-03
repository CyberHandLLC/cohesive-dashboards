import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  Activity, 
  Users, 
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useServiceMetrics } from '@/hooks/useServiceMetrics';
import { TimeRange } from '@/types/metrics';
import MetricCard from './MetricCard';
import MetricTimeSeriesChart from './MetricTimeSeriesChart';

interface WebsitePerformanceDashboardProps {
  clientServiceId: string;
  serviceName: string;
}

const WebsitePerformanceDashboard: React.FC<WebsitePerformanceDashboardProps> = ({
  clientServiceId,
  serviceName
}) => {
  const { 
    timeRange, 
    setTimeRange,
    getMetricData,
    getMetricSummary,
    getMetricsSnapshot
  } = useServiceMetrics(clientServiceId);
  
  const websiteMetrics = getMetricsSnapshot().websiteMetrics;
  
  if (!websiteMetrics) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">{serviceName} Performance Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Uptime"
            summary={websiteMetrics.uptime}
            unit="%"
            precision={1}
            className="border-l-4 border-l-blue-500"
          />
          
          <MetricCard
            title="Load Speed"
            summary={websiteMetrics.loadSpeed}
            unit="s"
            precision={2}
            className="border-l-4 border-l-green-500"
          />
          
          <MetricCard
            title="Traffic"
            summary={websiteMetrics.traffic}
            unit=""
            precision={0}
            className="border-l-4 border-l-purple-500"
          />
          
          <MetricCard
            title="Errors"
            summary={websiteMetrics.errors}
            unit=""
            precision={0}
            className="border-l-4 border-l-red-500"
          />
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="uptime">Uptime</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricTimeSeriesChart
              title="Website Uptime"
              description="Percentage of time the website is operational"
              data={getMetricData('uptime', 'WEBSITE')}
              unit="%"
              color="#3b82f6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Page Load Speed"
              description="Average time to load pages in seconds"
              data={getMetricData('loadSpeed', 'WEBSITE')}
              unit="s"
              color="#10b981"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Daily Traffic"
              description="Number of unique visitors per day"
              data={getMetricData('traffic', 'WEBSITE')}
              color="#8b5cf6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Error Count"
              description="Number of errors reported per day"
              data={getMetricData('errors', 'WEBSITE')}
              color="#ef4444"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-4">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Uptime Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {websiteMetrics.uptime.status === 'success' 
                        ? 'Website has been consistently available with excellent uptime.'
                        : websiteMetrics.uptime.status === 'warning'
                        ? 'Some minor uptime issues detected. Consider investigating.'
                        : 'Significant downtime detected. Immediate attention required.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Activity className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Performance Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {websiteMetrics.loadSpeed.status === 'success' 
                        ? 'Website is loading quickly and performing optimally.'
                        : websiteMetrics.loadSpeed.status === 'warning'
                        ? 'Load times are acceptable but could be improved.'
                        : 'Page load times are too slow. Performance optimization needed.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Traffic Trends</h3>
                    <p className="text-sm text-muted-foreground">
                      {websiteMetrics.traffic.trend === 'up' 
                        ? 'Website traffic is growing steadily.'
                        : websiteMetrics.traffic.trend === 'stable'
                        ? 'Website traffic is stable.'
                        : 'Website traffic is declining. Marketing efforts might be needed.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Error Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {websiteMetrics.errors.status === 'success' 
                        ? 'No significant errors detected. Website is functioning properly.'
                        : websiteMetrics.errors.status === 'warning'
                        ? 'Some errors detected. Review error logs for details.'
                        : 'High number of errors detected. Immediate technical review needed.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="uptime">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Website Uptime Detailed View"
              description="Percentage of time the website is operational"
              data={getMetricData('uptime', 'WEBSITE')}
              unit="%"
              color="#3b82f6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Uptime Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Current Uptime</div>
                      <div className="text-2xl font-bold">{websiteMetrics.uptime.current.toFixed(2)}%</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Downtime (Hours)</div>
                      <div className="text-2xl font-bold">
                        {((100 - websiteMetrics.uptime.current) * 24 / 100).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Performance Score</div>
                      <div className="text-2xl font-bold">
                        {websiteMetrics.uptime.status === 'success' ? 'A' : 
                         websiteMetrics.uptime.status === 'warning' ? 'B' : 'C'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {websiteMetrics.uptime.status === 'success' ? (
                        <>
                          <li>Continue monitoring to maintain excellent uptime</li>
                          <li>Consider implementing redundancy systems for even higher reliability</li>
                          <li>Schedule routine maintenance during off-peak hours</li>
                        </>
                      ) : websiteMetrics.uptime.status === 'warning' ? (
                        <>
                          <li>Investigate recent outages and their root causes</li>
                          <li>Implement more robust monitoring systems</li>
                          <li>Consider load balancing or failover systems</li>
                        </>
                      ) : (
                        <>
                          <li>Urgent review of hosting infrastructure needed</li>
                          <li>Implement immediate technical improvements to reduce downtime</li>
                          <li>Consider server upgrades or hosting provider changes</li>
                          <li>Schedule emergency technical review</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Page Load Speed Detailed View"
              description="Average time to load pages in seconds"
              data={getMetricData('loadSpeed', 'WEBSITE')}
              unit="s"
              color="#10b981"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Current Load Time</div>
                      <div className="text-2xl font-bold">{websiteMetrics.loadSpeed.current.toFixed(2)}s</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Google PageSpeed Score</div>
                      <div className="text-2xl font-bold">
                        {websiteMetrics.loadSpeed.current < 1.5 ? '90+' : 
                         websiteMetrics.loadSpeed.current < 3 ? '70-89' : '< 70'}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Performance Grade</div>
                      <div className="text-2xl font-bold">
                        {websiteMetrics.loadSpeed.status === 'success' ? 'A' : 
                         websiteMetrics.loadSpeed.status === 'warning' ? 'B' : 'C'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Optimization Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {websiteMetrics.loadSpeed.status === 'success' ? (
                        <>
                          <li>Continue monitoring performance metrics</li>
                          <li>Consider advanced caching strategies for even better performance</li>
                          <li>Explore latest image optimization technologies</li>
                        </>
                      ) : websiteMetrics.loadSpeed.status === 'warning' ? (
                        <>
                          <li>Optimize image sizes and formats</li>
                          <li>Implement browser caching</li>
                          <li>Minify CSS and JavaScript files</li>
                          <li>Consider a Content Delivery Network (CDN)</li>
                        </>
                      ) : (
                        <>
                          <li>Urgent performance audit needed</li>
                          <li>Compress and optimize all assets</li>
                          <li>Implement lazy loading for images and non-critical content</li>
                          <li>Consider server-side rendering or static site generation</li>
                          <li>Upgrade hosting plan or server specifications</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="traffic">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Daily Traffic Detailed View"
              description="Number of unique visitors per day"
              data={getMetricData('traffic', 'WEBSITE')}
              color="#8b5cf6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Traffic Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Daily Average</div>
                      <div className="text-2xl font-bold">{Math.round(websiteMetrics.traffic.current)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Monthly Estimated</div>
                      <div className="text-2xl font-bold">{Math.round(websiteMetrics.traffic.current * 30)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Growth Trend</div>
                      <div className="text-2xl font-bold flex items-center">
                        {websiteMetrics.traffic.trend === 'up' ? (
                          <span className="text-green-500">Growing</span>
                        ) : websiteMetrics.traffic.trend === 'stable' ? (
                          <span className="text-muted-foreground">Stable</span>
                        ) : (
                          <span className="text-destructive">Declining</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Traffic Insights & Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {websiteMetrics.traffic.trend === 'up' ? (
                        <>
                          <li>Content is performing well - continue current strategies</li>
                          <li>Consider scaling infrastructure to handle growing traffic</li>
                          <li>Analyze top-performing channels and increase investment</li>
                        </>
                      ) : websiteMetrics.traffic.trend === 'stable' ? (
                        <>
                          <li>Implement new SEO strategies to increase organic traffic</li>
                          <li>Explore content marketing opportunities to attract new visitors</li>
                          <li>Consider targeted social media campaigns for growth</li>
                        </>
                      ) : (
                        <>
                          <li>Urgent marketing strategy review needed</li>
                          <li>Implement immediate SEO improvements</li>
                          <li>Consider paid advertising to boost traffic</li>
                          <li>Analyze user experience to improve engagement and retention</li>
                          <li>Review competing websites for benchmarking</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="errors">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Error Count Detailed View"
              description="Number of errors reported per day"
              data={getMetricData('errors', 'WEBSITE')}
              color="#ef4444"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Daily Errors</div>
                      <div className="text-2xl font-bold">{Math.round(websiteMetrics.errors.current)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Change</div>
                      <div className={`text-2xl font-bold ${
                        websiteMetrics.errors.trend === 'up' ? 'text-destructive' : 
                        websiteMetrics.errors.trend === 'down' ? 'text-green-500' : 
                        'text-muted-foreground'
                      }`}>
                        {websiteMetrics.errors.trend === 'up' ? '+' : 
                         websiteMetrics.errors.trend === 'down' ? '-' : ''}
                        {Math.abs(websiteMetrics.errors.changePercentage)}%
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                      <div className="text-2xl font-bold">
                        {websiteMetrics.errors.status === 'success' ? 'Healthy' : 
                         websiteMetrics.errors.status === 'warning' ? 'Warning' : 'Critical'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Error Remediation Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {websiteMetrics.errors.status === 'success' ? (
                        <>
                          <li>Continue regular monitoring of error logs</li>
                          <li>Maintain current error handling procedures</li>
                          <li>Consider implementing more detailed error tracking</li>
                        </>
                      ) : websiteMetrics.errors.status === 'warning' ? (
                        <>
                          <li>Review error logs to identify patterns</li>
                          <li>Implement fixes for common errors</li>
                          <li>Check for browser compatibility issues</li>
                          <li>Review recent code deployments for potential bugs</li>
                        </>
                      ) : (
                        <>
                          <li>Urgent technical review of all error logs needed</li>
                          <li>Implement immediate fixes for critical errors</li>
                          <li>Consider rolling back recent deployments if applicable</li>
                          <li>Implement comprehensive error monitoring and alerts</li>
                          <li>Schedule emergency technical support session</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebsitePerformanceDashboard;
