
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface LeadAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (staffId: string | null) => void;
  staffMembers: StaffMember[];
  leadName: string;
  currentStaffId?: string | null;
}

const assignFormSchema = z.object({
  staffId: z.string().optional().nullable(),
});

const LeadAssignDialog: React.FC<LeadAssignDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  staffMembers,
  leadName,
  currentStaffId
}) => {
  const form = useForm({
    resolver: zodResolver(assignFormSchema),
    defaultValues: {
      staffId: currentStaffId || null,
    },
  });

  const handleSubmit = (values: any) => {
    const staffId = values.staffId === 'unassigned' ? null : values.staffId;
    onSubmit(staffId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Lead: {leadName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To Staff Member</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || "unassigned"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {staffMembers.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.firstName || staff.lastName ? 
                            `${staff.firstName || ''} ${staff.lastName || ''}`.trim() : 
                            staff.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Assign</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadAssignDialog;
