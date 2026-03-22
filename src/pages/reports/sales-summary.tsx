import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Printer, TrendingUp, ShoppingCart, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { CurrencyDisplay } from "@/components/ui/currency-display";

interface SalesSummary {
  totalInvoices: number;
  totalRevenue: number;
  totalVAT: number;
  totalPaid: number;
  totalDue: number;
  averageInvoice: number;
}

interface DailySales {
  date: string;
  invoices: number;
  revenue: number;
  vat: number;
}

export default function SalesSummaryReport() {
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary>({
    totalInvoices: 0,
    totalRevenue: 0,
    totalVAT: 0,
    totalPaid: 0,
    totalDue: 0,
    averageInvoice: 0
  });
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: salesData, error } = await supabase
        .from("sales_invoices")
        .select("*, customers(name)")
        .gte("invoice_date", fromDate)
        .lte("invoice_date", toDate)
        .order("invoice_date", { ascending: false });

      if (error) throw error;

      const invoicesList = salesData || [];
      setInvoices(invoicesList);

      const totalRevenue = invoicesList.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);
      const totalVAT = invoicesList.reduce((sum, inv) => sum + Number(inv.vat_amount || 0), 0);
      const totalPaid = invoicesList.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
      const totalAmount = invoicesList.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
      const totalDue = totalAmount - totalPaid;

      setSummary({
        totalInvoices: invoicesList.length,
        totalRevenue,
        totalVAT,
        totalPaid,
        totalDue,
        averageInvoice: invoicesList.length > 0 ? totalAmount / invoicesList.length : 0
      });

      const dailyMap = new Map<string, DailySales>();
      invoicesList.forEach(inv => {
        const date = inv.invoice_date;
        const existing = dailyMap.get(date) || { date, invoices: 0, revenue: 0, vat: 0 };
        dailyMap.set(date, {
          date,
          invoices: existing.invoices + 1,
          revenue: existing.revenue + Number(inv.subtotal || 0),
          vat: existing.vat + Number(inv.vat_amount || 0)
        });
      });

      setDailySales(Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error: any) {
      console.error("Error loading sales summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <>
      <SEO 
        title="Sales Summary Report - Saudi ERP System"
        description="Comprehensive sales summary and analysis"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-4">
              <Link href="/reports">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">Sales Summary Report</h1>
                <p className="text-muted-foreground mt-1">تقرير ملخص المبيعات</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card className="no-print">
            <CardHeader>
              <CardTitle>Report Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadData} className="w-full">Apply Filter</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalInvoices}</div>
                <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={summary.totalRevenue} />
                </div>
                <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total VAT</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={summary.totalVAT} />
                </div>
                <p className="text-xs text-muted-foreground">إجمالي ضريبة القيمة المضافة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={summary.averageInvoice} />
                </div>
                <p className="text-xs text-muted-foreground">متوسط قيمة الفاتورة</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Daily Summary</TabsTrigger>
              <TabsTrigger value="invoices">Invoice List</TabsTrigger>
              <TabsTrigger value="payment">Payment Status</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoices</TableHead>
                        <TableHead className="text-right">Revenue (SAR)</TableHead>
                        <TableHead className="text-right">VAT (SAR)</TableHead>
                        <TableHead className="text-right">Total (SAR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailySales.map((day, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(day.date).toLocaleDateString("en-GB")}</TableCell>
                          <TableCell>{day.invoices}</TableCell>
                          <TableCell className="text-right">{formatCurrency(day.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(day.vat)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(day.revenue + day.vat)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell>TOTAL</TableCell>
                        <TableCell>{summary.totalInvoices}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalVAT)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalRevenue + summary.totalVAT)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">VAT</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("en-GB")}</TableCell>
                          <TableCell>{invoice.customers?.name || "-"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(invoice.subtotal))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(invoice.vat_amount))}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Amount</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          <CurrencyDisplay amount={summary.totalRevenue + summary.totalVAT} />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Paid</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          <CurrencyDisplay amount={summary.totalPaid} />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Balance Due</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          <CurrencyDisplay amount={summary.totalDue} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => {
                        const balance = Number(invoice.total_amount) - Number(invoice.amount_paid || 0);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.customers?.name || "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(invoice.amount_paid || 0))}</TableCell>
                            <TableCell className="text-right">{formatCurrency(balance)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                balance === 0 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                              }`}>
                                {balance === 0 ? "Paid" : "Pending"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          h1 {
            border-bottom: 2px solid #000;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
}