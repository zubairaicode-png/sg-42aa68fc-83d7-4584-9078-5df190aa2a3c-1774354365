import { useState, useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { accountingService, type AccountWithBalance } from "@/services/accountingService";

export default function BalanceSheetReport() {
  const [assets, setAssets] = useState<AccountWithBalance[]>([]);
  const [liabilities, setLiabilities] = useState<AccountWithBalance[]>([]);
  const [equity, setEquity] = useState<AccountWithBalance[]>([]);
  const [netIncome, setNetIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const accounts = await accountingService.getAccountsWithBalances();
      
      setAssets(accounts.filter(a => a.account_type === "asset" && Number(a.current_balance || 0) !== 0));
      setLiabilities(accounts.filter(a => a.account_type === "liability" && Number(a.current_balance || 0) !== 0));
      setEquity(accounts.filter(a => a.account_type === "equity" && Number(a.current_balance || 0) !== 0));
      
      const summary = await accountingService.getFinancialSummary();
      setNetIncome(summary.netIncome);
      
    } catch (error) {
      console.error("Error loading balance sheet:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = assets.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const totalEquityBase = equity.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const totalEquity = totalEquityBase + netIncome; // Add current year earnings

  const formatCurrency = (amount: number | null | undefined) => {
    return (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <Head>
        <title>Balance Sheet - Accounting</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
              <p className="text-muted-foreground">Statement of financial position</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center pb-8 border-b">
              <CardTitle className="text-2xl">ZATCA Accounting System</CardTitle>
              <div className="text-muted-foreground">Balance Sheet</div>
              <div className="text-sm text-muted-foreground">As of {new Date().toLocaleDateString()}</div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="py-8 text-center">Loading data...</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-12">
                  {/* Left Column: Assets */}
                  <div>
                    <h3 className="text-xl font-bold border-b-2 border-primary pb-2 mb-4">Assets</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {assets.length > 0 ? assets.map((account) => (
                          <div key={account.id} className="flex justify-between text-sm">
                            <span>{account.account_name}</span>
                            <span>{formatCurrency(account.current_balance)}</span>
                          </div>
                        )) : (
                          <div className="text-sm text-muted-foreground">No assets recorded.</div>
                        )}
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t text-lg text-primary">
                        <span>Total Assets</span>
                        <span>SAR {formatCurrency(totalAssets)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Liabilities & Equity */}
                  <div className="space-y-8">
                    {/* Liabilities */}
                    <div>
                      <h3 className="text-xl font-bold border-b-2 border-destructive pb-2 mb-4">Liabilities</h3>
                      <div className="space-y-2">
                        {liabilities.length > 0 ? liabilities.map((account) => (
                          <div key={account.id} className="flex justify-between text-sm">
                            <span>{account.account_name}</span>
                            <span>{formatCurrency(account.current_balance)}</span>
                          </div>
                        )) : (
                          <div className="text-sm text-muted-foreground">No liabilities recorded.</div>
                        )}
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total Liabilities</span>
                          <span>{formatCurrency(totalLiabilities)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equity */}
                    <div>
                      <h3 className="text-xl font-bold border-b-2 border-green-600 pb-2 mb-4">Equity</h3>
                      <div className="space-y-2">
                        {equity.map((account) => (
                          <div key={account.id} className="flex justify-between text-sm">
                            <span>{account.account_name}</span>
                            <span>{formatCurrency(account.current_balance)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm">
                          <span>Current Year Earnings (Net Income)</span>
                          <span>{formatCurrency(netIncome)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total Equity</span>
                          <span>{formatCurrency(totalEquity)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Liabilities & Equity */}
                    <div className="flex justify-between font-bold pt-4 border-t-2 border-foreground text-lg">
                      <span>Total Liabilities & Equity</span>
                      <span>SAR {formatCurrency(totalLiabilities + totalEquity)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}