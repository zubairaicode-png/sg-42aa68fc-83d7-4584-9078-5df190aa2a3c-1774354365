import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Download, Printer, Calendar } from "lucide-react";

interface VATSummary {
  salesVAT: number;
  purchaseVAT: number;
  netVAT: number;
  totalSales: number;
  totalPurchases: number;
}

interface VATDetail {
  date: string;
  reference: string;
  party: string;
  taxableAmount: number;
  vatAmount: number;
}

export default function VATReport() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [summary, setSummary] = useState<VATSummary>({
    salesVAT: 0,
    purchaseVAT: 0,
    netVAT: 0,
    totalSales: 0,
    totalPurchases: 0
  });
  const [salesDetails, setSalesDetails] = useState<VATDetail[]>([]);
  const [purchaseDetails, setPurchaseDetails] = useState<VATDetail[]>([]);

  useEffect(() => {
    generateReport();
  }, [dateFrom, dateTo]);

  const generateReport = () => {
    // Sales VAT
    const salesData = localStorage.getItem("salesInvoices");
    const salesInvoices = salesData ? JSON.parse(salesData) : [];
    
    const filteredSales = salesInvoices.filter((inv: any) => {
      const invDate = new Date(inv.date);
      return invDate >= new Date(dateFrom) && invDate <= new Date(dateTo);
    });

    const salesVATDetails: VATDetail[] = filteredSales.map((inv: any) => ({
      date: inv.date,
      reference: inv.invoiceNumber,
      party: inv.customerName,
      taxableAmount: inv.subtotal || 0,
      vatAmount: inv.vat || 0
    }));

    // Purchase VAT
    const purchaseData = localStorage.getItem("purchaseInvoices");
    const purchaseInvoices = purchaseData ? JSON.parse(purchaseData) : [];

    const filteredPurchases = purchaseInvoices.filter((inv: any) => {
      const invDate = new Date(inv.date);
      return invDate >= new Date(dateFrom) && invDate <= new Date(dateTo);
    });

    const purchaseVATDetails: VATDetail[] = filteredPurchases.map((inv: any) => ({
      date: inv.date,
      reference: inv.invoiceNumber,
      party: inv.supplierName,
      taxableAmount: inv.subtotal || 0,
      vatAmount: inv.vat || 0
    }));

    setSalesDetails(salesVATDetails);
    setPurchaseDetails(purchaseVATDetails);

    const totalSalesVAT = salesVATDetails.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalPurchaseVAT = purchaseVATDetails.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalSalesAmount = salesVATDetails.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalPurchaseAmount = purchaseVATDetails.reduce((sum, item) => sum + item.taxableAmount, 0);

    setSummary({
      salesVAT: totalSalesVAT,
      purchaseVAT: totalPurchaseVAT,
      netVAT: totalSalesVAT - totalPurchaseVAT,
      totalSales: totalSalesAmount,
      totalPurchases: totalPurchaseAmount
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SEO 
        title="VAT Report - Reports"
        description="Saudi Arabia VAT return report"
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
                  <Button className="w-full" onClick={generateReport}>
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="print-full-width">
            <CardHeader className="print-header">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">VAT Return Report</h2>
                <h3 className="text-xl font-semibold text-muted-foreground">إقرار ضريبة القيمة المضافة</h3>
                <p className="text-sm text-muted-foreground">
                  Period: {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Section */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Output VAT (Sales)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-blue-600">
                        SAR {summary.salesVAT.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        On sales of SAR {summary.totalSales.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Input VAT (Purchases)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-purple-600">
                        SAR {summary.purchaseVAT.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        On purchases of SAR {summary.totalPurchases.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${summary.netVAT >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      {summary.netVAT >= 0 ? 'VAT Payable' : 'VAT Refundable'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className={`text-2xl font-bold ${summary.netVAT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        SAR {Math.abs(summary.netVAT).toFixed(2)}
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
                  <TabsTrigger value="sales">Sales VAT (Output)</TabsTrigger>
                  <TabsTrigger value="purchases">Purchase VAT (Input)</TabsTrigger>
                </TabsList>

                <TabsContent value="sales">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice No.</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Taxable Amount (SAR)</TableHead>
                          <TableHead className="text-right">VAT 15% (SAR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesDetails.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No sales invoices found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {salesDetails.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                <TableCell>{item.reference}</TableCell>
                                <TableCell>{item.party}</TableCell>
                                <TableCell className="text-right">{item.taxableAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">{item.vatAmount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-blue-50">
                              <TableCell colSpan={3}>Total</TableCell>
                              <TableCell className="text-right">{summary.totalSales.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{summary.salesVAT.toFixed(2)}</TableCell>
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
                          <TableHead className="text-right">Taxable Amount (SAR)</TableHead>
                          <TableHead className="text-right">VAT 15% (SAR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseDetails.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No purchase invoices found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {purchaseDetails.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                <TableCell>{item.reference}</TableCell>
                                <TableCell>{item.party}</TableCell>
                                <TableCell className="text-right">{item.taxableAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">{item.vatAmount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-purple-50">
                              <TableCell colSpan={3}>Total</TableCell>
                              <TableCell className="text-right">{summary.totalPurchases.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{summary.purchaseVAT.toFixed(2)}</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
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