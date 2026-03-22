import { useState, useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { accountingService, type AccountWithBalance } from "@/services/accountingService";

export default function ProfitLossReport() {
  const [revenueAccounts, setRevenueAccounts] = useState<AccountWithBalance[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const accounts = await accountingService.getAccountsWithBalances();
      
      setRevenueAccounts(accounts.filter(a => a.account_type === "revenue" && Number(a.current_balance || 0) !== 0));
      setExpenseAccounts(accounts.filter(a => a.account_type === "expense" && Number(a.current_balance || 0) !== 0));
    } catch (error) {
      console.error("Error loading P&L:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenueAccounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number | null | undefined) => {
    return (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <Head>
        <title>Profit & Loss - Accounting</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
              <p className="text-muted-foreground">Income statement summary</p>
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
              <div className="text-muted-foreground">Profit & Loss Statement</div>
              <div className="text-sm text-muted-foreground">For the period ending {new Date().toLocaleDateString()}</div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="py-8 text-center">Loading data...</div>
              ) : (
                <div className="space-y-8">
                  {/* Revenue Section */}
                  <div>
                    <h3 className="text-lg font-bold border-b pb-2 mb-4 text-green-700">Revenue</h3>
                    <div className="space-y-3">
                      {revenueAccounts.length > 0 ? revenueAccounts.map((account) => (
                        <div key={account.id} className="flex justify-between text-sm">
                          <span>{account.account_code} - {account.account_name}</span>
                          <span>{formatCurrency(account.current_balance)}</span>
                        </div>
                      )) : (
                        <div className="text-sm text-muted-foreground">No revenue recorded yet.</div>
                      )}
                      <div className="flex justify-between font-bold pt-3 border-t">
                        <span>Total Revenue</span>
                        <span>SAR {formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="text-lg font-bold border-b pb-2 mb-4 text-red-700">Expenses</h3>
                    <div className="space-y-3">
                      {expenseAccounts.length > 0 ? expenseAccounts.map((account) => (
                        <div key={account.id} className="flex justify-between text-sm">
                          <span>{account.account_code} - {account.account_name}</span>
                          <span>{formatCurrency(account.current_balance)}</span>
                        </div>
                      )) : (
                        <div className="text-sm text-muted-foreground">No expenses recorded yet.</div>
                      )}
                      <div className="flex justify-between font-bold pt-3 border-t">
                        <span>Total Expenses</span>
                        <span>SAR {formatCurrency(totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income Section */}
                  <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Net Income</span>
                      <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        SAR {formatCurrency(netIncome)}
                      </span>
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