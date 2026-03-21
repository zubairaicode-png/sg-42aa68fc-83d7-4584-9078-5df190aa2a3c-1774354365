import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Eye, FileCheck } from "lucide-react";
import { quotationService, type QuotationWithItems } from "@/services/quotationService";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AuthGuard from "@/components/AuthGuard";

export default function QuotationsPage() {
  const router = useRouter();
  const { toast } = useToast();
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      sent: { variant: "outline", label: "Sent" },
      accepted: { variant: "default", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
      converted: { variant: "default", label: "Converted" },
    };

    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
              <p className="text-muted-foreground">
                Manage your sales quotations and convert them to invoices
              </p>
            </div>
            <Button onClick={() => router.push("/quotations/create")}>
              <Plus className="mr-2 h-4 w-4" />
              New Quotation
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Quotations</CardTitle>
              <CardDescription>
                A list of all quotations including their status and details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading quotations...</div>
                </div>
              ) : quotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No quotations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first quotation
                  </p>
                  <Button onClick={() => router.push("/quotations/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quotation
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quotation #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell className="font-medium">
                            {quotation.quotation_number}
                          </TableCell>
                          <TableCell>
                            {quotation.customers?.name || "N/A"}
                          </TableCell>
                          <TableCell>{formatDate(quotation.quotation_date)}</TableCell>
                          <TableCell>{formatDate(quotation.valid_until)}</TableCell>
                          <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(quotation.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/quotations/${quotation.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {quotation.status !== "converted" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleConvertToInvoice(quotation.id)}
                                  disabled={converting === quotation.id}
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(quotation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
  );
}