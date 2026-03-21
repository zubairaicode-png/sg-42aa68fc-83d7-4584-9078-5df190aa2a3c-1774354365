import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Scale } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";

interface BalanceSheetData {
  assets: {
    currentAssets: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      total: number;
    };
    fixedAssets: {
      equipment: number;
      total: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      total: number;
    };
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
}

export default function BalanceSheetPage() {
  const { toast } = useToast();
  const [asOfDate, setAsOfDate] = useState("2026-03-21");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalanceSheetData>({
    assets: {
      currentAssets: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 },
      fixedAssets: { equipment: 0, total: 0 },
      totalAssets: 0,
    },
    liabilities: {
      currentLiabilities: { accountsPayable: 0, total: 0 },
      totalLiabilities: 0,
    },
    equity: {
      capital: 100000, // Initial capital
      retainedEarnings: 0,
      totalEquity: 0,
    },
  });

  useEffect(() => {
    fetchBalanceSheetData();
  }, [asOfDate]);

  const fetchBalanceSheetData = async () => {
    try {
      setLoading(true);

      // Fetch accounts receivable (unpaid invoices)
      const { data: unpaidInvoices, error: invoicesError } = await supabase
        .from("sales_invoices")
        .select("total_amount")
        .lte("invoice_date", asOfDate)
        .neq("status", "paid");

      if (invoicesError) throw invoicesError;

      // Fetch inventory value
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("products")
        .select("quantity, cost_price");

      if (inventoryError) throw inventoryError;

      // Fetch accounts payable (unpaid purchases)
      const { data: unpaidPurchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("total_amount")
        .lte("purchase_date", asOfDate)
        .neq("status", "paid");

      if (purchasesError) throw purchasesError;

      // Calculate totals
      const accountsReceivable = unpaidInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
      const inventoryValue = inventoryData?.reduce((sum, prod) => sum + (prod.quantity * prod.cost_price), 0) || 0;
      const accountsPayable = unpaidPurchases?.reduce((sum, pur) => sum + pur.total_amount, 0) || 0;

      // Simulate cash (would come from accounting system)
      const cash = 50000;

      // Calculate retained earnings (simplified - would come from profit/loss accumulated)
      const retainedEarnings = 25000;

      const currentAssetsTotal = cash + accountsReceivable + inventoryValue;
      const fixedAssetsTotal = 0; // Would include equipment, buildings, etc.
      const totalAssets = currentAssetsTotal + fixedAssetsTotal;

      const currentLiabilitiesTotal = accountsPayable;
      const totalLiabilities = currentLiabilitiesTotal;

      const capital = 100000; // Initial capital investment
      const totalEquity = capital + retainedEarnings;

      setData({
        assets: {
          currentAssets: {
            cash,
            accountsReceivable,
            inventory: inventoryValue,
            total: currentAssetsTotal,
          },
          fixedAssets: {
            equipment: 0,
            total: fixedAssetsTotal,
          },
          totalAssets,
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable,
            total: currentLiabilitiesTotal,
          },
          totalLiabilities,
        },
        equity: {
          capital,
          retainedEarnings,
          totalEquity,
        },
      });
    } catch (error) {
      console.error("Error fetching balance sheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load balance sheet",
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

  const isBalanced = Math.abs(data.assets.totalAssets - (data.liabilities.totalLiabilities + data.equity.totalEquity)) < 0.01;

  return (
    <>
      <SEO 
        title="Balance Sheet - Saudi ERP System"
        description="View your company's balance sheet"
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
                  <h1 className="text-3xl font-bold font-heading">Balance Sheet</h1>
                  <p className="text-muted-foreground mt-1">Statement of financial position showing assets, liabilities, and equity</p>
                </div>
              </div>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>

            {/* As Of Date */}
            <Card>
              <CardHeader>
                <CardTitle>Report Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="asOfDate">As of Date</Label>
                    <Input
                      id="asOfDate"
                      type="date"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchBalanceSheetData} className="w-full" disabled={loading}>
                      {loading ? "Loading..." : "Generate Report"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Check */}
            <Card className={isBalanced ? "border-success" : "border-destructive"}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className={`h-5 w-5 ${isBalanced ? "text-success" : "text-destructive"}`} />
                    <span className="font-semibold">
                      {isBalanced ? "✓ Balance Sheet is Balanced" : "⚠ Balance Sheet is Not Balanced"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Assets = Liabilities + Equity
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Balance Sheet Statement */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Assets Column */}
              <Card>
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Current Assets */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base border-b pb-2">Current Assets</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between">
                          <span>Cash & Bank</span>
                          <span className="font-medium">SAR {data.assets.currentAssets.cash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accounts Receivable</span>
                          <span className="font-medium">SAR {data.assets.currentAssets.accountsReceivable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inventory</span>
                          <span className="font-medium">SAR {data.assets.currentAssets.inventory.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total Current Assets</span>
                          <span>SAR {data.assets.currentAssets.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Assets */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base border-b pb-2">Fixed Assets</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between">
                          <span>Equipment & Machinery</span>
                          <span className="font-medium">SAR {data.assets.fixedAssets.equipment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total Fixed Assets</span>
                          <span>SAR {data.assets.fixedAssets.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Assets */}
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total Assets</span>
                        <span className="text-2xl font-bold font-heading text-primary">
                          SAR {data.assets.totalAssets.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities & Equity Column */}
              <Card>
                <CardHeader>
                  <CardTitle>Liabilities & Equity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Current Liabilities */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base border-b pb-2">Current Liabilities</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between">
                          <span>Accounts Payable</span>
                          <span className="font-medium">SAR {data.liabilities.currentLiabilities.accountsPayable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total Current Liabilities</span>
                          <span>SAR {data.liabilities.currentLiabilities.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Liabilities */}
                    <div className="space-y-3">
                      <div className="flex justify-between font-bold text-base bg-muted p-3 rounded">
                        <span>Total Liabilities</span>
                        <span>SAR {data.liabilities.totalLiabilities.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base border-b pb-2">Equity</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between">
                          <span>Capital</span>
                          <span className="font-medium">SAR {data.equity.capital.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retained Earnings</span>
                          <span className="font-medium">SAR {data.equity.retainedEarnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total Equity</span>
                          <span>SAR {data.equity.totalEquity.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Liabilities & Equity */}
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total Liabilities & Equity</span>
                        <span className="text-2xl font-bold font-heading text-primary">
                          SAR {(data.liabilities.totalLiabilities + data.equity.totalEquity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}