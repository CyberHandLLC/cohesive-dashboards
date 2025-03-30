
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogFooter } from '@/components/ui/dialog';
import TagInput from './TagInput';

interface Client {
  id: string;
  companyName: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface ContentFormProps {
  initialData?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  contentType: string;
  clients: Client[];
  authors: User[];
}

const contentFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  body: z.string().min(1, { message: "Content is required" }),
  authorId: z.string().min(1, { message: "Author is required" }),
  clientId: z.string().optional(),
  contentType: z.string().min(1),
  platform: z.string().optional(),
  status: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export default function ContentForm({
  initialData,
  onSubmit,
  onCancel,
  contentType,
  clients,
  authors,
}: ContentFormProps) {
  // Default values
  const defaultValues = initialData ? {
    ...initialData,
    tags: initialData.tags || [],
  } : {
    title: '',
    body: '',
    authorId: '',
    clientId: '',
    contentType: contentType,
    platform: contentType === 'SOCIAL_MEDIA_POST' ? 'TWITTER' : '',
    status: 'DRAFT',
    tags: [],
  };

  const form = useForm({
    resolver: zodResolver(contentFormSchema),
    defaultValues,
  });

  const selectedContentType = form.watch('contentType');
  const isSocialMedia = selectedContentType === 'SOCIAL_MEDIA_POST';

  const handleSubmit = (values: any) => {
    // Process tags if they exist
    onSubmit(values);
  };

  const getAuthorDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''} (${user.email})`;
    }
    return user.email;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
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
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={isSocialMedia ? "Enter social media post content" : "Enter content body"} 
                  className={isSocialMedia ? "h-20" : "h-40"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="authorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value || "select-author"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="select-author" disabled>Select author</SelectItem>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {getAuthorDisplayName(author)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client {!isSocialMedia && "(Optional)"}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value || "no-client"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No client" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
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

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
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

        {isSocialMedia && (
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || "TWITTER"}
                  value={field.value || "TWITTER"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TWITTER">Twitter</SelectItem>
                    <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
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
                  placeholder={isSocialMedia ? "Add hashtags..." : "Add tags..."}
                  tags={field.value || []}
                  setTags={(newTags) => field.onChange(newTags)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{initialData ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
