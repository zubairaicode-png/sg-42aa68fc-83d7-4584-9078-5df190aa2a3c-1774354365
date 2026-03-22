import { useState, useEffect } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { accountingService, type AccountWithBalance } from "@/services/accountingService";

export default function TrialBalanceReport() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getAccountsWithBalances();
      setAccounts(data.filter(a => (a.debit || 0) > 0 || (a.credit || 0) > 0 || Number(a.current_balance || 0) !== 0));
    } catch (error) {
      console.error("Error loading trial balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = accounts.reduce((sum, account) => sum + (account.debit || 0), 0);
  const totalCredit = accounts.reduce((sum, account) => sum + (account.credit || 0), 0);

  const formatCurrency = (amount: number | null | undefined) => {
    return (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <Head>
        <title>Trial Balance - Accounting</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
              <p className="text-muted-foreground">Verify total debits equal total credits</p>
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
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">ZATCA Accounting System</CardTitle>
              <div className="text-muted-foreground">Trial Balance</div>
              <div className="text-sm text-muted-foreground">As of {new Date().toLocaleDateString()}</div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">Loading data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Debit (SAR)</TableHead>
                      <TableHead className="text-right">Credit (SAR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right">
                          {(account.debit || 0) > 0 ? formatCurrency(account.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {(account.credit || 0) > 0 ? formatCurrency(account.credit) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(totalCredit)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}