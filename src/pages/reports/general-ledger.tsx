import { useState, useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Download, Filter } from "lucide-react";
import { accountingService, type JournalEntryWithLines, type AccountWithBalance } from "@/services/accountingService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GeneralLedgerReport() {
  const [entries, setEntries] = useState<JournalEntryWithLines[]>([]);
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, entriesData] = await Promise.all([
        accountingService.getAccountsWithBalances(),
        accountingService.getAllJournalEntries()
      ]);
      setAccounts(accountsData);
      setEntries(entriesData);
    } catch (error) {
      console.error("Error loading general ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filter entries based on selected account
  const filteredEntries = selectedAccount === "all" 
    ? entries 
    : entries.filter(entry => entry.lines.some(line => line.account_id === selectedAccount));

  return (
    <>
      <Head>
        <title>General Ledger - Accounting</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
              <p className="text-muted-foreground">Detailed view of all account transactions</p>
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

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transaction History</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Filter by Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">Loading transactions...</div>
              ) : (
                <div className="space-y-8">
                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
                  ) : (
                    filteredEntries.map(entry => (
                      <div key={entry.id} className="border rounded-md overflow-hidden">
                        <div className="bg-muted/50 p-3 border-b flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{entry.entry_number}</span>
                            <span className="text-muted-foreground ml-4">{new Date(entry.entry_date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm font-medium">{entry.description}</div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Debit</TableHead>
                              <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.lines
                              .filter(line => selectedAccount === "all" || line.account_id === selectedAccount)
                              .map(line => {
                                const account = accounts.find(a => a.id === line.account_id);
                                return (
                                  <TableRow key={line.id}>
                                    <TableCell className="font-medium">
                                      {account ? `${account.account_code} - ${account.account_name}` : "Unknown Account"}
                                    </TableCell>
                                    <TableCell>{line.description || entry.description}</TableCell>
                                    <TableCell className="text-right">
                                      {(line.debit || 0) > 0 ? formatCurrency(line.debit) : ""}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(line.credit || 0) > 0 ? formatCurrency(line.credit) : ""}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}