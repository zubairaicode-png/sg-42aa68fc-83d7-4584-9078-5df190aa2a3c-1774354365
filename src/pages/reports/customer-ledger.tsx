import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Download, Printer, Calendar } from "lucide-react";
import type { Customer } from "@/types";

interface Transaction {
  date: string;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function CustomerLedgerReport() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      generateLedger();
    }
  }, [selectedCustomer, dateFrom, dateTo]);

  const loadCustomers = () => {
    const customersData = localStorage.getItem("customers");
    const customersList: Customer[] = customersData ? JSON.parse(customersData) : [];
    setCustomers(customersList);
    if (customersList.length > 0) {
      setSelectedCustomer(customersList[0].id);
    }
  };

  const generateLedger = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;

    setCustomerName(customer.name);
    setOpeningBalance(0);

    const invoicesData = localStorage.getItem("salesInvoices");
    const invoices = invoicesData ? JSON.parse(invoicesData) : [];

    const filteredInvoices = invoices.filter((inv: any) => {
      return inv.customerId === selectedCustomer &&
             new Date(inv.date) >= new Date(dateFrom) &&
             new Date(inv.date) <= new Date(dateTo);
    });

    const txns: Transaction[] = [];
    let balance = openingBalance;

    filteredInvoices.forEach((inv: any) => {
      const totalAmount = inv.total || 0;
      balance += totalAmount;

      txns.push({
        date: inv.date,
        type: "Sales Invoice",
        reference: inv.invoiceNumber,
        description: inv.notes || "Sales Invoice",
        debit: totalAmount,
        credit: 0,
        balance
      });

      if (inv.payments && inv.payments.length > 0) {
        inv.payments.forEach((payment: any) => {
          balance -= payment.amount;
          txns.push({
            date: payment.date,
            type: "Payment",
            reference: payment.reference || inv.invoiceNumber,
            description: `Payment - ${payment.method}`,
            debit: 0,
            credit: payment.amount,
            balance
          });
        });
      }
    });

    setTransactions(txns);
    setClosingBalance(balance);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDebits = transactions.reduce((sum, txn) => sum + txn.debit, 0);
  const totalCredits = transactions.reduce((sum, txn) => sum + txn.credit, 0);

  return (
    <>
      <SEO 
        title="Customer Ledger - Reports"
        description="View customer account statement"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                <Users className="h-8 w-8" />
                Customer Ledger
              </h1>
              <p className="text-muted-foreground mt-1">كشف حساب العميل - Customer account statement</p>
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
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
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
                <h2 className="text-2xl font-bold">Customer Account Statement</h2>
                <p className="text-lg font-semibold">{customerName}</p>
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
                      <TableHead>Type</TableHead>
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
                        <TableCell colSpan={4}>Opening Balance</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          {openingBalance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No transactions found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((txn, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              txn.type === 'Sales Invoice' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {txn.type}
                            </span>
                          </TableCell>
                          <TableCell>{txn.reference}</TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell className="text-right">
                            {txn.debit > 0 ? txn.debit.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {txn.credit > 0 ? txn.credit.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {txn.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {transactions.length > 0 && (
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={4}>Totals</TableCell>
                        <TableCell className="text-right">{totalDebits.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{totalCredits.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{closingBalance.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {closingBalance > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-semibold text-yellow-800">
                    Outstanding Balance: SAR {closingBalance.toFixed(2)}
                  </p>
                </div>
              )}
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