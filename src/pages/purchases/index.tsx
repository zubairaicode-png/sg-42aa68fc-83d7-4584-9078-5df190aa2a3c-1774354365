import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/types";
import { purchaseService } from "@/services/purchaseService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PaymentDialog } from "@/components/PaymentDialog";
import { generatePaymentReceipt, generateReceiptNumber } from "@/lib/paymentReceiptGenerator";
import { supabase } from "@/integrations/supabase/client";

export default function PurchasesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    loadPurchaseInvoices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInvoices(purchaseInvoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = purchaseInvoices.filter(
        (invoice) =>
          invoice.invoice_number?.toLowerCase().includes(query) ||
          invoice.supplier_name?.toLowerCase().includes(query) ||
          invoice.payment_status?.toLowerCase().includes(query)
      );
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, purchaseInvoices]);

  const loadPurchaseInvoices = async () => {
    try {
      setLoading(true);
      console.log("Loading purchase invoices...");
      const data = await purchaseService.getAll();
      console.log("Purchase invoices loaded:", data);
      setPurchaseInvoices(data);
      setFilteredInvoices(data);
    } catch (error: any) {
      console.error("Error loading purchase invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase invoice?")) {
      return;
    }

    try {
      await purchaseService.delete(id);
      toast({
        title: "Success",
        description: "Purchase invoice deleted successfully",
      });
      loadPurchaseInvoices();
    } catch (error: any) {
      console.error("Error deleting purchase invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete purchase invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-success bg-success/10";
      case "unpaid": 
      case "pending": return "text-warning bg-warning/10";
      case "overdue": return "text-destructive bg-destructive/10";
      case "partial": return "text-blue-500 bg-blue-500/10";
      case "draft": return "text-muted-foreground bg-muted";
      case "cancelled": return "text-muted-foreground bg-muted/50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleRecordPayment = async (invoice: any, paymentAmount: number, paymentMethod: string, notes: string) => {
    try {
      const newPaidAmount = parseFloat(invoice.paid_amount || 0) + paymentAmount;
      const totalAmount = parseFloat(invoice.total_amount || 0);
      const newBalance = totalAmount - newPaidAmount;

      // Determine new payment status
      let newStatus = "unpaid";
      if (newBalance <= 0) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "pending";
      }

      // Update invoice in database
      const { error } = await supabase
        .from("purchase_invoices")
        .update({
          paid_amount: newPaidAmount,
          payment_status: newStatus,
        })
        .eq("id", invoice.id);

      if (error) {
        console.error("Error updating invoice:", error);
        throw error;
      }

      // Generate payment receipt
      const receiptData = {
        receiptNumber: generateReceiptNumber(),
        paymentDate: new Date().toLocaleDateString(),
        invoiceNumber: invoice.invoice_number,
        supplierName: invoice.supplier_name,
        supplierVat: invoice.supplier_vat,
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
        previousBalance: totalAmount - parseFloat(invoice.paid_amount || 0),
        newBalance: newBalance,
        notes: notes,
        type: "purchase" as const,
      };

      generatePaymentReceipt(receiptData);

      toast({
        title: "Payment Recorded",
        description: `Payment of SAR ${paymentAmount.toFixed(2)} recorded successfully. Receipt downloaded.`,
      });

      // Reload invoices
      loadPurchaseInvoices();
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const openPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const stats = {
    totalPurchases: filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    paidAmount: filteredInvoices.filter(inv => inv.payment_status === "paid").reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    pendingAmount: filteredInvoices.filter(inv => inv.payment_status === "unpaid" || inv.payment_status === "pending").reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    overdueAmount: filteredInvoices.filter(inv => inv.payment_status === "overdue").reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
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
                        <th className="text-center p-4 font-semibold text-sm">Status</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span className="text-muted-foreground">Loading purchase invoices...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            {searchQuery ? "No purchase invoices found matching your search" : "No purchase invoices yet"}
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-t hover:bg-table-row-hover transition-colors">
                            <td className="p-4 font-medium">{invoice.invoice_number}</td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{invoice.supplier_name}</div>
                                {invoice.supplier_vat && (
                                  <div className="text-xs text-muted-foreground">VAT: {invoice.supplier_vat}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                            <td className="p-4 text-sm">{new Date(invoice.due_date).toLocaleDateString()}</td>
                            <td className="p-4 text-right font-semibold">SAR {invoice.total_amount?.toLocaleString() || "0"}</td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-block px-3 py-1 rounded-full text-xs font-medium",
                                getStatusColor(invoice.payment_status)
                              )}>
                                {formatStatus(invoice.payment_status)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link href={`/purchases/invoice/${invoice.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/purchases/edit/${invoice.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {invoice.payment_status !== "paid" && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-success hover:text-success"
                                    onClick={() => openPaymentDialog(invoice)}
                                    title="Record Payment"
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(invoice.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={selectedInvoice}
          type="purchase"
          onPaymentRecorded={() => {
            // Payment will be handled through the parent component
          }}
        />
      </DashboardLayout>
    </>
  );
}