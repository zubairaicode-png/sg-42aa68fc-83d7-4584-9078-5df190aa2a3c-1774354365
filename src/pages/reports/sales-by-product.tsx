import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, Printer, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { CurrencyDisplay } from "@/components/ui/currency-display";

interface ProductSales {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity_sold: number;
  total_revenue: number;
  total_vat: number;
  total_amount: number;
  average_price: number;
  invoices_count: number;
}

export default function SalesByProductReport() {
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [totalSummary, setTotalSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    totalVAT: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: invoiceItems, error } = await supabase
        .from("sales_invoice_items")
        .select(`
          *,
          sales_invoices!inner(invoice_date),
          products(name, product_code, barcode)
        `)
        .gte("sales_invoices.invoice_date", fromDate)
        .lte("sales_invoices.invoice_date", toDate);

      if (error) throw error;

      const productMap = new Map<string, ProductSales>();

      (invoiceItems || []).forEach((item: any) => {
        const productId = item.product_id;
        const existing = productMap.get(productId);

        if (existing) {
          existing.quantity_sold += Number(item.quantity);
          existing.total_revenue += Number(item.amount);
          existing.total_vat += Number(item.vat_amount || 0);
          existing.total_amount += Number(item.total);
          existing.invoices_count += 1;
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: item.products?.name || "Unknown Product",
            product_code: item.products?.product_code || item.products?.barcode || "N/A",
            quantity_sold: Number(item.quantity),
            total_revenue: Number(item.amount),
            total_vat: Number(item.vat_amount || 0),
            total_amount: Number(item.total),
            average_price: Number(item.unit_price),
            invoices_count: 1
          });
        }
      });

      const salesList = Array.from(productMap.values())
        .sort((a, b) => b.total_amount - a.total_amount);

      salesList.forEach(product => {
        product.average_price = product.total_revenue / product.quantity_sold;
      });

      setProductSales(salesList);

      setTotalSummary({
        totalProducts: salesList.length,
        totalQuantity: salesList.reduce((sum, p) => sum + p.quantity_sold, 0),
        totalRevenue: salesList.reduce((sum, p) => sum + p.total_revenue, 0),
        totalVAT: salesList.reduce((sum, p) => sum + p.total_vat, 0),
        totalAmount: salesList.reduce((sum, p) => sum + p.total_amount, 0)
      });

    } catch (error: any) {
      console.error("Error loading product sales:", error);
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
        title="Sales by Product Report - Saudi ERP System"
        description="Product-wise sales analysis"
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
                <h1 className="text-3xl font-bold font-heading">Sales by Product Report</h1>
                <p className="text-muted-foreground mt-1">تقرير المبيعات حسب المنتج</p>
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
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSummary.totalProducts}</div>
                <p className="text-xs text-muted-foreground">عدد المنتجات المباعة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSummary.totalQuantity}</div>
                <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={totalSummary.totalRevenue} />
                </div>
                <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total VAT</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={totalSummary.totalVAT} />
                </div>
                <p className="text-xs text-muted-foreground">إجمالي الضريبة</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Sales Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSales.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_code}</TableCell>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell className="text-right">{product.quantity_sold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.average_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.total_revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.total_vat)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(product.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        {((product.total_amount / totalSummary.totalAmount) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">{totalSummary.totalQuantity}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSummary.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSummary.totalVAT)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSummary.totalAmount)}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
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
        }
      `}</style>
    </>
  );
}