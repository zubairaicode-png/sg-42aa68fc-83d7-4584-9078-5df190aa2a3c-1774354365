import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Download, Printer, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VATTransaction {
  date: string;
  reference: string;
  party: string;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  type: "sales" | "purchase";
}

interface VATSummary {
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
  totalSales: number;
  totalPurchases: number;
  salesCount: number;
  purchasesCount: number;
}

export default function VATReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState<VATSummary>({
    outputVAT: 0,
    inputVAT: 0,
    netVAT: 0,
    totalSales: 0,
    totalPurchases: 0,
    salesCount: 0,
    purchasesCount: 0
  });
  const [salesTransactions, setSalesTransactions] = useState<VATTransaction[]>([]);
  const [purchaseTransactions, setPurchaseTransactions] = useState<VATTransaction[]>([]);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadVATData();
    }
  }, [dateFrom, dateTo]);

  const loadVATData = async () => {
    try {
      setLoading(true);

      console.log("Loading VAT data for period:", { dateFrom, dateTo });

      // Fetch sales invoices
      const { data: salesData, error: salesError } = await supabase
        .from("sales_invoices")
        .select("*")
        .gte("invoice_date", dateFrom)
        .lte("invoice_date", dateTo)
        .order("invoice_date", { ascending: true });

      if (salesError) {
        console.error("Sales error:", salesError);
        throw salesError;
      }

      console.log("Sales data fetched:", salesData?.length || 0, "invoices");

      // Fetch purchase invoices
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchase_invoices")
        .select("*")
        .gte("invoice_date", dateFrom)
        .lte("invoice_date", dateTo)
        .order("invoice_date", { ascending: true });

      if (purchaseError) {
        console.error("Purchase error:", purchaseError);
        throw purchaseError;
      }

      console.log("Purchase data fetched:", purchaseData?.length || 0, "invoices");

      // Process sales transactions
      const salesTxns: VATTransaction[] = (salesData || []).map((inv: any) => ({
        date: inv.invoice_date,
        reference: inv.invoice_number,
        party: inv.customer_name || "Unknown Customer",
        taxableAmount: Number(inv.subtotal) || 0,
        vatAmount: Number(inv.tax_amount) || 0,
        totalAmount: Number(inv.total_amount) || 0,
        type: "sales" as const
      }));

      // Process purchase transactions
      const purchaseTxns: VATTransaction[] = (purchaseData || []).map((inv: any) => ({
        date: inv.invoice_date,
        reference: inv.invoice_number,
        party: inv.supplier_name || "Unknown Supplier",
        taxableAmount: Number(inv.subtotal) || 0,
        vatAmount: Number(inv.tax_amount) || 0,
        totalAmount: Number(inv.total_amount) || 0,
        type: "purchase" as const
      }));

      setSalesTransactions(salesTxns);
      setPurchaseTransactions(purchaseTxns);

      // Calculate totals
      const totalOutputVAT = salesTxns.reduce((sum, txn) => sum + txn.vatAmount, 0);
      const totalInputVAT = purchaseTxns.reduce((sum, txn) => sum + txn.vatAmount, 0);
      const totalSalesAmount = salesTxns.reduce((sum, txn) => sum + txn.taxableAmount, 0);
      const totalPurchaseAmount = purchaseTxns.reduce((sum, txn) => sum + txn.taxableAmount, 0);

      console.log("VAT Summary:", {
        outputVAT: totalOutputVAT,
        inputVAT: totalInputVAT,
        netVAT: totalOutputVAT - totalInputVAT,
        salesCount: salesTxns.length,
        purchasesCount: purchaseTxns.length
      });

      setSummary({
        outputVAT: totalOutputVAT,
        inputVAT: totalInputVAT,
        netVAT: totalOutputVAT - totalInputVAT,
        totalSales: totalSalesAmount,
        totalPurchases: totalPurchaseAmount,
        salesCount: salesTxns.length,
        purchasesCount: purchaseTxns.length
      });

      toast({
        title: "Success",
        description: `VAT report loaded: ${salesTxns.length} sales, ${purchaseTxns.length} purchases`
      });
    } catch (error: any) {
      console.error("Error loading VAT data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load VAT report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SEO 
        title="VAT Report - Reports"
        description="Saudi Arabia VAT return report with sales and purchase tax details"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                <Receipt className="h-8 w-8" />
                VAT Report (Saudi Arabia)
              </h1>
              <p className="text-muted-foreground mt-1">تقرير ضريبة القيمة المضافة - 15% VAT Return</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card className="no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={loadVATData}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {summary.salesCount === 0 && summary.purchasesCount === 0 && !loading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No transactions found for the selected period. Try adjusting the date range.
              </AlertDescription>
            </Alert>
          )}

          <Card className="print-full-width">
            <CardHeader className="print-header">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">VAT Return Report</h2>
                <h3 className="text-xl font-semibold text-muted-foreground">إقرار ضريبة القيمة المضافة</h3>
                <p className="text-sm text-muted-foreground">
                  Period: {dateFrom ? formatDate(dateFrom) : ""} to {dateTo ? formatDate(dateTo) : ""}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Section */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Output VAT (Sales)</CardTitle>
                    <p className="text-xs text-muted-foreground">ضريبة المبيعات</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(summary.outputVAT)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {summary.salesCount} invoices, sales of {formatCurrency(summary.totalSales)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Input VAT (Purchases)</CardTitle>
                    <p className="text-xs text-muted-foreground">ضريبة المشتريات</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(summary.inputVAT)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {summary.purchasesCount} invoices, purchases of {formatCurrency(summary.totalPurchases)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${summary.netVAT >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      {summary.netVAT >= 0 ? 'VAT Payable' : 'VAT Refundable'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {summary.netVAT >= 0 ? 'المستحق للهيئة' : 'المستحق من الهيئة'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className={`text-2xl font-bold ${summary.netVAT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(summary.netVAT))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {summary.netVAT >= 0 ? 'To be paid to ZATCA' : 'To be claimed from ZATCA'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Tabs defaultValue="sales" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sales">
                    Sales VAT ({summary.salesCount})
                  </TabsTrigger>
                  <TabsTrigger value="purchases">
                    Purchase VAT ({summary.purchasesCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sales">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice No.</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Taxable Amount</TableHead>
                          <TableHead className="text-right">VAT 15%</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No sales invoices found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {salesTransactions.map((txn, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{formatDate(txn.date)}</TableCell>
                                <TableCell className="font-medium">{txn.reference}</TableCell>
                                <TableCell>{txn.party}</TableCell>
                                <TableCell className="text-right">{formatCurrency(txn.taxableAmount)}</TableCell>
                                <TableCell className="text-right font-medium text-blue-600">
                                  {formatCurrency(txn.vatAmount)}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(txn.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-blue-50">
                              <TableCell colSpan={3}>Total</TableCell>
                              <TableCell className="text-right">{formatCurrency(summary.totalSales)}</TableCell>
                              <TableCell className="text-right text-blue-600">
                                {formatCurrency(summary.outputVAT)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(summary.totalSales + summary.outputVAT)}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="purchases">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice No.</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Taxable Amount</TableHead>
                          <TableHead className="text-right">VAT 15%</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No purchase invoices found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {purchaseTransactions.map((txn, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{formatDate(txn.date)}</TableCell>
                                <TableCell className="font-medium">{txn.reference}</TableCell>
                                <TableCell>{txn.party}</TableCell>
                                <TableCell className="text-right">{formatCurrency(txn.taxableAmount)}</TableCell>
                                <TableCell className="text-right font-medium text-purple-600">
                                  {formatCurrency(txn.vatAmount)}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(txn.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-purple-50">
                              <TableCell colSpan={3}>Total</TableCell>
                              <TableCell className="text-right">{formatCurrency(summary.totalPurchases)}</TableCell>
                              <TableCell className="text-right text-purple-600">
                                {formatCurrency(summary.inputVAT)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(summary.totalPurchases + summary.inputVAT)}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              {/* VAT Calculation Breakdown */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle>VAT Return Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Output VAT (Sales Tax Collected):</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(summary.outputVAT)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Less: Input VAT (Purchase Tax Paid):</span>
                      <span className="font-semibold text-purple-600">({formatCurrency(summary.inputVAT)})</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Net VAT {summary.netVAT >= 0 ? 'Payable' : 'Refundable'}:</span>
                        <span className={`font-bold text-lg ${summary.netVAT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(summary.netVAT))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {summary.netVAT >= 0 
                          ? 'This amount should be paid to ZATCA (General Authority of Zakat and Tax)'
                          : 'This amount can be claimed as a refund from ZATCA'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100%;
            box-shadow: none;
            border: none;
          }
          .print-header {
            border-bottom: 2px solid #000;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
}