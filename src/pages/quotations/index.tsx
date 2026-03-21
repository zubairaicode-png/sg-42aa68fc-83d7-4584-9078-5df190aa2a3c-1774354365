import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { quotationService, type QuotationWithItems } from "@/services/quotationService";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AuthGuard } from "@/components/AuthGuard";

export default function QuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [quotations, setQuotations] = useState<QuotationWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationService.getAll();
      setQuotations(data);
    } catch (error) {
      console.error("Error loading quotations:", error);
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await quotationService.delete(deleteId);
      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      });
      loadQuotations();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete quotation",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleConvertToInvoice = async (quotationId: string) => {
    try {
      setConverting(quotationId);
      const invoiceId = await quotationService.convertToInvoice(quotationId);
      toast({
        title: "Success",
        description: "Quotation converted to invoice successfully",
      });
      loadQuotations();
      router.push(`/sales/invoice/${invoiceId}`);
    } catch (error: any) {
      console.error("Error converting quotation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation to invoice",
        variant: "destructive",
      });
    } finally {
      setConverting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "text-success bg-success/10";
      case "sent": return "text-warning bg-warning/10";
      case "rejected": return "text-destructive bg-destructive/10";
      case "draft": return "text-muted-foreground bg-muted";
      case "converted": return "text-primary bg-primary/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const stats = {
    totalQuotations: quotations.length,
    totalValue: quotations.reduce((sum, quot) => sum + quot.total_amount, 0),
    acceptedValue: quotations.filter(q => q.status === "accepted").reduce((sum, quot) => sum + quot.total_amount, 0),
    pendingValue: quotations.filter(q => q.status === "sent" || q.status === "draft").reduce((sum, quot) => sum + quot.total_amount, 0),
  };

  const filteredQuotations = quotations.filter(quotation => 
    quotation.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quotation.customers?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEO 
        title="Quotations - Saudi ERP System"
        description="Manage sales quotations and convert them to invoices"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold font-heading">Quotations Management</h1>
                <p className="text-muted-foreground mt-1">Create and manage sales quotations</p>
              </div>
              <Link href="/quotations/create">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  New Quotation
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading">{stats.totalQuotations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading">SAR {stats.totalValue.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-success">SAR {stats.acceptedValue.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-warning">SAR {stats.pendingValue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle>All Quotations</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search quotations..."
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading quotations...</div>
                  </div>
                ) : filteredQuotations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No quotations found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? "Try a different search term" : "Get started by creating your first quotation"}
                    </p>
                    <Link href="/quotations/create">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quotation
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-table-header">
                          <tr>
                            <th className="text-left p-4 font-semibold text-sm">Quotation #</th>
                            <th className="text-left p-4 font-semibold text-sm">Customer</th>
                            <th className="text-left p-4 font-semibold text-sm">Date</th>
                            <th className="text-left p-4 font-semibold text-sm">Valid Until</th>
                            <th className="text-right p-4 font-semibold text-sm">Total</th>
                            <th className="text-center p-4 font-semibold text-sm">Status</th>
                            <th className="text-center p-4 font-semibold text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuotations.map((quotation) => (
                            <tr key={quotation.id} className="border-t hover:bg-table-row-hover transition-colors">
                              <td className="p-4 font-medium">{quotation.quotation_number}</td>
                              <td className="p-4">{quotation.customers?.name || "N/A"}</td>
                              <td className="p-4 text-sm">{new Date(quotation.quotation_date).toLocaleDateString()}</td>
                              <td className="p-4 text-sm">{new Date(quotation.valid_until).toLocaleDateString()}</td>
                              <td className="p-4 text-right font-semibold">SAR {quotation.total_amount.toLocaleString()}</td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "inline-block px-3 py-1 rounded-full text-xs font-medium",
                                  getStatusColor(quotation.status)
                                )}>
                                  {quotation.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Link href={`/quotations/${quotation.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  {quotation.status !== "converted" && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => handleConvertToInvoice(quotation.id)}
                                      disabled={converting === quotation.id}
                                    >
                                      <FileCheck className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(quotation.id)}
                                  >
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
                )}
              </CardContent>
            </Card>
          </div>

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the quotation
                  and all associated items.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}