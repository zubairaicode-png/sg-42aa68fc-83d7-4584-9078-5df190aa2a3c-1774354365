import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Invoice, InvoiceStatus } from "@/types";
import Link from "next/link";

export default function PurchasesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const purchaseInvoices: Invoice[] = [
    {
      id: "1",
      invoiceNumber: "PINV-2026-00045",
      type: "purchase",
      supplierId: "1",
      date: "2026-03-20",
      dueDate: "2026-04-20",
      items: [],
      subtotal: 25000,
      taxAmount: 3750,
      discountAmount: 0,
      total: 28750,
      paid: 28750,
      balance: 0,
      status: "paid",
      createdAt: "2026-03-20T09:00:00Z",
      updatedAt: "2026-03-20T09:00:00Z",
    },
    {
      id: "2",
      invoiceNumber: "PINV-2026-00044",
      type: "purchase",
      supplierId: "2",
      date: "2026-03-18",
      dueDate: "2026-04-18",
      items: [],
      subtotal: 15000,
      taxAmount: 2250,
      discountAmount: 500,
      total: 16750,
      paid: 0,
      balance: 16750,
      status: "pending",
      createdAt: "2026-03-18T11:30:00Z",
      updatedAt: "2026-03-18T11:30:00Z",
    },
  ];

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
    totalPurchases: purchaseInvoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: purchaseInvoices.reduce((sum, inv) => sum + inv.paid, 0),
    pendingAmount: purchaseInvoices.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.balance, 0),
    overdueAmount: purchaseInvoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + inv.balance, 0),
  };

  return (
    <>
      <SEO 
        title="Purchases - Saudi ERP System"
        description="Manage purchase orders and supplier invoices"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Purchase Management</h1>
              <p className="text-muted-foreground mt-1">Manage purchase orders and supplier invoices</p>
            </div>
            <Link href="/purchases/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Purchase Invoice
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">SAR {stats.totalPurchases.toLocaleString()}</div>
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

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Purchase Invoices</CardTitle>
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
                        <th className="text-left p-4 font-semibold text-sm">Supplier</th>
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
                      {purchaseInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t hover:bg-table-row-hover transition-colors">
                          <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                          <td className="p-4">Tech Supplies Co.</td>
                          <td className="p-4 text-sm">{invoice.date}</td>
                          <td className="p-4 text-sm">{invoice.dueDate}</td>
                          <td className="p-4 text-right font-semibold">SAR {invoice.total.toLocaleString()}</td>
                          <td className="p-4 text-right">SAR {invoice.paid.toLocaleString()}</td>
                          <td className="p-4 text-right font-medium">SAR {invoice.balance.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-xs font-medium",
                              getStatusColor(invoice.status)
                            )}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
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