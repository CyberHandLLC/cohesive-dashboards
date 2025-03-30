
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ClientQuickLinks: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4">
      <Button asChild variant="outline">
        <Link to="/client/accounts/services">View Services</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/client/accounts/invoices">Pay Invoices</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/client/accounts/support">Submit Support Ticket</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/client/accounts/profile">Update Profile</Link>
      </Button>
    </div>
  );
};

export default ClientQuickLinks;
