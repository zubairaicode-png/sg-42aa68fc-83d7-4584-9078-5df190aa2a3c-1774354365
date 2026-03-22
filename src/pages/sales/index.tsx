import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Invoice, InvoiceStatus } from "@/types";
import Link from "next/link";
import { salesService } from "@/services/salesService";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";

export default function SalesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, customersData] = await Promise.all([
        salesService.getAllInvoices(),
        customerService.getAll()
      ]);
      setSalesInvoices(invoicesData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "paid": return "text-success bg-success/10";
      case "pending": return "text-warning bg-warning/10";
      case "overdue": return "text-destructive bg-destructive/10";
      case "draft": return "text-muted-foreground bg-muted";
      case "cancelled": return "text-muted-foreground bg-muted/50";
    }
  };

  const stats = {
    totalSales: salesInvoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: salesInvoices.reduce((sum, inv) => sum + inv.paid, 0),
    pendingAmount: salesInvoices.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.balance, 0),
    overdueAmount: salesInvoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + inv.balance, 0),
  };

  return (
    <>
      <SEO 
        title="Sales - Saudi ERP System"
        description="Manage sales invoices and customer orders"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Sales Management</h1>
              <p className="text-muted-foreground mt-1">Create and manage sales invoices</p>
            </div>
            <div className="flex gap-2">
              <Link href="/sales/returns">
                <Button variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Sales Returns
                </Button>
              </Link>
              <Link href="/sales/create">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  New Sales Invoice
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">SAR {stats.totalSales.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-success">SAR {stats.paidAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">SAR {stats.pendingAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-destructive">SAR {stats.overdueAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Sales Invoices</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-table-header">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Invoice #</th>
                        <th className="text-left p-4 font-semibold text-sm">Customer</th>
                        <th className="text-left p-4 font-semibold text-sm">Date</th>
                        <th className="text-left p-4 font-semibold text-sm">Due Date</th>
                        <th className="text-right p-4 font-semibold text-sm">Total</th>
                        <th className="text-right p-4 font-semibold text-sm">Paid</th>
                        <th className="text-right p-4 font-semibold text-sm">Balance</th>
                        <th className="text-center p-4 font-semibold text-sm">Status</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t hover:bg-table-row-hover transition-colors">
                          <td className="p-4 font-medium">{invoice.invoice_number}</td>
                          <td className="p-4">{getCustomerName(invoice.customer_id)}</td>
                          <td className="p-4 text-sm">{invoice.invoice_date}</td>
                          <td className="p-4 text-sm">{invoice.due_date}</td>
                          <td className="p-4 text-right font-semibold">SAR {(invoice.total_amount || 0).toLocaleString()}</td>
                          <td className="p-4 text-right">SAR {(invoice.paid_amount || 0).toLocaleString()}</td>
                          <td className="p-4 text-right font-medium">SAR {((invoice.total_amount || 0) - (invoice.paid_amount || 0)).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-xs font-medium",
                              getStatusColor(invoice.payment_status || "pending")
                            )}>
                              {invoice.payment_status || "pending"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/sales/invoice/${invoice.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}