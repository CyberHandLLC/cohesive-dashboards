
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, AlertCircle, Clock, CreditCard } from "lucide-react";

interface InvoiceSummaryCardsProps {
  totalInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueInvoices: number;
  isLoading?: boolean;
}

const InvoiceSummaryCards: React.FC<InvoiceSummaryCardsProps> = ({
  totalInvoices,
  totalRevenue,
  outstandingAmount,
  overdueInvoices,
  isLoading = false,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted/20 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold">{totalInvoices}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted/20 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted/20 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(outstandingAmount)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-9 bg-muted/20 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSummaryCards;
