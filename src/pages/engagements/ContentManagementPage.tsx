import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search } from 'lucide-react';

// Define types that match the exact backend enum values
type ContentType = "NEWS" | "BLOG_POST" | "RESOURCE" | "FAQ";
type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ContentItem {
  id: string;
  title: string;
  body: string;
  contentType: ContentType;
  tags: string[];
  status: ContentStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

interface ContentForm {
  title: string;
  body: string;
  contentType: "NEWS" | "BLOG" | "RESOURCE" | "FAQ";
  tags: string[];
  status: ContentStatus;
  publishedAt: string;
}

const ContentManagementPage = () => {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'ALL'>('ALL');

  const form = useForm<ContentForm>({
    defaultValues: {
      title: '',
      body: '',
      contentType: 'BLOG',
      tags: [],
      status: 'DRAFT',
      publishedAt: new Date().toISOString().split('T')[0],
    },
  });

  const fetchContentItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Content')
        .select('*');

      if (error) {
        throw error;
      }

      // When setting content items, ensure the type matches the backend
      setContentItems(data as ContentItem[]);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load content items",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContentItems();
  }, []);

  // When creating new content, use the correct enum values:
  const onSubmit = async (values: ContentForm) => {
    try {
      // Map the form content type to the exact expected backend value
      let backendContentType: ContentType;
      switch (values.contentType) {
        case "BLOG":
          backendContentType = "BLOG_POST";
          break;
        case "NEWS":
        case "RESOURCE": 
        case "FAQ":
          backendContentType = values.contentType;
          break;
        default:
          backendContentType = "BLOG_POST";
      }

      const { data, error } = await supabase
        .from('Content')
        .insert([
          {
            authorId: "123", // This should be a real user ID in production
            title: values.title,
            body: values.body,
            contentType: backendContentType,
            tags: values.tags,
            status: values.status,
            publishedAt: values.publishedAt
          }
        ]);
        
      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Content item created successfully",
      });

      // Refresh content list
      fetchContentItems();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create content item",
      });
    }
  };

  const filteredContent = contentItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: ContentStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-blue-500';
      case 'PUBLISHED':
        return 'bg-green-500';
      case 'ARCHIVED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Content Management' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Content Management</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Content
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ContentStatus | 'ALL')}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content Items</CardTitle>
            <CardDescription>
              Manage your website content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading content...</div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery || statusFilter !== 'ALL'
                  ? "No content matches your filters"
                  : "No content items found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusBadgeColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.contentType}</TableCell>
                        <TableCell>
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Content Item</DialogTitle>
            <DialogDescription>
              Add a new content item to your website
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Title of the content" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Content of the item" 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEWS">News</SelectItem>
                          <SelectItem value="BLOG">Blog Post</SelectItem>
                          <SelectItem value="RESOURCE">Resource</SelectItem>
                          <SelectItem value="FAQ">FAQ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="publishedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Content</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ContentManagementPage;
