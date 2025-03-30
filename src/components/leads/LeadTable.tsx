
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail,
  Phone, 
  Edit, 
  Trash2, 
  UserPlus,
  User
} from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  leadSource: string | null;
  assignedToId: string | null;
  assignedTo?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  notes: { content: string } | null;
  followUpDate: string | null;
  convertedClientId: string | null;
  convertedClient?: {
    companyName: string;
    id: string;
  };
  createdAt: string;
}

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvert: (lead: Lead) => void;
  onAssign: (lead: Lead) => void;
}

const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  isLoading,
  onEdit,
  onDelete,
  onConvert,
  onAssign,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const truncateText = (text: string, length = 50) => {
    if (text && text.length > length) {
      return text.substring(0, length) + '...';
    }
    return text;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'NEW':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>;
      case 'CONTACTED':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Contacted</Badge>;
      case 'QUALIFIED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Qualified</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Converted</Badge>;
      case 'LOST':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string | null) => {
    if (!source) return null;
    
    switch(source) {
      case 'WEBSITE':
        return <Badge variant="outline" className="bg-blue-50">Website</Badge>;
      case 'REFERRAL':
        return <Badge variant="outline" className="bg-green-50">Referral</Badge>;
      case 'ADVERTISEMENT':
        return <Badge variant="outline" className="bg-yellow-50">Advertisement</Badge>;
      case 'EVENT':
        return <Badge variant="outline" className="bg-purple-50">Event</Badge>;
      case 'OTHER':
        return <Badge variant="outline" className="bg-gray-50">Other</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-gray-50">
        <p className="text-muted-foreground">No leads found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.name}
                {lead.convertedClientId && lead.convertedClient && (
                  <div className="mt-1">
                    <Link 
                      to={`/admin/accounts/clients/${lead.convertedClientId}/overview`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="h-3 w-3" />
                      {lead.convertedClient.companyName}
                    </Link>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs space-y-1">
                  <span className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />{lead.email}
                  </span>
                  {lead.phone && (
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />{lead.phone}
                    </span>
                  )}
                  {lead.notes && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-muted-foreground text-left">
                          {truncateText(lead.notes.content, 20)}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{lead.notes.content}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(lead.status)}</TableCell>
              <TableCell>{lead.leadSource ? getSourceBadge(lead.leadSource) : "—"}</TableCell>
              <TableCell>
                {lead.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>
                      {`${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`.trim() || lead.assignedTo.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {lead.followUpDate ? (
                  <span 
                    className={
                      new Date(lead.followUpDate) < new Date() 
                        ? "text-red-600 font-medium" 
                        : ""
                    }
                  >
                    {formatDate(lead.followUpDate)}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDate(lead.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(lead)}
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-blue-600" 
                    onClick={() => onConvert(lead)}
                    disabled={lead.status === 'CONVERTED'}
                    title="Convert to client"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => onDelete(lead.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadTable;
