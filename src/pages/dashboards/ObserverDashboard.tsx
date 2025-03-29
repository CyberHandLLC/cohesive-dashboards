
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ObserverDashboard = () => {
  const breadcrumbs = [
    { label: 'Observer', href: '/observer' },
    { label: 'Dashboard' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="observer"
    >
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome to CyberHand
            </h1>
            <p className="text-muted-foreground">
              Explore our services and offerings
            </p>
          </div>
          <Button asChild>
            <a href="/observer/explore/contact">Contact Us</a>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Web Development</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Custom websites built for performance, security, and user experience. 
                From simple landing pages to complex web applications.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href="/observer/explore/services">Learn More</a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digital Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Comprehensive digital marketing strategies including SEO, 
                content marketing, social media management, and PPC campaigns.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href="/observer/explore/services">Learn More</a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Enhance your web presence with AI-powered chatbots, recommendation systems,
                content generation, and automation tools.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href="/observer/explore/services">Learn More</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="web" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="web">Web Development</TabsTrigger>
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
                <TabsTrigger value="ai">AI Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="web">
                <div className="text-center py-6 text-muted-foreground">
                  Web development blog posts will appear here
                </div>
              </TabsContent>
              
              <TabsContent value="marketing">
                <div className="text-center py-6 text-muted-foreground">
                  Marketing blog posts will appear here
                </div>
              </TabsContent>
              
              <TabsContent value="ai">
                <div className="text-center py-6 text-muted-foreground">
                  AI trends blog posts will appear here
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <a href="/observer/explore/blog">View All Blog Posts</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ObserverDashboard;
