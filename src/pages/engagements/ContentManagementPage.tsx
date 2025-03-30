
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import ContentFilters from '@/components/admin/content/ContentFilters';
import ContentForm from '@/components/admin/content/ContentForm';

type ContentType = "BLOG_POST" | "RESOURCE" | "FAQ" | "NEWS" | "SOCIAL_MEDIA_POST";
type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ContentItem {
  id: string;
  title: string;
  body: string;
  contentType: ContentType;
  tags: string[];
  status: ContentStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  client_id: string | null;
  platform: string | null;
}

interface Client {
  id: string;
  companyName: string;
}

const ContentManagementPage = () => {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  const [startDate, setStartDate] = useState<Date | null>(dateRange?.from || null);
  const [endDate, setEndDate] = useState<Date | null>(dateRange?.to || null);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  const fetchContentItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Content')
        .select('*');

      if (error) {
        throw error;
      }

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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName');

      if (error) {
        throw error;
      }

      setClients(data as Client[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load client list",
      });
    }
  };

  useEffect(() => {
    fetchContentItems();
    fetchClients();
  }, []);

  useEffect(() => {
    if (dateRange?.from) {
      setStartDate(dateRange.from);
    }
    if (dateRange?.to) {
      setEndDate(dateRange.to);
    }
  }, [dateRange]);

  const onSubmit = async (values: any) => {
    try {
      const tagsArray = Array.isArray(values.tags) ? values.tags : [];
      
      if (editingContent) {
        // Update existing content
        const { error } = await supabase
          .from('Content')
          .update({
            title: values.title,
            body: values.body,
            contentType: values.contentType,
            tags: tagsArray,
            status: values.status,
            client_id: values.client_id === "no-client" ? null : values.client_id,
            platform: values.contentType === 'SOCIAL_MEDIA_POST' ? 
              (values.platform === "no-platform" ? null : values.platform) : null,
            publishedAt: values.status === 'PUBLISHED' && !editingContent.publishedAt ? 
              new Date().toISOString() : editingContent.publishedAt,
            updatedAt: new Date().toISOString()
          })
          .eq('id', editingContent.id);
          
        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Content updated successfully",
        });
      } else {
        // Create new content
        const { error } = await supabase
          .from('Content')
          .insert([
            {
              authorId: "123", // Replace with actual user ID from auth context
              title: values.title,
              body: values.body,
              contentType: values.contentType,
              tags: tagsArray,
              status: values.status,
              publishedAt: values.status === 'PUBLISHED' ? new Date().toISOString() : null,
              client_id: values.client_id === "no-client" ? null : values.client_id,
              platform: values.contentType === 'SOCIAL_MEDIA_POST' ? 
                (values.platform === "no-platform" ? null : values.platform) : null
            }
          ]);
          
        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Content created successfully",
        });
      }

      fetchContentItems();
      setIsDialogOpen(false);
      setEditingContent(null);
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editingContent ? 'update' : 'create'} content item`,
      });
    }
  };

  const handlePublishToggle = async (item: ContentItem) => {
    try {
      const newStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      const publishedAt = newStatus === 'PUBLISHED' ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from('Content')
        .update({ 
          status: newStatus,
          publishedAt: publishedAt
        })
        .eq('id', item.id);
        
      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Content ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'} successfully`,
      });

      fetchContentItems();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update content status",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this content?")) {
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

        fetchContentItems();
      } catch (error) {
        console.error("Error deleting content:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete content item",
        });
      }
    }
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setClientFilter(null);
    setPlatformFilter(null);
    setDateRange({
      from: subMonths(new Date(), 6),
      to: new Date()
    });
  };

  const filteredContent = contentItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(item.tags) && item.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesType = activeTab === 'ALL' || item.contentType === activeTab;
    const matchesClient = !clientFilter || (
      clientFilter === 'no-client' ? 
        item.client_id === null : 
        item.client_id === clientFilter
    );
    const matchesPlatform = !platformFilter || item.platform === platformFilter;
    
    const matchesDateRange = 
      !startDate || 
      !endDate || 
      (new Date(item.createdAt) >= startDate &&
      new Date(item.createdAt) <= endDate);
    
    return matchesSearch && matchesStatus && matchesType && matchesClient && matchesPlatform && matchesDateRange;
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

  // Count metrics for summary cards
  const totalContent = contentItems.length;
  const publishedContent = contentItems.filter(item => item.status === 'PUBLISHED').length;
  const draftContent = contentItems.filter(item => item.status === 'DRAFT').length;
  const clientSpecificContent = contentItems.filter(item => item.client_id !== null).length;
  const socialMediaPosts = contentItems.filter(item => item.contentType === 'SOCIAL_MEDIA_POST').length;
  const blogPosts = contentItems.filter(item => item.contentType === 'BLOG_POST').length;
  
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Content Management' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="Content Management"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab('ALL')}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Content</div>
              <div className="text-2xl font-bold">{totalContent}</div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setStatusFilter('PUBLISHED')}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Published</div>
              <div className="text-2xl font-bold">{publishedContent}</div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setStatusFilter('DRAFT')}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Draft</div>
              <div className="text-2xl font-bold">{draftContent}</div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setClientFilter(clients.length > 0 ? clients[0].id : null)}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Client-Specific</div>
              <div className="text-2xl font-bold">{clientSpecificContent}</div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab('SOCIAL_MEDIA_POST')}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Social Media</div>
              <div className="text-2xl font-bold">{socialMediaPosts}</div>
            </CardContent>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab('BLOG_POST')}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Blog Posts</div>
              <div className="text-2xl font-bold">{blogPosts}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Content Items</h1>
          <Button onClick={() => {
            setEditingContent(null);
            setIsDialogOpen(true);
          }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Content
          </Button>
        </div>

        <Tabs 
          value={activeTab === 'ALL' ? 'ALL' : activeTab}
          onValueChange={(value) => setActiveTab(value as ContentType | 'ALL')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
            <TabsTrigger value="ALL">All Content</TabsTrigger>
            <TabsTrigger value="BLOG_POST">Blog Content</TabsTrigger>
            <TabsTrigger value="SOCIAL_MEDIA_POST">Social Media</TabsTrigger>
            <TabsTrigger value="RESOURCE">Resources</TabsTrigger>
            <TabsTrigger value="FAQ">FAQs</TabsTrigger>
            <TabsTrigger value="NEWS">News</TabsTrigger>
          </TabsList>

          {/* Content for each tab */}
          {['ALL', 'BLOG_POST', 'SOCIAL_MEDIA_POST', 'RESOURCE', 'FAQ', 'NEWS'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tabValue === 'ALL' ? 'All Content' :
                     tabValue === 'BLOG_POST' ? 'Blog Content' :
                     tabValue === 'SOCIAL_MEDIA_POST' ? 'Social Media Content' :
                     tabValue === 'RESOURCE' ? 'Resources' :
                     tabValue === 'FAQ' ? 'FAQs' : 'News'}
                  </CardTitle>
                  <CardDescription>
                    {tabValue === 'ALL' ? 'Manage all your content items' :
                     tabValue === 'BLOG_POST' ? 'Manage your blog content' :
                     tabValue === 'SOCIAL_MEDIA_POST' ? 'Manage your social media posts' :
                     tabValue === 'RESOURCE' ? 'Manage your resource content' :
                     tabValue === 'FAQ' ? 'Manage your frequently asked questions' : 'Manage your news content'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <ContentFilters 
                    searchTerm={searchQuery}
                    setSearchTerm={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    clientFilter={clientFilter}
                    setClientFilter={setClientFilter}
                    clients={clients}
                    platformFilter={platformFilter}
                    setPlatformFilter={setPlatformFilter}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    resetFilters={resetFilters}
                    showPlatformFilter={tabValue === 'SOCIAL_MEDIA_POST' || tabValue === 'ALL'}
                  />
                  
                  {/* Content Table */}
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="py-6 text-center text-muted-foreground">Loading content...</div>
                    ) : filteredContent.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground">
                        {searchQuery || statusFilter || clientFilter || platformFilter || startDate || endDate ? 
                          'No content matches your search or filters' : 'No content items found'}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="hidden md:table-cell">Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContent.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                {item.contentType === 'BLOG_POST' ? 'Blog Post' :
                                 item.contentType === 'SOCIAL_MEDIA_POST' ? 'Social Media' :
                                 item.contentType === 'RESOURCE' ? 'Resource' :
                                 item.contentType === 'FAQ' ? 'FAQ' : 'News'}
                              </TableCell>
                              <TableCell>
                                {item.client_id ? 
                                  clients.find(c => c.id === item.client_id)?.companyName || 'Unknown Client' : 
                                  'N/A'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{item.platform || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={getStatusBadgeColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handlePublishToggle(item)}
                                >
                                  {item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Content Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit Content Item' : 'Create Content Item'}</DialogTitle>
            <DialogDescription>
              {editingContent ? 'Update this content item' : 'Add a new content item to your website'}
            </DialogDescription>
          </DialogHeader>
          
          <ContentForm 
            onSubmit={onSubmit}
            initialData={editingContent || undefined}
            clients={clients}
            isContentTypeFixed={!!editingContent}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

interface ContentTableProps {
  contentItems: ContentItem[];
  isLoading: boolean;
  handleDelete: (id: string) => void;
  handlePublishToggle: (item: ContentItem) => void;
  getStatusBadgeColor: (status: ContentStatus) => string;
  clients: Client[];
  searchQuery: string;
}

export default ContentManagementPage;
