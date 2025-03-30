
import React from 'react';
import { useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import TagInput from './TagInput';

type ContentType = "BLOG_POST" | "RESOURCE" | "FAQ" | "NEWS" | "SOCIAL_MEDIA_POST";
type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface Client {
  id: string;
  companyName: string;
}

interface ContentFormData {
  title: string;
  body: string;
  contentType: ContentType;
  tags: string[];
  status: ContentStatus;
  client_id?: string | null;
  platform?: string | null;
}

interface ContentFormProps {
  onSubmit: (values: ContentFormData) => Promise<void>;
  initialData?: Partial<ContentFormData>;
  clients: Client[];
  isContentTypeFixed?: boolean;
}

const ContentForm: React.FC<ContentFormProps> = ({
  onSubmit,
  initialData,
  clients,
  isContentTypeFixed = false
}) => {
  const form = useForm<ContentFormData>({
    defaultValues: {
      title: initialData?.title || '',
      body: initialData?.body || '',
      contentType: initialData?.contentType || 'BLOG_POST',
      tags: initialData?.tags || [],
      status: initialData?.status || 'DRAFT',
      client_id: initialData?.client_id || null,
      platform: initialData?.platform || null,
    },
  });

  const watchContentType = form.watch('contentType');
  const socialMediaPlatforms = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram', 'YouTube', 'TikTok'];

  const handleSubmit = async (values: ContentFormData) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      console.error('Error submitting content:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Title is required" }}
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
          rules={{ required: "Content body is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Content of the item" 
                  rows={watchContentType === 'BLOG_POST' ? 6 : 4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isContentTypeFixed && (
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "no-client"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no-client">No client</SelectItem>
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
        </div>

        {(watchContentType === 'SOCIAL_MEDIA_POST' || initialData?.contentType === 'SOCIAL_MEDIA_POST') && (
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "no-platform"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no-platform">Select a platform</SelectItem>
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
                <TagInput 
                  tags={field.value} 
                  onChange={field.onChange}
                  placeholder="Enter tags and press Enter"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">
            {initialData ? 'Update Content' : 'Create Content'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContentForm;
