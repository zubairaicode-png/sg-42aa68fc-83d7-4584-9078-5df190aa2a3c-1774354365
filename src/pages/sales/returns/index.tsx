import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SalesReturn {
  id: string;
  returnNumber: string;
  originalInvoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  refundAmount: number;
  status: "pending" | "approved" | "refunded" | "cancelled";
  reason: string;
  createdAt: string;
}

export default function SalesReturnsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data - will be replaced with real data
  const salesReturns: SalesReturn[] = [
    {
      id: "1",
      returnNumber: "RET-2026-00001",
      originalInvoiceNumber: "INV-2026-00123",
      customerId: "1",
      customerName: "Al-Rajhi Trading Co.",
      date: "2026-03-21",
      items: [
        {
          productName: "HP LaserJet Printer",
          quantity: 1,
          unitPrice: 1500,
          total: 1725,
        },
      ],
      subtotal: 1500,
      taxAmount: 225,
      total: 1725,
      refundAmount: 1725,
      status: "approved",
      reason: "Defective product",
      createdAt: "2026-03-21T10:00:00Z",
    },
    {
      id: "2",
      returnNumber: "RET-2026-00002",
      originalInvoiceNumber: "INV-2026-00120",
      customerId: "2",
      customerName: "Najd Commercial Est.",
      date: "2026-03-20",
      items: [
        {
          productName: "Office Chair Executive",
          quantity: 2,
          unitPrice: 850,
          total: 1955,
        },
      ],
      subtotal: 1700,
      taxAmount: 255,
      total: 1955,
      refundAmount: 0,
      status: "pending",
      reason: "Wrong item delivered",
      createdAt: "2026-03-20T14:30:00Z",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "refunded": return "text-success bg-success/10";
      case "approved": return "text-primary bg-primary/10";
      case "pending": return "text-warning bg-warning/10";
      case "cancelled": return "text-muted-foreground bg-muted/50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const stats = {
    totalReturns: salesReturns.length,
    pendingReturns: salesReturns.filter(r => r.status === "pending").length,
    totalRefunded: salesReturns.filter(r => r.status === "refunded").reduce((sum, r) => sum + r.refundAmount, 0),
    totalPendingAmount: salesReturns.filter(r => r.status === "pending" || r.status === "approved").reduce((sum, r) => sum + r.total, 0),
  };

  return (
    <>
      <SEO 
        title="Sales Returns - Saudi ERP System"
        description="Manage sales returns and credit notes"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Sales Returns</h1>
              <p className="text-muted-foreground mt-1">Manage product returns and credit notes</p>
            </div>
            <Link href="/sales/returns/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Sales Return
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{stats.totalReturns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">{stats.pendingReturns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-success">SAR {stats.totalRefunded.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">SAR {stats.totalPendingAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Returns List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Sales Return History</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search returns..."
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
                        <th className="text-left p-4 font-semibold text-sm">Return #</th>
                        <th className="text-left p-4 font-semibold text-sm">Original Invoice</th>
                        <th className="text-left p-4 font-semibold text-sm">Customer</th>
                        <th className="text-left p-4 font-semibold text-sm">Date</th>
                        <th className="text-left p-4 font-semibold text-sm">Reason</th>
                        <th className="text-right p-4 font-semibold text-sm">Amount</th>
                        <th className="text-right p-4 font-semibold text-sm">Refunded</th>
                        <th className="text-center p-4 font-semibold text-sm">Status</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReturns.map((returnItem) => (
                        <tr key={returnItem.id} className="border-t hover:bg-table-row-hover transition-colors">
                          <td className="p-4 font-medium">{returnItem.returnNumber}</td>
                          <td className="p-4 text-primary">{returnItem.originalInvoiceNumber}</td>
                          <td className="p-4">{returnItem.customerName}</td>
                          <td className="p-4 text-sm">{returnItem.date}</td>
                          <td className="p-4 text-sm">{returnItem.reason}</td>
                          <td className="p-4 text-right font-semibold">SAR {returnItem.total.toLocaleString()}</td>
                          <td className="p-4 text-right">SAR {returnItem.refundAmount.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-xs font-medium capitalize",
                              getStatusColor(returnItem.status)
                            )}>
                              {returnItem.status}
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