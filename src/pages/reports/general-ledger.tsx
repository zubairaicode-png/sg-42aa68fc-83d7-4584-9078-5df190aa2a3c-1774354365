import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Download, Printer, Calendar } from "lucide-react";
import { ACCOUNTS } from "@/lib/constants";

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  lines: Array<{
    account: string;
    description: string;
    debit: number;
    credit: number;
  }>;
}

interface LedgerLine {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function GeneralLedgerReport() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [selectedAccount, setSelectedAccount] = useState("1100");
  const [ledgerData, setLedgerData] = useState<LedgerLine[]>([]);
  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    generateLedger();
  }, [selectedAccount, dateFrom, dateTo]);

  const generateLedger = () => {
    // Get account name
    const account = ACCOUNTS.find(acc => acc.code === selectedAccount);
    setAccountName(account ? `${account.code} - ${account.name}` : "");

    // Get journal entries from localStorage
    const entriesData = localStorage.getItem("journalEntries");
    const entries: JournalEntry[] = entriesData ? JSON.parse(entriesData) : [];

    // Filter entries by date range
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(dateFrom) && entryDate <= new Date(dateTo);
    });

    // Extract lines for selected account
    const ledgerLines: LedgerLine[] = [];
    let runningBalance = openingBalance;

    filteredEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.account === selectedAccount) {
          const debit = line.debit || 0;
          const credit = line.credit || 0;
          
          // For assets and expenses, debits increase balance
          // For liabilities, equity, and revenue, credits increase balance
          const accountType = selectedAccount.charAt(0);
          if (accountType === '1' || accountType === '5') { // Assets or Expenses
            runningBalance = runningBalance + debit - credit;
          } else { // Liabilities, Equity, Revenue
            runningBalance = runningBalance + credit - debit;
          }

          ledgerLines.push({
            date: entry.date,
            reference: entry.entryNumber,
            description: line.description || entry.description,
            debit,
            credit,
            balance: runningBalance
          });
        }
      });
    });

    setLedgerData(ledgerLines);
    setClosingBalance(runningBalance);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDebits = ledgerData.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = ledgerData.reduce((sum, line) => sum + line.credit, 0);

  return (
    <>
      <SEO 
        title="General Ledger - Reports"
        description="View detailed general ledger for any account"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                General Ledger
              </h1>
              <p className="text-muted-foreground mt-1">دفتر الأستاذ العام - Account transaction history</p>
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
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNTS.map((account) => (
                        <SelectItem key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Button className="w-full" onClick={generateLedger}>
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="print-full-width">
            <CardHeader className="print-header">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">General Ledger Report</h2>
                <p className="text-lg font-semibold">{accountName}</p>
                <p className="text-sm text-muted-foreground">
                  Period: {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit (SAR)</TableHead>
                      <TableHead className="text-right">Credit (SAR)</TableHead>
                      <TableHead className="text-right">Balance (SAR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openingBalance !== 0 && (
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell colSpan={3}>Opening Balance</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          {openingBalance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    {ledgerData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No transactions found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerData.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(line.date).toLocaleDateString()}</TableCell>
                          <TableCell>{line.reference}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">
                            {line.debit > 0 ? line.debit.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.credit > 0 ? line.credit.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {line.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {ledgerData.length > 0 && (
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={3}>Totals</TableCell>
                        <TableCell className="text-right">{totalDebits.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{totalCredits.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{closingBalance.toFixed(2)}</TableCell>
                      </TableRow>
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