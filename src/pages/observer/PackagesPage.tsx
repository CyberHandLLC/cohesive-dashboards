
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ObserverPackagesPage = () => {
  const breadcrumbs = [
    { label: 'Observer', href: '/observer' },
    { label: 'Explore', href: '/observer/explore' },
    { label: 'Packages' }
  ];

  const packages = [
    {
      id: 1,
      title: 'Starter Package',
      description: 'Perfect for small businesses getting started online.',
      price: '$1,999',
      features: [
        'Professional Website Design',
        'Mobile Responsive',
        '5 Pages',
        'Basic SEO Setup',
        'Contact Form',
        '1 Month of Support'
      ]
    },
    {
      id: 2,
      title: 'Business Package',
      description: 'Comprehensive solution for established businesses.',
      price: '$3,499',
      featured: true,
      features: [
        'Everything in Starter Package',
        'E-Commerce Integration',
        '10 Pages',
        'Advanced SEO Setup',
        'Social Media Integration',
        'Blog Setup',
        '3 Months of Support'
      ]
    },
    {
      id: 3,
      title: 'Enterprise Package',
      description: 'Full-service solution for large organizations.',
      price: '$6,999',
      features: [
        'Everything in Business Package',
        'Custom Functionality',
        'Unlimited Pages',
        'Monthly SEO Services',
        'Content Marketing Plan',
        'Advanced Analytics',
        '12 Months of Support'
      ]
    }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="observer"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Service Packages</h1>
            <p className="text-muted-foreground">
              Choose the perfect package for your business needs
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <Card 
              key={pkg.id} 
              className={`flex flex-col ${pkg.featured ? 'border-primary shadow-lg' : ''}`}
            >
              <CardHeader>
                <CardTitle>{pkg.title}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-3xl font-bold mb-4">{pkg.price}</p>
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={pkg.featured ? "default" : "outline"}
                >
                  Select Package
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Custom Package</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Need something specific? We can create a custom package tailored to your exact requirements.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <a href="/observer/explore/contact">Contact for Custom Quote</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ObserverPackagesPage;
