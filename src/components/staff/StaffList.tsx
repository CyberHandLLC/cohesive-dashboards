
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Trash2 } from 'lucide-react';

interface StaffMember {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  title: string | null;
  department: string | null;
  bio: string | null;
  skills: string[] | null;
  hireDate: string | null;
  createdAt: string;
}

interface StaffListProps {
  staffMembers: StaffMember[];
  isLoading: boolean;
  searchQuery: string;
  onView: (staff: StaffMember) => void;
  onEdit: (staff: StaffMember) => void;
  onDelete: (staffId: string) => void;
  onAssignTask: (staff: StaffMember) => void;
}

const StaffList: React.FC<StaffListProps> = ({
  staffMembers,
  isLoading,
  searchQuery,
  onView,
  onEdit,
  onDelete,
  onAssignTask
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading staff members...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.length > 0 ? (
                staffMembers.map((staff) => (
                  <TableRow 
                    key={staff.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onView(staff)}
                  >
                    <TableCell>
                      {staff.user.firstName && staff.user.lastName
                        ? `${staff.user.firstName} ${staff.user.lastName}`
                        : staff.user.firstName || staff.user.lastName || 'No name provided'}
                    </TableCell>
                    <TableCell>{staff.user.email}</TableCell>
                    <TableCell>{staff.title || 'Not specified'}</TableCell>
                    <TableCell>{staff.department || 'Not specified'}</TableCell>
                    <TableCell>{staff.hireDate ? formatDate(staff.hireDate) : 'Not specified'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staff.skills ? (
                          staff.skills.map((skill, index) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))
                        ) : (
                          'No skills listed'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignTask(staff);
                          }}
                          title="Assign task"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(staff);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(staff.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {searchQuery ? 'No staff members match your search criteria' : 'No staff members found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default StaffList;
