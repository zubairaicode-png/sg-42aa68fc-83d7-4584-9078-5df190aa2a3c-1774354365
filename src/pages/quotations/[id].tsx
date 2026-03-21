import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileCheck, Printer, Mail } from "lucide-react";
import { quotationService, type QuotationWithItems } from "@/services/quotationService";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { Separator } from "@/components/ui/separator";

export default function QuotationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<QuotationWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuotation();
    }
  }, [id]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      const data = await quotationService.getById(id as string);
      setQuotation(data);
    } catch (error) {
      console.error("Error loading quotation:", error);
      toast({
        title: "Error",
        description: "Failed to load quotation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quotation) return;

    try {
      setConverting(true);
      const invoiceId = await quotationService.convertToInvoice(quotation.id);
      toast({
        title: "Success",
        description: "Quotation converted to invoice successfully",
      });
      router.push(`/sales/invoice/${invoiceId}`);
    } catch (error: any) {
      console.error("Error converting quotation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation to invoice",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading quotation...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!quotation) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-2xl font-bold mb-2">Quotation not found</h2>
            <Button onClick={() => router.push("/quotations")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quotations
            </Button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/quotations")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Quotation Details</h1>
                <p className="text-muted-foreground">{quotation.quotation_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {quotation.status !== "converted" && (
                <Button onClick={handleConvertToInvoice} disabled={converting}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  {converting ? "Converting..." : "Convert to Invoice"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{quotation.quotation_number}</CardTitle>
                    <CardDescription>Quotation Date: {formatDate(quotation.quotation_date)}</CardDescription>
                  </div>
                  {getStatusBadge(quotation.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{quotation.customers?.name}</p>
                      {quotation.customers?.email && (
                        <p className="text-muted-foreground">{quotation.customers.email}</p>
                      )}
                      {quotation.customers?.phone && (
                        <p className="text-muted-foreground">{quotation.customers.phone}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Quotation Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid Until:</span>
                        <span className="font-medium">{formatDate(quotation.valid_until)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">{quotation.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Tax Rate</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotation.quotation_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.products?.name || item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">{item.vat_rate}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.discount_amount)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(quotation.discount_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium">{formatCurrency(quotation.vat_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(quotation.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {quotation.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}