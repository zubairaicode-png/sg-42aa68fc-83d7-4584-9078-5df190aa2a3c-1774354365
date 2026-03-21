import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";

interface ProfitLossData {
  revenue: {
    sales: number;
    returns: number;
    netRevenue: number;
  };
  cogs: {
    purchases: number;
    grossProfit: number;
  };
  expenses: {
    operating: number;
    other: number;
    totalExpenses: number;
  };
  netProfit: number;
  profitMargin: number;
}

export default function ProfitLossPage() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-21");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitLossData>({
    revenue: { sales: 0, returns: 0, netRevenue: 0 },
    cogs: { purchases: 0, grossProfit: 0 },
    expenses: { operating: 0, other: 0, totalExpenses: 0 },
    netProfit: 0,
    profitMargin: 0,
  });

  useEffect(() => {
    fetchProfitLossData();
  }, [dateFrom, dateTo]);

  const fetchProfitLossData = async () => {
    try {
      setLoading(true);

      // Fetch sales revenue
      const { data: salesData, error: salesError } = await (supabase as any)
        .from("sales_invoices")
        .select("total_amount")
        .gte("invoice_date", dateFrom)
        .lte("invoice_date", dateTo)
        .eq("status", "paid");

      if (salesError) throw salesError;

      // Fetch sales returns
      const { data: returnsData, error: returnsError } = await (supabase as any)
        .from("sales_returns")
        .select("total_amount")
        .gte("return_date", dateFrom)
        .lte("return_date", dateTo);

      if (returnsError) throw returnsError;

      // Fetch expenses (using as COGS and Operating Expenses)
      const { data: expensesData, error: expensesError } = await (supabase as any)
        .from("expenses")
        .select("amount, category")
        .gte("expense_date", dateFrom)
        .lte("expense_date", dateTo);

      if (expensesError) throw expensesError;

      // Calculate totals
      const totalSales = salesData?.reduce((sum: number, inv: any) => sum + inv.total_amount, 0) || 0;
      const totalReturns = returnsData?.reduce((sum: number, ret: any) => sum + ret.total_amount, 0) || 0;
      const netRevenue = totalSales - totalReturns;

      // Split expenses into COGS (Inventory/Purchases) and Operating Expenses
      const cogsExpenses = expensesData?.filter((e: any) => e.category?.toLowerCase().includes('inventory') || e.category?.toLowerCase().includes('purchase')) || [];
      const operatingExpenses = expensesData?.filter((e: any) => !e.category?.toLowerCase().includes('inventory') && !e.category?.toLowerCase().includes('purchase')) || [];

      let totalPurchases = 0;
      if (cogsExpenses) {
        for (const exp of cogsExpenses) {
          totalPurchases += Number(exp.amount || 0);
        }
      }

      const grossProfit = netRevenue - totalPurchases;

      let totalOperatingExpenses = 0;
      if (operatingExpenses) {
        for (const exp of operatingExpenses) {
          totalOperatingExpenses += Number(exp.amount || 0);
        }
      }

      const netProfit = grossProfit - totalOperatingExpenses;
      const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

      setData({
        revenue: {
          sales: totalSales,
          returns: totalReturns,
          netRevenue,
        },
        cogs: {
          purchases: totalPurchases,
          grossProfit,
        },
        expenses: {
          operating: totalOperatingExpenses,
          other: 0,
          totalExpenses: totalOperatingExpenses,
        },
        netProfit,
        profitMargin,
      });
    } catch (error) {
      console.error("Error fetching profit & loss data:", error);
      toast({
        title: "Error",
        description: "Failed to load profit & loss statement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Generating PDF report...",
    });
    // TODO: Implement PDF export
  };

  return (
    <>
      <SEO 
        title="Profit & Loss Statement - Saudi ERP System"
        description="View your profit and loss statement"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/reports">
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold font-heading">Profit & Loss Statement</h1>
                  <p className="text-muted-foreground mt-1">Income statement showing revenue, expenses, and net profit</p>
                </div>
              </div>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>

            {/* Date Range Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Report Period</CardTitle>
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
                    <Button onClick={fetchProfitLossData} className="w-full" disabled={loading}>
                      {loading ? "Loading..." : "Generate Report"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-primary">SAR {data.revenue.netRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-success">SAR {data.cogs.grossProfit.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-destructive">SAR {data.expenses.totalExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold font-heading flex items-center gap-2 ${data.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    {data.netProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    SAR {data.netProfit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profit & Loss Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Statement Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Revenue</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between">
                        <span>Sales</span>
                        <span className="font-medium">SAR {data.revenue.sales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span>Less: Sales Returns</span>
                        <span className="font-medium">SAR ({data.revenue.returns.toLocaleString()})</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Net Revenue</span>
                        <span>SAR {data.revenue.netRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost of Goods Sold */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Cost of Goods Sold (COGS)</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between">
                        <span>Purchases</span>
                        <span className="font-medium">SAR {data.cogs.purchases.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2 text-success">
                        <span>Gross Profit</span>
                        <span>SAR {data.cogs.grossProfit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Operating Expenses</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between">
                        <span>Operating Expenses</span>
                        <span className="font-medium">SAR {data.expenses.operating.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Expenses</span>
                        <span className="font-medium">SAR {data.expenses.other.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total Expenses</span>
                        <span>SAR {data.expenses.totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-xl">Net Profit / (Loss)</h3>
                        <p className="text-sm text-muted-foreground">
                          Profit Margin: {data.profitMargin.toFixed(2)}%
                        </p>
                      </div>
                      <div className={`text-3xl font-bold font-heading ${data.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                        SAR {data.netProfit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}