
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
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search, Edit2, Trash2, Eye, Calendar } from 'lucide-react';

type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type ContentType = 'BLOG' | 'NEWS' | 'CASE_STUDY' | 'PAGE';

interface ContentItem {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  contentType: ContentType;
  tags: string[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface ContentFormValues {
  title: string;
  body: string;
  contentType: ContentType;
  tags: string;
  status: ContentStatus;
}

const ContentManagementPage = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'ALL'>('ALL');

  const form = useForm<ContentFormValues>({
    defaultValues: {
      title: '',
      body: '',
      contentType: 'BLOG',
      tags: '',
      status: 'DRAFT',
    },
  });

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Content')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) {
        throw error;
      }

      setContents(data || []);
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
    fetchContents();
  }, []);

  const openCreateDialog = () => {
    form.reset({
      title: '',
      body: '',
      contentType: 'BLOG',
      tags: '',
      status: 'DRAFT',
    });
    setIsEditMode(false);
    setCurrentContentId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (content: ContentItem) => {
    form.reset({
      title: content.title,
      body: content.body,
      contentType: content.contentType,
      tags: content.tags ? content.tags.join(', ') : '',
      status: content.status,
    });
    setIsEditMode(true);
    setCurrentContentId(content.id);
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ContentFormValues) => {
    try {
      // Convert comma separated tags to array
      const tagsArray = values.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      const contentData = {
        title: values.title,
        body: values.body,
        contentType: values.contentType,
        tags: tagsArray,
        status: values.status,
        // Set publishedAt date if status is PUBLISHED
        publishedAt: values.status === 'PUBLISHED' ? new Date().toISOString() : null,
      };

      let error;
      
      if (isEditMode && currentContentId) {
        // Update existing content
        const { error: updateError } = await supabase
          .from('Content')
          .update(contentData)
          .eq('id', currentContentId);
        
        error = updateError;
      } else {
        // Create new content
        const { error: insertError } = await supabase
          .from('Content')
          .insert([{
            ...contentData,
            // This would need to be updated with the actual user ID when authentication is implemented
            authorId: '00000000-0000-0000-0000-000000000000',
          }]);
        
        error = insertError;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: isEditMode ? "Content updated successfully" : "Content created successfully",
      });

      // Refresh content list
      fetchContents();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} content`,
      });
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        const { error } = await supabase
          .from('Content')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Content deleted successfully",
        });

        // Refresh content list
        fetchContents();
      } catch (error) {
        console.error("Error deleting content:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete content",
        });
      }
    }
  };

  const handlePublishContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Content')
        .update({
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Content published successfully",
      });

      // Refresh content list
      fetchContents();
    } catch (error) {
      console.error("Error publishing content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to publish content",
      });
    }
  };

  const filteredContents = contents.filter((content) => {
    const matchesSearch = 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || content.contentType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || content.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadgeColor = (status: ContentStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-500';
      case 'PUBLISHED':
        return 'bg-green-500';
      case 'ARCHIVED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatContentType = (type: ContentType) => {
    return type.replace('_', ' ');
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Engagements', href: '/admin/engagements' },
    { label: 'Content Management' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">
              Create and manage website content
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Content
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as ContentType | 'ALL')}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="BLOG">Blog</SelectItem>
                  <SelectItem value="NEWS">News</SelectItem>
                  <SelectItem value="CASE_STUDY">Case Study</SelectItem>
                  <SelectItem value="PAGE">Page</SelectItem>
                </SelectContent>
              </Select>
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
              Manage website content, blogs, and articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading content...</div>
            ) : filteredContents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? "No content items match your filters"
                  : "No content items found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContents.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell>{formatContentType(content.contentType)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusBadgeColor(content.status)}>
                            {content.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(content.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(content.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(content)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {content.status === 'DRAFT' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handlePublishContent(content.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Content' : 'Create New Content'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update your content details below' 
                : 'Fill in the details to create new content'}
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
                      <Input placeholder="Content title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BLOG">Blog</SelectItem>
                          <SelectItem value="NEWS">News</SelectItem>
                          <SelectItem value="CASE_STUDY">Case Study</SelectItem>
                          <SelectItem value="PAGE">Page</SelectItem>
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
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma separated tags" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your content here..." 
                        rows={12}
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ContentManagementPage;
