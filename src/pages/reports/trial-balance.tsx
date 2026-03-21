import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, Download, Printer, Calendar } from "lucide-react";
import { ACCOUNTS } from "@/lib/constants";

interface AccountBalance {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export default function TrialBalanceReport() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [balances, setBalances] = useState<AccountBalance[]>([]);

  useEffect(() => {
    generateTrialBalance();
  }, [dateFrom, dateTo]);

  const generateTrialBalance = () => {
    const entriesData = localStorage.getItem("journalEntries");
    const entries = entriesData ? JSON.parse(entriesData) : [];

    // Filter by date range
    const filteredEntries = entries.filter((entry: any) => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(dateFrom) && entryDate <= new Date(dateTo);
    });

    // Calculate balances for each account
    const accountBalances: { [key: string]: { debit: number; credit: number } } = {};

    filteredEntries.forEach((entry: any) => {
      entry.lines.forEach((line: any) => {
        if (!accountBalances[line.account]) {
          accountBalances[line.account] = { debit: 0, credit: 0 };
        }
        accountBalances[line.account].debit += line.debit || 0;
        accountBalances[line.account].credit += line.credit || 0;
      });
    });

    // Create balance array with account details
    const balanceArray: AccountBalance[] = ACCOUNTS.map(account => {
      const balance = accountBalances[account.code] || { debit: 0, credit: 0 };
      const netDebit = balance.debit - balance.credit;
      const netCredit = balance.credit - balance.debit;

      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debit: netDebit > 0 ? netDebit : 0,
        credit: netCredit > 0 ? netCredit : 0,
      };
    }).filter(acc => acc.debit > 0 || acc.credit > 0);

    setBalances(balanceArray);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDebits = balances.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredits = balances.reduce((sum, acc) => sum + acc.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <>
      <SEO 
        title="Trial Balance - Reports"
        description="View trial balance report"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                <Scale className="h-8 w-8" />
                Trial Balance
              </h1>
              <p className="text-muted-foreground mt-1">ميزان المراجعة - Verify accounting accuracy</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card className="no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Period
              </CardTitle>
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
                  <Button className="w-full" onClick={generateTrialBalance}>
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="print-full-width">
            <CardHeader className="print-header">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Trial Balance Report</h2>
                <h3 className="text-xl font-semibold text-muted-foreground">ميزان المراجعة</h3>
                <p className="text-sm text-muted-foreground">
                  Period: {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}
                </p>
                {isBalanced ? (
                  <p className="text-green-600 font-semibold">✓ Books are balanced</p>
                ) : (
                  <p className="text-red-600 font-semibold">⚠ Books are out of balance by SAR {Math.abs(totalDebits - totalCredits).toFixed(2)}</p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit (SAR)</TableHead>
                      <TableHead className="text-right">Credit (SAR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No transactions found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {balances.map((account, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{account.code}</TableCell>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded text-xs bg-muted">
                                {account.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {account.debit > 0 ? account.debit.toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {account.credit > 0 ? account.credit.toFixed(2) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted text-lg">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">{totalDebits.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{totalCredits.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className={`font-bold ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                          <TableCell colSpan={3}>
                            {isBalanced ? "✓ Balanced" : "⚠ Difference"}
                          </TableCell>
                          <TableCell className="text-right" colSpan={2}>
                            {Math.abs(totalDebits - totalCredits).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100%;
            box-shadow: none;
            border: none;
          }
          .print-header {
            border-bottom: 2px solid #000;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
}