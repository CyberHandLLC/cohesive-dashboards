
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Search, Plus, Filter } from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients' }
  ];

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('Client')
          .select('id, companyName, status, industry, websiteUrl, serviceStartDate, serviceEndDate')
          .order('companyName', { ascending: true });
        
        if (searchQuery) {
          query = query.ilike('companyName', `%${searchQuery}%`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          setClients(data || []);
        }
      } catch (error) {
        console.error('Error in clients fetch operation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClients();
  }, [searchQuery]);

  const handleViewClient = (clientId: string) => {
    // Navigate to the admin view of client profile, not the client's own view
    navigate(`/admin/accounts/clients/${clientId}/overview`);
  };

  const handleAddClient = () => {
    navigate('/admin/accounts/clients/new');
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddClient} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading clients...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Client Name</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Industry</th>
                      <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Website</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <tr key={client.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{client.companyName}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              client.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {client.industry || <span className="text-muted-foreground">Not specified</span>}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {client.websiteUrl ? (
                              <a 
                                href={client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {client.websiteUrl.replace(/^https?:\/\//, '')}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">Not available</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewClient(client.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          {searchQuery ? 'No clients match your search criteria' : 'No clients found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;
