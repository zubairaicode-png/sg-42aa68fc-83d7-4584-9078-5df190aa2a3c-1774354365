import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown } from "lucide-react";
import { AccountType } from "@/types";
import Link from "next/link";

export default function AccountingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [journalEntries, setJournalEntries] = useState<any[]>([]);

  // Load journal entries from localStorage
  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
    setJournalEntries(storedEntries);
  }, []);

  const accounts = [
    { id: "1", code: "1100", name: "Cash", type: "asset" as AccountType, balance: 150000, debit: 150000, credit: 0 },
    { id: "2", code: "1200", name: "Accounts Receivable", type: "asset" as AccountType, balance: 45250, debit: 45250, credit: 0 },
    { id: "3", code: "1300", name: "Inventory", type: "asset" as AccountType, balance: 82000, debit: 82000, credit: 0 },
    { id: "4", code: "2100", name: "Accounts Payable", type: "liability" as AccountType, balance: 25500, debit: 0, credit: 25500 },
    { id: "5", code: "2200", name: "VAT Payable", type: "liability" as AccountType, balance: 8750, debit: 0, credit: 8750 },
    { id: "6", code: "3100", name: "Owner's Equity", type: "equity" as AccountType, balance: 200000, debit: 0, credit: 200000 },
    { id: "7", code: "4100", name: "Sales Revenue", type: "revenue" as AccountType, balance: 125000, debit: 0, credit: 125000 },
    { id: "8", code: "5100", name: "Cost of Goods Sold", type: "expense" as AccountType, balance: 65000, debit: 65000, credit: 0 },
    { id: "9", code: "5200", name: "Operating Expenses", type: "expense" as AccountType, balance: 18500, debit: 18500, credit: 0 },
  ];

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case "asset": return "text-blue-600 bg-blue-50";
      case "liability": return "text-red-600 bg-red-50";
      case "equity": return "text-purple-600 bg-purple-50";
      case "revenue": return "text-green-600 bg-green-50";
      case "expense": return "text-orange-600 bg-orange-50";
    }
  };

  const totalAssets = accounts.filter(a => a.type === "asset").reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === "liability").reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === "equity").reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === "revenue").reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === "expense").reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  // Safe number formatting helper
  const formatCurrency = (value: number | undefined | null): string => {
    return (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <SEO 
        title="Accounting - Saudi ERP System"
        description="Manage accounts, journal entries, and financial reports"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Accounting</h1>
              <p className="text-muted-foreground mt-1">Chart of accounts and financial management</p>
            </div>
            <Link href="/accounting/journal/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Journal Entry
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-blue-600">SAR {formatCurrency(totalAssets)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-red-600">SAR {formatCurrency(totalLiabilities)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-purple-600">SAR {formatCurrency(totalEquity)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold font-heading ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                    SAR {formatCurrency(netIncome)}
                  </div>
                  {netIncome >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="accounts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
              <TabsTrigger value="journal">Journal Entries</TabsTrigger>
              <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <CardTitle>Chart of Accounts</CardTitle>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search accounts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-table-header">
                          <tr>
                            <th className="text-left p-4 font-semibold text-sm">Account Code</th>
                            <th className="text-left p-4 font-semibold text-sm">Account Name</th>
                            <th className="text-center p-4 font-semibold text-sm">Type</th>
                            <th className="text-right p-4 font-semibold text-sm">Debit</th>
                            <th className="text-right p-4 font-semibold text-sm">Credit</th>
                            <th className="text-right p-4 font-semibold text-sm">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account) => (
                            <tr key={account.id} className="border-t hover:bg-table-row-hover transition-colors">
                              <td className="p-4 font-mono font-semibold">{account.code}</td>
                              <td className="p-4 font-medium">{account.name}</td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getAccountTypeColor(account.type)}`}>
                                  {account.type}
                                </span>
                              </td>
                              <td className="p-4 text-right">{account.debit > 0 ? `SAR ${formatCurrency(account.debit)}` : '-'}</td>
                              <td className="p-4 text-right">{account.credit > 0 ? `SAR ${formatCurrency(account.credit)}` : '-'}</td>
                              <td className="p-4 text-right font-semibold">SAR {formatCurrency(account.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Journal Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  {journalEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No journal entries yet</p>
                      <Link href="/accounting/journal/create">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Entry
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-table-header">
                            <tr>
                              <th className="text-left p-4 font-semibold text-sm">Entry #</th>
                              <th className="text-left p-4 font-semibold text-sm">Date</th>
                              <th className="text-left p-4 font-semibold text-sm">Description</th>
                              <th className="text-left p-4 font-semibold text-sm">Reference</th>
                              <th className="text-right p-4 font-semibold text-sm">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {journalEntries.map((entry) => (
                              <tr key={entry.id} className="border-t hover:bg-table-row-hover transition-colors">
                                <td className="p-4 font-medium">{entry.entryNumber}</td>
                                <td className="p-4 text-sm">{entry.date}</td>
                                <td className="p-4 text-sm">{entry.description}</td>
                                <td className="p-4 text-sm">{entry.reference || '-'}</td>
                                <td className="p-4 text-right font-semibold">SAR {formatCurrency(entry.totalDebit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trial-balance">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Trial Balance</CardTitle>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-table-header">
                          <tr>
                            <th className="text-left p-4 font-semibold text-sm">Account Code</th>
                            <th className="text-left p-4 font-semibold text-sm">Account Name</th>
                            <th className="text-right p-4 font-semibold text-sm">Debit</th>
                            <th className="text-right p-4 font-semibold text-sm">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account) => (
                            <tr key={account.id} className="border-t hover:bg-table-row-hover transition-colors">
                              <td className="p-4 font-mono font-semibold">{account.code}</td>
                              <td className="p-4 font-medium">{account.name}</td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getAccountTypeColor(account.type)}`}>
                                  {account.type}
                                </span>
                              </td>
                              <td className="p-4 text-right">{account.debit > 0 ? `SAR ${formatCurrency(account.debit)}` : '-'}</td>
                              <td className="p-4 text-right">{account.credit > 0 ? `SAR ${formatCurrency(account.credit)}` : '-'}</td>
                              <td className="p-4 text-right font-semibold">SAR {formatCurrency(account.balance)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-primary font-bold bg-table-header">
                            <td className="p-4" colSpan={2}>Total</td>
                            <td className="p-4 text-right">SAR {formatCurrency(accounts.reduce((sum, a) => sum + (a.debit || 0), 0))}</td>
                            <td className="p-4 text-right">SAR {formatCurrency(accounts.reduce((sum, a) => sum + (a.credit || 0), 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}