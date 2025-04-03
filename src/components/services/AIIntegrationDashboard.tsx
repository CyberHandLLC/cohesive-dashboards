import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Cpu, 
  BarChart2, 
  Users, 
  ThumbsUp,
  Zap
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useServiceMetrics } from '@/hooks/useServiceMetrics';
import { TimeRange } from '@/types/metrics';
import MetricCard from './MetricCard';
import MetricTimeSeriesChart from './MetricTimeSeriesChart';

interface AIIntegrationDashboardProps {
  clientServiceId: string;
  serviceName: string;
}

const AIIntegrationDashboard: React.FC<AIIntegrationDashboardProps> = ({
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
  
  const aiMetrics = getMetricsSnapshot().aiMetrics;
  
  if (!aiMetrics) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">{serviceName} AI Performance Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="API Usage"
            summary={aiMetrics.usage}
            precision={0}
            className="border-l-4 border-l-purple-500"
          />
          
          <MetricCard
            title="Accuracy"
            summary={aiMetrics.accuracy}
            unit="%"
            precision={1}
            className="border-l-4 border-l-blue-500"
          />
          
          <MetricCard
            title="User Engagement"
            summary={aiMetrics.engagement}
            unit="min"
            precision={1}
            className="border-l-4 border-l-green-500"
          />
          
          <MetricCard
            title="Value Score"
            summary={aiMetrics.value}
            precision={1}
            className="border-l-4 border-l-amber-500"
          />
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="value">Value</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricTimeSeriesChart
              title="AI API Usage"
              description="Number of AI API requests per day"
              data={getMetricData('usage', 'AI')}
              color="#a855f7"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="AI Accuracy"
              description="Accuracy percentage of AI responses"
              data={getMetricData('accuracy', 'AI')}
              unit="%"
              color="#3b82f6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="User Engagement"
              description="Average time users spend with AI features (minutes)"
              data={getMetricData('engagement', 'AI')}
              unit="min"
              color="#22c55e"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            
            <MetricTimeSeriesChart
              title="Value Perception"
              description="User satisfaction score (1-10)"
              data={getMetricData('value', 'AI')}
              color="#f59e0b"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-4">
                  <Cpu className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">AI Usage Trends</h3>
                    <p className="text-sm text-muted-foreground">
                      {aiMetrics.usage.trend === 'up' 
                        ? 'AI usage is increasing, showing strong adoption.' 
                        : aiMetrics.usage.trend === 'stable'
                        ? 'AI usage is stable. Consider new features to drive growth.'
                        : 'AI usage is declining. User education or feature improvements may be needed.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <BarChart2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Accuracy Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      {aiMetrics.accuracy.status === 'success' 
                        ? 'AI accuracy is excellent, delivering reliable results.'
                        : aiMetrics.accuracy.status === 'warning'
                        ? 'AI accuracy is acceptable but could be improved with model training.'
                        : 'AI accuracy needs significant improvement. Model review required.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">User Engagement</h3>
                    <p className="text-sm text-muted-foreground">
                      {aiMetrics.engagement.trend === 'up' 
                        ? 'Users are spending more time with AI features, showing increasing value.'
                        : aiMetrics.engagement.trend === 'stable'
                        ? 'User engagement is stable. Consider enhancing user experience.'
                        : 'User engagement is declining. UI/UX improvements may be needed.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <ThumbsUp className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Value Perception</h3>
                    <p className="text-sm text-muted-foreground">
                      {aiMetrics.value.status === 'success' 
                        ? 'Users perceive high value from AI features.'
                        : aiMetrics.value.status === 'warning'
                        ? 'Value perception is moderate. Consider new use cases.'
                        : 'Value perception is low. Feature review and improvements needed.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="AI API Usage Detailed View"
              description="Number of AI API requests per day"
              data={getMetricData('usage', 'AI')}
              color="#a855f7"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Daily Requests</div>
                      <div className="text-2xl font-bold">{Math.round(aiMetrics.usage.current)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Monthly Projected</div>
                      <div className="text-2xl font-bold">{Math.round(aiMetrics.usage.current * 30)}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Growth</div>
                      <div className={`text-2xl font-bold ${
                        aiMetrics.usage.trend === 'up' ? 'text-green-500' : 
                        aiMetrics.usage.trend === 'down' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {aiMetrics.usage.trend === 'up' ? '+' : 
                         aiMetrics.usage.trend === 'down' ? '-' : ''}
                        {Math.abs(aiMetrics.usage.changePercentage)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Usage Optimization Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {aiMetrics.usage.trend === 'up' ? (
                        <>
                          <li>Review API quota limits to ensure capacity for continued growth</li>
                          <li>Implement caching for common requests to reduce costs</li>
                          <li>Consider bulk processing options for high-volume operations</li>
                          <li>Monitor response times as volume increases</li>
                        </>
                      ) : aiMetrics.usage.trend === 'stable' ? (
                        <>
                          <li>Promote additional AI features to drive further adoption</li>
                          <li>Provide user education on less-used AI capabilities</li>
                          <li>Consider new AI use cases that could benefit the client</li>
                          <li>Survey users about desired AI features</li>
                        </>
                      ) : (
                        <>
                          <li>Investigate causes of declining usage</li>
                          <li>Check for technical issues or errors affecting user experience</li>
                          <li>Gather feedback on AI feature usability</li>
                          <li>Consider simplifying AI interfaces or improving prompts</li>
                          <li>Develop user re-engagement strategies</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="accuracy" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="AI Accuracy Detailed View"
              description="Accuracy percentage of AI responses"
              data={getMetricData('accuracy', 'AI')}
              unit="%"
              color="#3b82f6"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Current Accuracy</div>
                      <div className="text-2xl font-bold">{aiMetrics.accuracy.current.toFixed(1)}%</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Change</div>
                      <div className={`text-2xl font-bold ${
                        aiMetrics.accuracy.trend === 'up' ? 'text-green-500' : 
                        aiMetrics.accuracy.trend === 'down' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {aiMetrics.accuracy.trend === 'up' ? '+' : 
                         aiMetrics.accuracy.trend === 'down' ? '-' : ''}
                        {Math.abs(aiMetrics.accuracy.changePercentage)}%
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Error Rate</div>
                      <div className="text-2xl font-bold">{(100 - aiMetrics.accuracy.current).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Accuracy Improvement Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {aiMetrics.accuracy.status === 'success' ? (
                        <>
                          <li>Maintain current model and training procedures</li>
                          <li>Continue collecting user feedback for edge cases</li>
                          <li>Consider specialized models for specific use cases</li>
                          <li>Document successful prompt patterns</li>
                        </>
                      ) : aiMetrics.accuracy.status === 'warning' ? (
                        <>
                          <li>Review error patterns to identify improvement areas</li>
                          <li>Refine prompts to improve response quality</li>
                          <li>Consider fine-tuning models for specific domains</li>
                          <li>Implement human review for critical AI decisions</li>
                        </>
                      ) : (
                        <>
                          <li>Complete audit of AI error cases needed</li>
                          <li>Consider model upgrades or alternative providers</li>
                          <li>Implement guardrails and fallbacks for error-prone scenarios</li>
                          <li>Develop more structured data inputs to improve accuracy</li>
                          <li>Consider retraining with domain-specific data</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="User Engagement Detailed View"
              description="Average time users spend with AI features (minutes)"
              data={getMetricData('engagement', 'AI')}
              unit="min"
              color="#22c55e"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Avg. Session Time</div>
                      <div className="text-2xl font-bold">{aiMetrics.engagement.current.toFixed(1)} min</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Sessions Per User</div>
                      <div className="text-2xl font-bold">
                        {Math.max(1, Math.round(aiMetrics.usage.current / 100))}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Engagement Trend</div>
                      <div className={`text-2xl font-bold ${
                        aiMetrics.engagement.trend === 'up' ? 'text-green-500' : 
                        aiMetrics.engagement.trend === 'down' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {aiMetrics.engagement.trend === 'up' ? 'Increasing' : 
                         aiMetrics.engagement.trend === 'down' ? 'Decreasing' : 
                         'Stable'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Engagement Enhancement Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {aiMetrics.engagement.trend === 'up' ? (
                        <>
                          <li>Continue developing features that drive user engagement</li>
                          <li>Analyze most-used features for further enhancement</li>
                          <li>Consider introducing advanced AI capabilities</li>
                          <li>Implement user rewards for continued engagement</li>
                        </>
                      ) : aiMetrics.engagement.trend === 'stable' ? (
                        <>
                          <li>Introduce new AI features to re-engage users</li>
                          <li>Improve onboarding for new AI capabilities</li>
                          <li>Create user guides for advanced AI features</li>
                          <li>Consider gamification elements to increase engagement</li>
                        </>
                      ) : (
                        <>
                          <li>Conduct user interviews to identify engagement barriers</li>
                          <li>Review AI interface usability and simplify if needed</li>
                          <li>Consider revising UI/UX for AI features</li>
                          <li>Implement guided tours for complex AI features</li>
                          <li>Add automated suggestions to encourage feature discovery</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="value" className="space-y-6">
          <div className="space-y-6">
            <MetricTimeSeriesChart
              title="Value Perception Detailed View"
              description="User satisfaction score (1-10)"
              data={getMetricData('value', 'AI')}
              color="#f59e0b"
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              height={400}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Value Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Value Score</div>
                      <div className="text-2xl font-bold">{aiMetrics.value.current.toFixed(1)}/10</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Change</div>
                      <div className={`text-2xl font-bold ${
                        aiMetrics.value.trend === 'up' ? 'text-green-500' : 
                        aiMetrics.value.trend === 'down' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`}>
                        {aiMetrics.value.trend === 'up' ? '+' : 
                         aiMetrics.value.trend === 'down' ? '-' : ''}
                        {Math.abs(aiMetrics.value.changePercentage)}%
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Value Category</div>
                      <div className={`text-2xl font-bold ${
                        aiMetrics.value.current >= 8 ? 'text-green-500' : 
                        aiMetrics.value.current >= 6 ? 'text-amber-500' : 
                        'text-destructive'
                      }`}>
                        {aiMetrics.value.current >= 8 ? 'High' : 
                         aiMetrics.value.current >= 6 ? 'Medium' : 
                         'Low'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Value Enhancement Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {aiMetrics.value.status === 'success' ? (
                        <>
                          <li>Continue focusing on high-value AI use cases</li>
                          <li>Document ROI and value stories for client presentations</li>
                          <li>Explore premium AI features for additional value</li>
                          <li>Consider case studies showcasing successful outcomes</li>
                        </>
                      ) : aiMetrics.value.status === 'warning' ? (
                        <>
                          <li>Survey users on most valuable AI features and enhance them</li>
                          <li>Identify specific pain points in current AI implementation</li>
                          <li>Demonstrate concrete value through metrics and examples</li>
                          <li>Develop targeted training for underutilized valuable features</li>
                        </>
                      ) : (
                        <>
                          <li>Complete value perception audit with key stakeholders</li>
                          <li>Identify and address major gaps in perceived value</li>
                          <li>Consider pivoting AI strategy to focus on business outcomes</li>
                          <li>Develop clear ROI metrics for AI features</li>
                          <li>Schedule strategic review of AI implementation to align with business goals</li>
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

export default AIIntegrationDashboard;
