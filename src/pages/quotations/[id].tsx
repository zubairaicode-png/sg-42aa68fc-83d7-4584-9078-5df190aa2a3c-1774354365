import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileCheck, Printer, Mail, Download } from "lucide-react";
import { quotationService, type QuotationWithItems } from "@/services/quotationService";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";

export default function QuotationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<QuotationWithItems | null>(null);
  const [invoiceDesign, setInvoiceDesign] = useState<any>({ primary_color: "#2980B9", footer_text: "Thank you for your business!" });
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuotation();
    }

    // Load invoice design settings
    const savedInvoiceDesign = localStorage.getItem("invoiceDesign");
    if (savedInvoiceDesign) {
      setInvoiceDesign(JSON.parse(savedInvoiceDesign));
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
    <>
      <SEO 
        title={`Quotation ${quotation.quotation_number} - Saudi ERP System`}
        description="View quotation details"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/quotations")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold font-heading">Quotation Details</h1>
                  <p className="text-muted-foreground">{quotation.quotation_number}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                {quotation.status !== "converted" && (
                  <Button onClick={handleConvertToInvoice} disabled={converting}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    {converting ? "Converting..." : "Convert to Invoice"}
                  </Button>
                )}
              </div>
            </div>

            {/* Quotation Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-heading" style={{ color: invoiceDesign.primary_color || "#2980B9" }}>{quotation.quotation_number}</CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Date: {formatDate(quotation.quotation_date)}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Valid Until: {formatDate(quotation.valid_until)}</span>
                    </div>
                  </div>
                  <Badge className={cn("text-sm px-4 py-1", getStatusColor(quotation.status))}>
                    {quotation.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Customer Information */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Customer Information</h3>
                    <div className="space-y-2">
                      {(() => {
                        const customer = quotation.customers as any;
                        return (
                          <>
                            <div>
                              <p className="font-semibold text-lg">{customer?.name}</p>
                            </div>
                            {customer?.email && (
                              <div className="flex gap-2 text-sm">
                                <span className="text-muted-foreground">Email:</span>
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer?.phone && (
                              <div className="flex gap-2 text-sm">
                                <span className="text-muted-foreground">Phone:</span>
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer?.vat_number && (
                              <div className="flex gap-2 text-sm">
                                <span className="text-muted-foreground">VAT Number:</span>
                                <span className="font-mono">{customer.vat_number}</span>
                              </div>
                            )}
                            {customer?.cr_number && (
                              <div className="flex gap-2 text-sm">
                                <span className="text-muted-foreground">CR Number:</span>
                                <span className="font-mono">{customer.cr_number}</span>
                              </div>
                            )}
                            {(customer?.building_number || customer?.street_name) && (
                              <div className="flex gap-2 text-sm">
                                <span className="text-muted-foreground">National Address:</span>
                                <span>
                                  {customer.building_number && `Bldg ${customer.building_number}`}
                                  {customer.street_name && `, ${customer.street_name}`}
                                  {customer.additional_number && `, Add. ${customer.additional_number}`}
                                  {customer.district && `, ${customer.district}`}
                                  {customer.city && `, ${customer.city}`}
                                  {customer.postal_code && ` ${customer.postal_code}`}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Quotation Summary */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Quotation Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items:</span>
                        <span className="font-medium">{quotation.quotation_items.length} item(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">SAR {quotation.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium text-destructive">-SAR {quotation.discount_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT:</span>
                        <span className="font-medium">SAR {quotation.vat_amount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold pt-2">
                        <span>Total Amount:</span>
                        <span style={{ color: invoiceDesign.primary_color || "#2980B9" }}>SAR {quotation.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-table-header">
                        <tr>
                          <th className="text-left p-4 font-semibold text-sm">#</th>
                          <th className="text-left p-4 font-semibold text-sm">Item Code<br/><span className="text-xs font-normal">رمز الصنف</span></th>
                          <th className="text-left p-4 font-semibold text-sm">Product/Service<br/><span className="text-xs font-normal">الوصف</span></th>
                          <th className="text-center p-4 font-semibold text-sm">Qty<br/><span className="text-xs font-normal">الكمية</span></th>
                          <th className="text-right p-4 font-semibold text-sm">Unit Price<br/><span className="text-xs font-normal">سعر الوحدة</span></th>
                          <th className="text-right p-4 font-semibold text-sm">Discount<br/><span className="text-xs font-normal">الخصم</span></th>
                          <th className="text-right p-4 font-semibold text-sm">Subtotal<br/><span className="text-xs font-normal">المجموع الفرعي</span></th>
                          <th className="text-center p-4 font-semibold text-sm">VAT %<br/><span className="text-xs font-normal">ض.ق.م</span></th>
                          <th className="text-right p-4 font-semibold text-sm">Total Tax<br/><span className="text-xs font-normal">إجمالي الضريبة</span></th>
                          <th className="text-right p-4 font-semibold text-sm">Total<br/><span className="text-xs font-normal">المجموع</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotation.quotation_items.map((item, index) => {
                          const itemSubtotal = (item.quantity * item.unit_price) - item.discount_amount;
                          const taxAmount = itemSubtotal * (item.vat_rate / 100);
                          return (
                            <tr key={item.id} className={cn("border-t", index % 2 === 1 && "bg-table-row-hover")}>
                              <td className="p-4">{index + 1}</td>
                              <td className="p-4 font-mono text-sm">{(item.products as any)?.product_code || '-'}</td>
                              <td className="p-4 font-medium">{item.products?.name || item.description}</td>
                              <td className="p-4 text-center">{item.quantity}</td>
                              <td className="p-4 text-right">SAR {item.unit_price.toLocaleString()}</td>
                              <td className="p-4 text-right text-destructive">
                                {item.discount_amount > 0 ? `-SAR ${item.discount_amount.toLocaleString()}` : '-'}
                              </td>
                              <td className="p-4 text-right font-semibold">SAR {itemSubtotal.toFixed(2)}</td>
                              <td className="p-4 text-center">{item.vat_rate}%</td>
                              <td className="p-4 text-right font-semibold">SAR {taxAmount.toFixed(2)}</td>
                              <td className="p-4 text-right font-semibold">SAR {item.total_amount.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Footer */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">SAR {quotation.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium text-destructive">-SAR {quotation.discount_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT:</span>
                      <span className="font-medium">SAR {quotation.vat_amount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total Amount:</span>
                      <span style={{ color: invoiceDesign.primary_color || "#2980B9" }}>SAR {quotation.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {quotation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Custom Footer Text */}
            {invoiceDesign.footer_text && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-muted-foreground">{invoiceDesign.footer_text}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}