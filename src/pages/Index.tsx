
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/lib/hooks/use-role';
import DashboardShell from '@/components/layout/DashboardShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { role, isLoading } = useRole();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  // Redirect to role-specific dashboard if user is logged in
  if (role) {
    return <Navigate to={`/${role}`} replace />;
  }
  
  // Public landing page for users who are not logged in
  return (
    <DashboardShell>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to CyberHand</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Your all-in-one digital services platform for web development, marketing, web hosting, and AI integration.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" asChild>
              <a href="/login">Sign In</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/register">Register</a>
            </Button>
          </div>
          
          <Tabs defaultValue="web" className="w-full max-w-3xl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="web">Web Development</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="hosting">Hosting</TabsTrigger>
              <TabsTrigger value="ai">AI Integration</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="web">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-2">Professional Web Development</h3>
                    <p className="text-muted-foreground">
                      Custom websites built for performance, security, and user experience. 
                      From simple landing pages to complex web applications.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="marketing">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-2">Digital Marketing</h3>
                    <p className="text-muted-foreground">
                      Comprehensive digital marketing strategies including SEO, 
                      content marketing, social media management, and PPC campaigns.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="hosting">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-2">Reliable Web Hosting</h3>
                    <p className="text-muted-foreground">
                      Fast, secure, and scalable hosting solutions with 99.9% uptime guarantee,
                      backup services, and technical support.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="ai">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-2">AI Integration</h3>
                    <p className="text-muted-foreground">
                      Enhance your web presence with AI-powered chatbots, recommendation systems,
                      content generation, and automation tools.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Index;
