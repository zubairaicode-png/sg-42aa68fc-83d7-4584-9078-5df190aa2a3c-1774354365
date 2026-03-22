import { useState, useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw } from "lucide-react";
import Link from "next/link";
import { accountingService, type AccountWithBalance, type JournalEntryWithLines } from "@/services/accountingService";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export default function AccountingPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryWithLines[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0
  });
  const { toast } = useToast();

  // Accounting Year State
  const [accountingYear, setAccountingYear] = useState({
    fiscalYearStart: "",
    fiscalYearEnd: "",
    lockPeriodUntil: "",
    closePreviousPeriods: false,
    allowPostingToPreviousYear: false,
  });

  // Balance Sheet State
  const [balanceSheetDate, setBalanceSheetDate] = useState(new Date().toISOString().split("T")[0]);
  const [balanceSheet, setBalanceSheet] = useState({
    assets: [] as AccountWithBalance[],
    liabilities: [] as AccountWithBalance[],
    equity: [] as AccountWithBalance[],
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0
  });
  const [loadingBalanceSheet, setLoadingBalanceSheet] = useState(false);

  // Profit & Loss state
  const [profitLossStartDate, setProfitLossStartDate] = useState("");
  const [profitLossEndDate, setProfitLossEndDate] = useState("");
  const [profitLoss, setProfitLoss] = useState({
    revenue: [] as (AccountWithBalance & { balance: number })[],
    expenses: [] as (AccountWithBalance & { balance: number })[],
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [loadingProfitLoss, setLoadingProfitLoss] = useState(false);

  // Accounting Year Report state
  const [yearReportYear, setYearReportYear] = useState(new Date().getFullYear().toString());
  const [yearReport, setYearReport] = useState({
    fiscalYearStart: "",
    fiscalYearEnd: "",
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    transactions: 0,
    journalEntries: 0
  });
  const [loadingYearReport, setLoadingYearReport] = useState(false);

  useEffect(() => {
    loadData();
    
    // Load accounting year settings from localStorage
    const savedAccountingYear = localStorage.getItem("accountingYear");
    if (savedAccountingYear) {
      const parsedYear = JSON.parse(savedAccountingYear);
      setAccountingYear(parsedYear);
      
      // Set default P&L dates from fiscal year
      if (parsedYear.fiscalYearStart && parsedYear.fiscalYearEnd) {
        setProfitLossStartDate(parsedYear.fiscalYearStart);
        setProfitLossEndDate(parsedYear.fiscalYearEnd);
      }
    }
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

  const syncTransactions = async () => {
    try {
      setSyncing(true);
      toast({
        title: "Syncing...",
        description: "Creating journal entries for existing transactions...",
      });

      const result = await accountingService.syncAllTransactions();

      toast({
        title: "Sync Complete!",
        description: `Synced: ${result.salesSynced} sales, ${result.purchasesSynced} purchases, ${result.salesReturnsSynced} sales returns, ${result.purchaseReturnsSynced} purchase returns${result.errors.length > 0 ? `. ${result.errors.length} errors occurred.` : ""}`,
      });

      // Reload data to show new entries
      await loadData();
    } catch (error) {
      console.error("Error syncing transactions:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const saveAccountingYear = () => {
    try {
      // Validation
      if (!accountingYear.fiscalYearStart || !accountingYear.fiscalYearEnd) {
        toast({
          title: "Validation Error",
          description: "Please select both fiscal year start and end dates",
          variant: "destructive",
        });
        return;
      }

      const startDate = new Date(accountingYear.fiscalYearStart);
      const endDate = new Date(accountingYear.fiscalYearEnd);

      if (endDate <= startDate) {
        toast({
          title: "Validation Error",
          description: "Fiscal year end date must be after start date",
          variant: "destructive",
        });
        return;
      }

      // Save to localStorage
      localStorage.setItem("accountingYear", JSON.stringify(accountingYear));

      toast({
        title: "Success",
        description: "Accounting year settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving accounting year:", error);
      toast({
        title: "Error",
        description: "Failed to save accounting year settings",
        variant: "destructive",
      });
    }
  };

  const loadBalanceSheet = async () => {
    try {
      setLoadingBalanceSheet(true);

      // Get accounts with balances up to the selected date
      const accountsData = await accountingService.getAccountsWithBalances();

      // Separate by account type
      const assets = accountsData.filter(a => a.account_type === 'asset');
      const liabilities = accountsData.filter(a => a.account_type === 'liability');
      const equity = accountsData.filter(a => a.account_type === 'equity');

      const totalAssets = assets.reduce((sum, a) => sum + (a.current_balance || 0), 0);
      const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.current_balance || 0), 0);
      const totalEquity = equity.reduce((sum, a) => sum + (a.current_balance || 0), 0);

      setBalanceSheet({
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity
      });
    } catch (error) {
      console.error("Error loading balance sheet:", error);
      toast({
        title: "Error",
        description: "Failed to load balance sheet",
        variant: "destructive"
      });
    } finally {
      setLoadingBalanceSheet(false);
    }
  };

  useEffect(() => {
    if (balanceSheetDate) {
      loadBalanceSheet();
    }
  }, [balanceSheetDate]);

  const loadProfitLoss = async () => {
    if (!profitLossStartDate || !profitLossEndDate) {
      toast({
        title: "Validation Error",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingProfitLoss(true);

      // Load revenue accounts (type = 'revenue')
      const { data: revenueAccounts, error: revenueError } = await supabase
        .from("accounting_accounts")
        .select("*")
        .eq("account_type", "revenue")
        .order("account_code");

      if (revenueError) throw revenueError;

      // Load expense accounts (type = 'expense')
      const { data: expenseAccounts, error: expenseError } = await supabase
        .from("accounting_accounts")
        .select("*")
        .eq("account_type", "expense")
        .order("account_code");

      if (expenseError) throw expenseError;

      // Calculate balances for each revenue account
      const revenueWithBalances = await Promise.all(
        (revenueAccounts || []).map(async (account) => {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .gte("entry_date", profitLossStartDate)
            .lte("entry_date", profitLossEndDate);

          const balance = (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.credit_amount || "0") - parseFloat(line.debit_amount || "0"));
          }, 0);

          return { ...account, balance };
        })
      );

      // Calculate balances for each expense account
      const expenseWithBalances = await Promise.all(
        (expenseAccounts || []).map(async (account) => {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .gte("entry_date", profitLossStartDate)
            .lte("entry_date", profitLossEndDate);

          const balance = (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.debit_amount || "0") - parseFloat(line.credit_amount || "0"));
          }, 0);

          return { ...account, balance };
        })
      );

      const totalRevenue = revenueWithBalances.reduce((sum, acc) => sum + acc.balance, 0);
      const totalExpenses = expenseWithBalances.reduce((sum, acc) => sum + acc.balance, 0);
      const netProfit = totalRevenue - totalExpenses;

      setProfitLoss({
        revenue: revenueWithBalances,
        expenses: expenseWithBalances,
        totalRevenue,
        totalExpenses,
        netProfit
      });

    } catch (error: any) {
      console.error("Error loading profit & loss:", error);
      toast({
        title: "Error",
        description: "Failed to load profit & loss statement",
        variant: "destructive",
      });
    } finally {
      setLoadingProfitLoss(false);
    }
  };

  const loadYearReport = async () => {
    if (!accountingYear.fiscalYearStart || !accountingYear.fiscalYearEnd) {
      toast({
        title: "Configuration Required",
        description: "Please configure fiscal year in Accounting Year tab first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingYearReport(true);

      // Get revenue total
      const { data: revenueAccounts } = await supabase
        .from("accounting_accounts")
        .select("id")
        .eq("account_type", "revenue");

      let totalRevenue = 0;
      if (revenueAccounts) {
        for (const account of revenueAccounts) {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .gte("entry_date", accountingYear.fiscalYearStart)
            .lte("entry_date", accountingYear.fiscalYearEnd);

          totalRevenue += (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.credit_amount || "0") - parseFloat(line.debit_amount || "0"));
          }, 0);
        }
      }

      // Get expense total
      const { data: expenseAccounts } = await supabase
        .from("accounting_accounts")
        .select("id")
        .eq("account_type", "expense");

      let totalExpenses = 0;
      if (expenseAccounts) {
        for (const account of expenseAccounts) {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .gte("entry_date", accountingYear.fiscalYearStart)
            .lte("entry_date", accountingYear.fiscalYearEnd);

          totalExpenses += (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.debit_amount || "0") - parseFloat(line.credit_amount || "0"));
          }, 0);
        }
      }

      // Get asset total
      const { data: assetAccounts } = await supabase
        .from("accounting_accounts")
        .select("id")
        .eq("account_type", "asset");

      let totalAssets = 0;
      if (assetAccounts) {
        for (const account of assetAccounts) {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .lte("entry_date", accountingYear.fiscalYearEnd);

          totalAssets += (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.debit_amount || "0") - parseFloat(line.credit_amount || "0"));
          }, 0);
        }
      }

      // Get liability total
      const { data: liabilityAccounts } = await supabase
        .from("accounting_accounts")
        .select("id")
        .eq("account_type", "liability");

      let totalLiabilities = 0;
      if (liabilityAccounts) {
        for (const account of liabilityAccounts) {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .lte("entry_date", accountingYear.fiscalYearEnd);

          totalLiabilities += (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.credit_amount || "0") - parseFloat(line.debit_amount || "0"));
          }, 0);
        }
      }

      // Get equity total
      const { data: equityAccounts } = await supabase
        .from("accounting_accounts")
        .select("id")
        .eq("account_type", "equity");

      let totalEquity = 0;
      if (equityAccounts) {
        for (const account of equityAccounts) {
          const { data: lines } = await supabase
            .from("accounting_journal_lines")
            .select("debit_amount, credit_amount")
            .eq("account_id", account.id)
            .lte("entry_date", accountingYear.fiscalYearEnd);

          totalEquity += (lines || []).reduce((sum, line) => {
            return sum + (parseFloat(line.credit_amount || "0") - parseFloat(line.debit_amount || "0"));
          }, 0);
        }
      }

      // Get transaction counts
      const { count: transactionCount } = await supabase
        .from("accounting_journal_lines")
        .select("*", { count: "exact", head: true })
        .gte("entry_date", accountingYear.fiscalYearStart)
        .lte("entry_date", accountingYear.fiscalYearEnd);

      const { count: journalCount } = await supabase
        .from("accounting_journal_entries")
        .select("*", { count: "exact", head: true })
        .gte("entry_date", accountingYear.fiscalYearStart)
        .lte("entry_date", accountingYear.fiscalYearEnd);

      setYearReport({
        fiscalYearStart: accountingYear.fiscalYearStart,
        fiscalYearEnd: accountingYear.fiscalYearEnd,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalAssets,
        totalLiabilities,
        totalEquity,
        transactions: transactionCount || 0,
        journalEntries: journalCount || 0
      });

    } catch (error: any) {
      console.error("Error loading year report:", error);
      toast({
        title: "Error",
        description: "Failed to load accounting year report",
        variant: "destructive",
      });
    } finally {
      setLoadingYearReport(false);
    }
  };

  useEffect(() => {
    if (accountingYear.fiscalYearStart && accountingYear.fiscalYearEnd) {
      loadYearReport();
    }
  }, [accountingYear.fiscalYearStart, accountingYear.fiscalYearEnd]);

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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={syncTransactions}
                disabled={syncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Transactions"}
              </Button>
              <Link href="/accounting/journal/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Journal Entry
                </Button>
              </Link>
            </div>
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
                  <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                  <TabsTrigger value="accounting-year">Accounting Year</TabsTrigger>
                  <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
                  <TabsTrigger value="year-report">Accounting Year Report</TabsTrigger>
                  <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
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

                <TabsContent value="trial-balance" className="space-y-4">
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

                <TabsContent value="accounting-year" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Accounting Year Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Fiscal Year Start Date *</label>
                          <input
                            type="date"
                            value={accountingYear.fiscalYearStart}
                            onChange={(e) => setAccountingYear({ ...accountingYear, fiscalYearStart: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Fiscal Year End Date *</label>
                          <input
                            type="date"
                            value={accountingYear.fiscalYearEnd}
                            onChange={(e) => setAccountingYear({ ...accountingYear, fiscalYearEnd: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold">Posting Restrictions</h3>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="closePrevious"
                            checked={accountingYear.closePreviousPeriods}
                            onChange={(e) => setAccountingYear({ ...accountingYear, closePreviousPeriods: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor="closePrevious" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Close previous periods
                          </label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          Prevent posting transactions dated before the fiscal year start date
                        </p>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowPrevious"
                            checked={accountingYear.allowPostingToPreviousYear}
                            onChange={(e) => setAccountingYear({ ...accountingYear, allowPostingToPreviousYear: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor="allowPrevious" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Allow posting to previous year
                          </label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          Allow corrections and adjustments to the previous fiscal year
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lock Period Until</label>
                        <input
                          type="date"
                          value={accountingYear.lockPeriodUntil}
                          onChange={(e) => setAccountingYear({ ...accountingYear, lockPeriodUntil: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <p className="text-sm text-muted-foreground">
                          Block all postings dated before this date
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={saveAccountingYear}>
                          Save Accounting Year Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Profit & Loss */}
                <TabsContent value="profit-loss" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profit & Loss Statement</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        View revenue and expenses for a specific period
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Date Range Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            type="date"
                            value={profitLossStartDate}
                            onChange={(e) => setProfitLossStartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            type="date"
                            value={profitLossEndDate}
                            onChange={(e) => setProfitLossEndDate(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={loadProfitLoss} disabled={loadingProfitLoss}>
                            {loadingProfitLoss ? "Loading..." : "Generate Report"}
                          </Button>
                        </div>
                      </div>

                      {/* P&L Statement */}
                      {profitLoss.revenue.length > 0 || profitLoss.expenses.length > 0 ? (
                        <div className="space-y-6">
                          {/* Revenue Section */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Revenue</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Account Code</TableHead>
                                  <TableHead>Account Name</TableHead>
                                  <TableHead className="text-right">Amount (SAR)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {profitLoss.revenue.map((account) => (
                                  <TableRow key={account.id}>
                                    <TableCell>{account.account_code}</TableCell>
                                    <TableCell>{account.account_name}</TableCell>
                                    <TableCell className="text-right">
                                      <CurrencyDisplay amount={account.balance} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="font-semibold bg-muted">
                                  <TableCell colSpan={2}>Total Revenue</TableCell>
                                  <TableCell className="text-right">
                                    <CurrencyDisplay amount={profitLoss.totalRevenue} />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>

                          {/* Expenses Section */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Account Code</TableHead>
                                  <TableHead>Account Name</TableHead>
                                  <TableHead className="text-right">Amount (SAR)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {profitLoss.expenses.map((account) => (
                                  <TableRow key={account.id}>
                                    <TableCell>{account.account_code}</TableCell>
                                    <TableCell>{account.account_name}</TableCell>
                                    <TableCell className="text-right">
                                      <CurrencyDisplay amount={account.balance} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="font-semibold bg-muted">
                                  <TableCell colSpan={2}>Total Expenses</TableCell>
                                  <TableCell className="text-right">
                                    <CurrencyDisplay amount={profitLoss.totalExpenses} />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>

                          {/* Net Profit/Loss */}
                          <div className="pt-4 border-t">
                            <div className="flex justify-between items-center text-xl font-bold">
                              <span>Net {profitLoss.netProfit >= 0 ? "Profit" : "Loss"}</span>
                              <span className={profitLoss.netProfit >= 0 ? "text-success" : "text-destructive"}>
                                <CurrencyDisplay amount={Math.abs(profitLoss.netProfit)} />
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Select dates and click "Generate Report" to view Profit & Loss statement
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Accounting Year Report */}
                <TabsContent value="year-report" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Accounting Year Report</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive financial summary for the fiscal year
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {accountingYear.fiscalYearStart && accountingYear.fiscalYearEnd ? (
                        <>
                          {/* Fiscal Year Info */}
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Fiscal Year Period</p>
                                <p className="font-semibold">
                                  {new Date(accountingYear.fiscalYearStart).toLocaleDateString()} - {new Date(accountingYear.fiscalYearEnd).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-end justify-end">
                                <Button onClick={loadYearReport} disabled={loadingYearReport}>
                                  {loadingYearReport ? "Loading..." : "Generate Year Report"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Year Report Summary */}
                          {yearReport.transactions > 0 || loadingYearReport ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Income Statement Summary */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Income Statement</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                                    <span className="font-semibold text-success">
                                      <CurrencyDisplay amount={yearReport.totalRevenue} />
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Expenses</span>
                                    <span className="font-semibold text-destructive">
                                      <CurrencyDisplay amount={yearReport.totalExpenses} />
                                    </span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between">
                                    <span className="font-semibold">Net Profit/Loss</span>
                                    <span className={cn("font-bold", yearReport.netProfit >= 0 ? "text-success" : "text-destructive")}>
                                      <CurrencyDisplay amount={Math.abs(yearReport.netProfit)} />
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Balance Sheet Summary */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Balance Sheet</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Assets</span>
                                    <span className="font-semibold">
                                      <CurrencyDisplay amount={yearReport.totalAssets} />
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Liabilities</span>
                                    <span className="font-semibold">
                                      <CurrencyDisplay amount={yearReport.totalLiabilities} />
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Equity</span>
                                    <span className="font-semibold">
                                      <CurrencyDisplay amount={yearReport.totalEquity} />
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Activity Summary */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Activity Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Journal Entries</span>
                                    <span className="font-semibold">{yearReport.journalEntries}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Transactions</span>
                                    <span className="font-semibold">{yearReport.transactions}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Avg. per Entry</span>
                                    <span className="font-semibold">
                                      {yearReport.journalEntries > 0 ? Math.round(yearReport.transactions / yearReport.journalEntries) : 0}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              Click "Generate Year Report" to view comprehensive fiscal year summary
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Please configure your fiscal year first
                          </p>
                          <Button onClick={() => {
                            const tabs = document.querySelector('[value="accounting-year"]') as HTMLElement;
                            tabs?.click();
                          }}>
                            Go to Accounting Year Settings
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Balance Sheet */}
                <TabsContent value="balance-sheet" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Balance Sheet</CardTitle>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">As of:</label>
                          <input
                            type="date"
                            value={balanceSheetDate}
                            onChange={(e) => setBalanceSheetDate(e.target.value)}
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingBalanceSheet ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading balance sheet...
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Assets */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3">ASSETS</h3>
                            {balanceSheet.assets.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No asset accounts found</p>
                            ) : (
                              <div className="space-y-2">
                                {balanceSheet.assets.map((account) => (
                                  <div key={account.id} className="flex justify-between items-center py-2 border-b">
                                    <div>
                                      <div className="font-medium">{account.account_name}</div>
                                      <div className="text-sm text-muted-foreground">{account.account_code}</div>
                                    </div>
                                    <div className="font-semibold">
                                      SAR {formatCurrency(account.current_balance)}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center py-2 font-bold text-lg border-t-2">
                                  <div>Total Assets</div>
                                  <div>SAR {formatCurrency(balanceSheet.totalAssets)}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Liabilities */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3">LIABILITIES</h3>
                            {balanceSheet.liabilities.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No liability accounts found</p>
                            ) : (
                              <div className="space-y-2">
                                {balanceSheet.liabilities.map((account) => (
                                  <div key={account.id} className="flex justify-between items-center py-2 border-b">
                                    <div>
                                      <div className="font-medium">{account.account_name}</div>
                                      <div className="text-sm text-muted-foreground">{account.account_code}</div>
                                    </div>
                                    <div className="font-semibold">
                                      SAR {formatCurrency(account.current_balance)}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center py-2 font-bold text-lg border-t-2">
                                  <div>Total Liabilities</div>
                                  <div>SAR {formatCurrency(balanceSheet.totalLiabilities)}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Equity */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3">EQUITY</h3>
                            {balanceSheet.equity.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No equity accounts found</p>
                            ) : (
                              <div className="space-y-2">
                                {balanceSheet.equity.map((account) => (
                                  <div key={account.id} className="flex justify-between items-center py-2 border-b">
                                    <div>
                                      <div className="font-medium">{account.account_name}</div>
                                      <div className="text-sm text-muted-foreground">{account.account_code}</div>
                                    </div>
                                    <div className="font-semibold">
                                      SAR {formatCurrency(account.current_balance)}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center py-2 font-bold text-lg border-t-2">
                                  <div>Total Equity</div>
                                  <div>SAR {formatCurrency(balanceSheet.totalEquity)}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Total Liabilities + Equity */}
                          <div className="border-t-4 border-primary pt-4">
                            <div className="flex justify-between items-center py-2 font-bold text-xl">
                              <div>Total Liabilities & Equity</div>
                              <div>SAR {formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</div>
                            </div>
                          </div>

                          {/* Balance Check */}
                          <div className={`p-4 rounded-lg ${
                            Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}>
                            <div className="font-semibold mb-1">
                              {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                                ? "✓ Balance Sheet is Balanced"
                                : "⚠ Balance Sheet is Out of Balance"
                              }
                            </div>
                            <div className="text-sm">
                              Difference: SAR {formatCurrency(Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)))}
                            </div>
                          </div>
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