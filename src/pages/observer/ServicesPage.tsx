
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ObserverServicesPage = () => {
  const breadcrumbs = [
    { label: 'Observer', href: '/observer' },
    { label: 'Explore', href: '/observer/explore' },
    { label: 'Services' }
  ];

  const services = [
    {
      id: 1,
      title: 'Custom Web Development',
      description: 'Professional custom website development tailored to your specific business needs.',
      price: 'Starting at $1,999'
    },
    {
      id: 2,
      title: 'E-Commerce Solutions',
      description: 'Full-featured online stores with payment processing, inventory management, and more.',
      price: 'Starting at $2,499'
    },
    {
      id: 3,
      title: 'SEO Optimization',
      description: 'Improve your search engine rankings and drive organic traffic to your website.',
      price: 'Starting at $999'
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
            <h1 className="text-2xl font-bold">Our Services</h1>
            <p className="text-muted-foreground">
              Explore our range of digital services tailored for your business
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(service => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground mb-4">
                  {service.description}
                </p>
                <p className="font-semibold">{service.price}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Need a custom solution?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? We offer custom solutions tailored to your specific business needs.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/observer/explore/contact">Contact Us</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ObserverServicesPage;
