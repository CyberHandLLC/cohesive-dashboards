
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ObserverBlogPage = () => {
  const breadcrumbs = [
    { label: 'Observer', href: '/observer' },
    { label: 'Explore', href: '/observer/explore' },
    { label: 'Blog' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: '10 Web Design Trends for 2023',
      excerpt: 'Discover the latest web design trends that are dominating the digital landscape this year.',
      date: 'June 15, 2023',
      category: 'Web Design',
      author: 'Jane Smith'
    },
    {
      id: 2,
      title: 'How to Improve Your Website's SEO',
      excerpt: 'Learn actionable strategies to boost your website's search engine rankings and drive more organic traffic.',
      date: 'May 22, 2023',
      category: 'SEO',
      author: 'John Doe'
    },
    {
      id: 3,
      title: 'The Benefits of Headless CMS for Modern Websites',
      excerpt: 'Explore how headless CMS architecture can provide flexibility and performance improvements for your website.',
      date: 'April 10, 2023',
      category: 'Development',
      author: 'Alex Johnson'
    },
    {
      id: 4,
      title: 'E-commerce Optimization: Boosting Conversion Rates',
      excerpt: 'Discover proven techniques to optimize your online store and increase your conversion rate.',
      date: 'March 28, 2023',
      category: 'E-commerce',
      author: 'Sarah Williams'
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
            <h1 className="text-2xl font-bold">CyberHand Blog</h1>
            <p className="text-muted-foreground">
              Insights, tips, and updates from our digital experts
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map(post => (
            <Card key={post.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{post.category}</span>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                </div>
                <CardTitle className="text-xl">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">
                  {post.excerpt}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">By {post.author}</span>
                <Button variant="ghost" size="sm">Read More</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button variant="outline">Load More Articles</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ObserverBlogPage;
