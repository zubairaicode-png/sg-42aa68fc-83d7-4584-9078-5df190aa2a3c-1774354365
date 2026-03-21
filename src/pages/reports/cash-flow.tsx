import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CashFlowData {
  operatingActivities: {
    netIncome: number;
    depreciation: number;
    accountsReceivable: number;
    inventory: number;
    accountsPayable: number;
    total: number;
  };
  investingActivities: {
    assetPurchases: number;
    assetSales: number;
    total: number;
  };
  financingActivities: {
    loans: number;
    loanRepayments: number;
    ownerDrawings: number;
    total: number;
  };
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

export default function CashFlowStatement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);

      // Get sales (cash inflows from operating activities)
      const { data: sales } = await ((supabase as any).from("sales_invoices"))
        .select("total_amount")
        .gte("invoice_date", startDate)
        .lte("invoice_date", endDate);

      // Get expenses (cash outflows from operating activities)
      const { data: expenses } = await ((supabase as any).from("expenses"))
        .select("amount")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);

      // Get purchases (inventory changes)
      const { data: purchases } = await ((supabase as any).from("purchases"))
        .select("total_amount")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);

      // Get depreciation
      const { data: depreciation } = await ((supabase as any).from("depreciation_schedule"))
        .select("depreciation_amount")
        .gte("period_date", startDate)
        .lte("period_date", endDate)
        .eq("is_posted", true);

      // Get fixed asset purchases
      const { data: assetPurchases } = await ((supabase as any).from("fixed_assets"))
        .select("purchase_cost")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);

      // Calculate totals
      const totalSales = sales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
      const totalPurchases = purchases?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;
      const totalDepreciation = depreciation?.reduce((sum: number, d: any) => sum + Number(d.depreciation_amount), 0) || 0;
      const totalAssetPurchases = assetPurchases?.reduce((sum: number, a: any) => sum + Number(a.purchase_cost), 0) || 0;

      const netIncome = totalSales - totalExpenses;
      const operatingTotal = netIncome + totalDepreciation - totalPurchases;
      const investingTotal = -totalAssetPurchases;
      const financingTotal = 0; // Would need loan data

      const netCashFlow = operatingTotal + investingTotal + financingTotal;

      setCashFlowData({
        operatingActivities: {
          netIncome,
          depreciation: totalDepreciation,
          accountsReceivable: 0,
          inventory: -totalPurchases,
          accountsPayable: 0,
          total: operatingTotal,
        },
        investingActivities: {
          assetPurchases: -totalAssetPurchases,
          assetSales: 0,
          total: investingTotal,
        },
        financingActivities: {
          loans: 0,
          loanRepayments: 0,
          ownerDrawings: 0,
          total: financingTotal,
        },
        netCashFlow,
        openingBalance: 0,
        closingBalance: netCashFlow,
      });

      toast({ title: "Success", description: "Cash flow statement generated successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    toast({ title: "Info", description: "PDF export coming soon" });
  };

  return (
    <>
      <SEO title="Cash Flow Statement" />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
                <p className="text-muted-foreground">Track cash inflows and outflows</p>
              </div>
              <Button onClick={downloadPDF} disabled={!cashFlowData}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Select Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generateReport} disabled={loading} className="w-full">
                      {loading ? "Generating..." : "Generate Report"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {cashFlowData && (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Operating Activities</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        SAR {cashFlowData.operatingActivities.total.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Investing Activities</CardTitle>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        SAR {cashFlowData.investingActivities.total.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${cashFlowData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        SAR {cashFlowData.netCashFlow.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Report */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Statement</CardTitle>
                    <CardDescription>
                      Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Operating Activities */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Operating Activities</h3>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Net Income</TableCell>
                              <TableCell className="text-right font-medium">
                                SAR {cashFlowData.operatingActivities.netIncome.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-8">Add: Depreciation</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.operatingActivities.depreciation.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-8">Changes in Inventory</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.operatingActivities.inventory.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-semibold">
                              <TableCell>Net Cash from Operating Activities</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.operatingActivities.total.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Investing Activities */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Investing Activities</h3>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Purchase of Fixed Assets</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.investingActivities.assetPurchases.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Sale of Fixed Assets</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.investingActivities.assetSales.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-semibold">
                              <TableCell>Net Cash from Investing Activities</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.investingActivities.total.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Financing Activities */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Financing Activities</h3>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Loans Received</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.financingActivities.loans.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Loan Repayments</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.financingActivities.loanRepayments.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-semibold">
                              <TableCell>Net Cash from Financing Activities</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.financingActivities.total.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Summary */}
                      <div className="border-t pt-4">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-semibold">Net Increase/Decrease in Cash</TableCell>
                              <TableCell className={`text-right font-semibold ${cashFlowData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                                SAR {cashFlowData.netCashFlow.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Cash at Beginning of Period</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.openingBalance.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-bold text-lg">
                              <TableCell>Cash at End of Period</TableCell>
                              <TableCell className="text-right">
                                SAR {cashFlowData.closingBalance.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}