
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { Lead, LeadStatus } from '@/types/lead';
import { Badge } from '@/components/ui/badge';

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  searchQuery: string;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onConvert: (lead: Lead) => void;
  onAssign: (lead: Lead) => void;
  onView: (lead: Lead) => void;
}

const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onConvert,
  onAssign,
  onView,
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'CONTACTED':
        return 'bg-indigo-100 text-indigo-800';
      case 'QUALIFIED':
        return 'bg-green-100 text-green-800';
      case 'CONVERTED':
        return 'bg-purple-100 text-purple-800';
      case 'LOST':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'WEBSITE':
        return 'bg-green-50 text-green-700';
      case 'REFERRAL':
        return 'bg-blue-50 text-blue-700';
      case 'ADVERTISEMENT':
        return 'bg-purple-50 text-purple-700';
      case 'EVENT':
        return 'bg-orange-50 text-orange-700';
      case 'OTHER':
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Follow-Up</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length > 0 ? (
            leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(lead)}
              >
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusBadgeClass(lead.status)}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSourceBadgeClass(lead.leadSource)}>
                    {lead.leadSource}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.assignedTo ? (
                    <span>
                      {lead.assignedTo.firstName || lead.assignedTo.lastName
                        ? `${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`
                        : lead.assignedTo.email}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(lead.followUpDate)}</TableCell>
                <TableCell>{formatDate(lead.createdAt)}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    {lead.status !== 'CONVERTED' && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvert(lead);
                        }}
                        title="Convert to client"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign(lead);
                      }}
                      title="Assign staff"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(lead);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(lead.id);
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
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                {searchQuery ? 'No leads match your search criteria' : 'No leads found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadTable;
