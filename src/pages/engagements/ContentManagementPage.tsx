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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/reports/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';

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

interface ContentForm {
  title: string;
  body: string;
  contentType: ContentType;
  tags: string;
  status: ContentStatus;
  publishedAt: string;
  client_id?: string | null;
  platform?: string | null;
}

const ContentManagementPage = () => {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string | 'ALL'>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<ContentType | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });

  const form = useForm<ContentForm>({
    defaultValues: {
      title: '',
      body: '',
      contentType: 'BLOG_POST',
      tags: '',
      status: 'DRAFT',
      publishedAt: new Date().toISOString().split('T')[0],
      client_id: null,
      platform: null,
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

  const onSubmit = async (values: ContentForm) => {
    try {
      const tagsArray = values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
      const { data, error } = await supabase
        .from('Content')
        .insert([
          {
            authorId: "123",
            title: values.title,
            body: values.body,
            contentType: values.contentType,
            tags: tagsArray,
            status: values.status,
            publishedAt: values.status === 'PUBLISHED' ? new Date().toISOString() : null,
            client_id: values.client_id || null,
            platform: values.contentType === 'SOCIAL_MEDIA_POST' ? values.platform : null
          }
        ]);
        
      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Content item created successfully",
      });

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

  const filteredContent = contentItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType = activeTab === 'ALL' || item.contentType === activeTab;
    const matchesClient = clientFilter === 'ALL' || item.client_id === clientFilter;
    const matchesPlatform = platformFilter === 'ALL' || item.platform === platformFilter;
    
    const matchesDateRange = !dateRange || !dateRange.from || !dateRange.to || (
      new Date(item.createdAt) >= dateRange.from &&
      new Date(item.createdAt) <= dateRange.to
    );
    
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

  const socialMediaPlatforms = ['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok'];

  // Count metrics for summary cards
  const totalContent = contentItems.length;
  const publishedContent = contentItems.filter(item => item.status === 'PUBLISHED').length;
  const draftContent = contentItems.filter(item => item.status === 'DRAFT').length;
  const clientSpecificContent = contentItems.filter(item => item.client_id !== null).length;
  const socialMediaPosts = contentItems.filter(item => item.contentType === 'SOCIAL_MEDIA_POST').length;
  const blogPosts = contentItems.filter(item => item.contentType === 'BLOG_POST').length;

  const watchFormType = form.watch('contentType');
  
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
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setClientFilter(clients.length > 0 ? clients[0].id : 'ALL')}>
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
          <Button onClick={() => setIsDialogOpen(true)}>
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

          <TabsContent value="ALL" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Content</CardTitle>
                <CardDescription>
                  Manage all your content items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <ContentFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  clients={clients}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPlatformFilter={false}
                />
                {/* Content Table */}
                <ContentTable 
                  contentItems={filteredContent}
                  isLoading={isLoading}
                  handleDelete={handleDelete}
                  handlePublishToggle={handlePublishToggle}
                  getStatusBadgeColor={getStatusBadgeColor}
                  clients={clients}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="BLOG_POST" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blog Posts</CardTitle>
                <CardDescription>
                  Manage your blog content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <ContentFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  clients={clients}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPlatformFilter={false}
                />
                {/* Content Table */}
                <ContentTable 
                  contentItems={filteredContent.filter(item => item.contentType === 'BLOG_POST')}
                  isLoading={isLoading}
                  handleDelete={handleDelete}
                  handlePublishToggle={handlePublishToggle}
                  getStatusBadgeColor={getStatusBadgeColor}
                  clients={clients}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="SOCIAL_MEDIA_POST" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Content</CardTitle>
                <CardDescription>
                  Manage your social media posts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <ContentFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  clients={clients}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPlatformFilter={true}
                />
                {/* Content Table */}
                <ContentTable 
                  contentItems={filteredContent.filter(item => item.contentType === 'SOCIAL_MEDIA_POST')}
                  isLoading={isLoading}
                  handleDelete={handleDelete}
                  handlePublishToggle={handlePublishToggle}
                  getStatusBadgeColor={getStatusBadgeColor}
                  clients={clients}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="RESOURCE" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
                <CardDescription>
                  Manage your resource content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <ContentFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  clients={clients}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPlatformFilter={false}
                />
                {/* Content Table */}
                <ContentTable 
                  contentItems={filteredContent.filter(item => item.contentType === 'RESOURCE')}
                  isLoading={isLoading}
                  handleDelete={handleDelete}
                  handlePublishToggle={handlePublishToggle}
                  getStatusBadgeColor={getStatusBadgeColor}
                  clients={clients}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="FAQ" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>FAQs</CardTitle>
                <CardDescription>
                  Manage your frequently asked questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <ContentFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  clients={clients}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPlatformFilter={false}
                />
                {/* Content Table */}
                <ContentTable 
                  contentItems={filteredContent.filter(item => item.contentType === 'FAQ')}
                  isLoading={isLoading}
                  handleDelete={handleDelete}
                  handlePublishToggle={handlePublishToggle}
                  getStatusBadgeColor={getStatusBadgeColor}
                  clients={clients}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="NEWS" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>News</CardTitle>
                <CardDescription>
                  Manage your news content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <ContentFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  clientFilter={clientFilter}
                  setClientFilter={setClientFilter}
                  clients={clients}
                  platformFilter={platformFilter}
                  setPlatformFilter={setPlatformFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPlatformFilter={false}
                />
                {/* Content Table */}
                <ContentTable 
                  contentItems={filteredContent.filter(item => item.contentType === 'NEWS')}
                  isLoading={isLoading}
                  handleDelete={handleDelete}
                  handlePublishToggle={handlePublishToggle}
                  getStatusBadgeColor={getStatusBadgeColor}
                  clients={clients}
                  searchQuery={searchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
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
                          <SelectItem value="BLOG_POST">Blog Post</SelectItem>
                          <SelectItem value="SOCIAL_MEDIA_POST">Social Media Post</SelectItem>
                          <SelectItem value="RESOURCE">Resource</SelectItem>
                          <SelectItem value="FAQ">FAQ</SelectItem>
                          <SelectItem value="NEWS">News</SelectItem>
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

              {/* Client selection */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Platform selection for social media posts */}
              {watchFormType === 'SOCIAL_MEDIA_POST' && (
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {socialMediaPlatforms.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter tags separated by commas (e.g., tag1, tag2)" 
                        {...field} 
                      />
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

interface ContentFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: ContentStatus | 'ALL';
  setStatusFilter: (value: ContentStatus | 'ALL') => void;
  clientFilter: string | 'ALL';
  setClientFilter: (value: string | 'ALL') => void;
  clients: Client[];
  platformFilter: string | 'ALL';
  setPlatformFilter: (value: string | 'ALL') => void;
  dateRange: DateRange | undefined;
  setDateRange: (value: DateRange | undefined) => void;
  showPlatformFilter: boolean;
}

const ContentFilters: React.FC<ContentFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  clients,
  platformFilter,
  setPlatformFilter,
  dateRange,
  setDateRange,
  showPlatformFilter
}) => {
  const socialMediaPlatforms = ['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok'];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DatePickerWithRange 
          dateRange={dateRange}
          setDateRange={setDateRange}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ContentStatus | 'ALL')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={clientFilter}
          onValueChange={(value) => setClientFilter(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {showPlatformFilter && (
          <Select
            value={platformFilter}
            onValueChange={(value) => setPlatformFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Platforms</SelectItem>
              {socialMediaPlatforms.map((platform) => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
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

const ContentTable: React.FC<ContentTableProps> = ({
  contentItems,
  isLoading,
  handleDelete,
  handlePublishToggle,
  getStatusBadgeColor,
  clients,
  searchQuery
}) => {
  const getClientName = (clientId: string | null) => {
    if (!clientId) return "N/A";
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : "Unknown Client";
  };
  
  return (
    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="text-center py-4">Loading content...</div>
      ) : contentItems.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          {searchQuery
            ? "No content matches your search"
            : "No content items found"}
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
            {contentItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  {item.contentType === 'BLOG_POST' ? 'Blog Post' :
                   item.contentType === 'SOCIAL_MEDIA_POST' ? 'Social Media' :
                   item.contentType === 'RESOURCE' ? 'Resource' :
                   item.contentType === 'FAQ' ? 'FAQ' : 'News'}
                </TableCell>
                <TableCell>{getClientName(item.client_id)}</TableCell>
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
  );
};

export default ContentManagementPage;
