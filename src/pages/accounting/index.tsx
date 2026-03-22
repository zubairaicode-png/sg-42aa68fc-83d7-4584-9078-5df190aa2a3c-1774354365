import { useState, useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import Link from "next/link";
import { accountingService, type AccountWithBalance, type JournalEntryWithLines } from "@/services/accountingService";
import { useToast } from "@/hooks/use-toast";

export default function AccountingPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryWithLines[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load accounts with balances
      const accountsData = await accountingService.getAccountsWithBalances();
      setAccounts(accountsData);

      // Load journal entries
      const entriesData = await accountingService.getAllJournalEntries();
      setJournalEntries(entriesData);

      // Load financial summary
      const summaryData = await accountingService.getFinancialSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error("Error loading accounting data:", error);
      toast({
        title: "Error",
        description: "Failed to load accounting data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined | null): string => {
    return (value || 0).toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <>
      <Head>
        <title>Accounting - ZATCA Accounting System</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Accounting</h1>
              <p className="text-muted-foreground">Manage your chart of accounts and journal entries</p>
            </div>
            <Link href="/accounting/journal/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Journal Entry
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">SAR {formatCurrency(summary.totalAssets)}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">SAR {formatCurrency(summary.totalLiabilities)}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">SAR {formatCurrency(summary.totalEquity)}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <PieChart className="mr-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      SAR {formatCurrency(summary.netIncome)}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      {summary.netIncome >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="accounts" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
                  <TabsTrigger value="journal">Journal Entries</TabsTrigger>
                  <TabsTrigger value="trial">Trial Balance</TabsTrigger>
                </TabsList>

                <TabsContent value="accounts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Chart of Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {accounts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No accounts found. The chart of accounts will be automatically populated.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-table-header">
                                <th className="p-4 text-left font-semibold">Account Code</th>
                                <th className="p-4 text-left font-semibold">Account Name</th>
                                <th className="p-4 text-left font-semibold">Type</th>
                                <th className="p-4 text-right font-semibold">Debit</th>
                                <th className="p-4 text-right font-semibold">Credit</th>
                                <th className="p-4 text-right font-semibold">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {accounts.map((account) => (
                                <tr key={account.id} className="border-b hover:bg-muted/50">
                                  <td className="p-4 font-mono">{account.account_code}</td>
                                  <td className="p-4">{account.account_name}</td>
                                  <td className="p-4 capitalize">{account.account_type}</td>
                                  <td className="p-4 text-right">
                                    {(account.debit || 0) > 0 
                                      ? `SAR ${formatCurrency(account.debit)}` 
                                      : "-"
                                    }
                                  </td>
                                  <td className="p-4 text-right">
                                    {(account.credit || 0) > 0 
                                      ? `SAR ${formatCurrency(account.credit)}` 
                                      : "-"
                                    }
                                  </td>
                                  <td className="p-4 text-right font-semibold">
                                    SAR {formatCurrency(account.current_balance)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="journal" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Journal Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {journalEntries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No journal entries found. Create your first journal entry to get started.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-table-header">
                                <th className="p-4 text-left font-semibold">Entry Number</th>
                                <th className="p-4 text-left font-semibold">Date</th>
                                <th className="p-4 text-left font-semibold">Description</th>
                                <th className="p-4 text-right font-semibold">Amount</th>
                                <th className="p-4 text-left font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {journalEntries.map((entry) => (
                                <tr key={entry.id} className="border-b hover:bg-muted/50">
                                  <td className="p-4 font-mono">{entry.entry_number}</td>
                                  <td className="p-4">{new Date(entry.entry_date).toLocaleDateString()}</td>
                                  <td className="p-4">{entry.description}</td>
                                  <td className="p-4 text-right font-semibold">
                                    SAR {formatCurrency(entry.totalDebit)}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      entry.status === "posted" ? "bg-green-100 text-green-800" :
                                      entry.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                                      "bg-gray-100 text-gray-800"
                                    }`}>
                                      {entry.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trial" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trial Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {accounts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No accounts found. The trial balance will appear once you have accounts with transactions.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-table-header">
                                <th className="p-4 text-left font-semibold">Account Name</th>
                                <th className="p-4 text-right font-semibold">Debit</th>
                                <th className="p-4 text-right font-semibold">Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {accounts.map((account) => (
                                <tr key={account.id} className="border-b hover:bg-muted/50">
                                  <td className="p-4">{account.account_name}</td>
                                  <td className="p-4 text-right">
                                    {(account.debit || 0) > 0 
                                      ? `SAR ${formatCurrency(account.debit)}` 
                                      : "-"
                                    }
                                  </td>
                                  <td className="p-4 text-right">
                                    {(account.credit || 0) > 0 
                                      ? `SAR ${formatCurrency(account.credit)}` 
                                      : "-"
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-primary font-bold bg-table-header">
                                <td className="p-4">Total</td>
                                <td className="p-4 text-right">SAR {formatCurrency(accounts.reduce((sum, a) => sum + (a.debit || 0), 0))}</td>
                                <td className="p-4 text-right">SAR {formatCurrency(accounts.reduce((sum, a) => sum + (a.credit || 0), 0))}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}