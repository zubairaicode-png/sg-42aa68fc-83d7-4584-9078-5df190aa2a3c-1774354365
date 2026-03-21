import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Printer, Calendar, TrendingUp, PieChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  vendor: string;
  status: string;
}

interface CategorySummary {
  category: string;
  count: number;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  percentage: number;
}

export default function ExpenseReportPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(firstDay.toISOString().split("T")[0]);
    setToDate(now.toISOString().split("T")[0]);
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const expensesData = localStorage.getItem("expenses");
    if (expensesData) {
      setExpenses(JSON.parse(expensesData));
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const from = fromDate ? new Date(fromDate) : new Date(0);
    const to = toDate ? new Date(toDate) : new Date();

    const dateMatch = expenseDate >= from && expenseDate <= to;
    const categoryMatch = selectedCategory === "all" || expense.category === selectedCategory;
    const statusMatch = selectedStatus === "all" || expense.status === selectedStatus;

    return dateMatch && categoryMatch && statusMatch;
  });

  const calculateCategorySummary = (): CategorySummary[] => {
    const categoryMap = new Map<string, { count: number; amount: number; vatAmount: number; totalAmount: number }>();

    filteredExpenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { count: 0, amount: 0, vatAmount: 0, totalAmount: 0 };
      categoryMap.set(expense.category, {
        count: existing.count + 1,
        amount: existing.amount + expense.amount,
        vatAmount: existing.vatAmount + expense.vatAmount,
        totalAmount: existing.totalAmount + expense.totalAmount,
      });
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalAmount, 0);

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const categorySummary = calculateCategorySummary();

  const totals = {
    count: filteredExpenses.length,
    amount: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    vatAmount: filteredExpenses.reduce((sum, e) => sum + e.vatAmount, 0),
    totalAmount: filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0),
  };

  const categories = Array.from(new Set(expenses.map(e => e.category)));

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <>
      <SEO 
        title="Expense Report - Saudi ERP System"
        description="Comprehensive expense analysis and reporting"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h1 className="text-3xl font-bold font-heading">Expense Report</h1>
              <p className="text-muted-foreground mt-1">تقرير المصروفات</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print Header */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-2xl font-bold">Expense Report</h1>
            <p className="text-lg">تقرير المصروفات</p>
            <p className="text-sm text-muted-foreground mt-2">
              Period: {fromDate} to {toDate}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{totals.count}</div>
                <p className="text-xs text-muted-foreground mt-1">transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Base Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">SAR {totals.amount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">excluding VAT</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">VAT Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">SAR {totals.vatAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">input VAT</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-primary">SAR {totals.totalAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">including VAT</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Report */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="print:hidden">
              <TabsTrigger value="summary">Summary by Category</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Expense Summary by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-table-header">
                        <tr>
                          <th className="text-left p-4 font-semibold">Category</th>
                          <th className="text-center p-4 font-semibold">Count</th>
                          <th className="text-right p-4 font-semibold">Base Amount</th>
                          <th className="text-right p-4 font-semibold">VAT</th>
                          <th className="text-right p-4 font-semibold">Total</th>
                          <th className="text-right p-4 font-semibold">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorySummary.map((cat) => (
                          <tr key={cat.category} className="border-t hover:bg-table-row-hover">
                            <td className="p-4 font-medium">{cat.category}</td>
                            <td className="p-4 text-center">{cat.count}</td>
                            <td className="p-4 text-right">SAR {cat.amount.toLocaleString()}</td>
                            <td className="p-4 text-right">SAR {cat.vatAmount.toFixed(2)}</td>
                            <td className="p-4 text-right font-semibold">SAR {cat.totalAmount.toLocaleString()}</td>
                            <td className="p-4 text-right">{cat.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 bg-muted font-bold">
                          <td className="p-4">Total</td>
                          <td className="p-4 text-center">{totals.count}</td>
                          <td className="p-4 text-right">SAR {totals.amount.toLocaleString()}</td>
                          <td className="p-4 text-right">SAR {totals.vatAmount.toFixed(2)}</td>
                          <td className="p-4 text-right">SAR {totals.totalAmount.toLocaleString()}</td>
                          <td className="p-4 text-right">100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Expense Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-table-header">
                        <tr>
                          <th className="text-left p-4 font-semibold">Expense #</th>
                          <th className="text-left p-4 font-semibold">Date</th>
                          <th className="text-left p-4 font-semibold">Category</th>
                          <th className="text-left p-4 font-semibold">Description</th>
                          <th className="text-left p-4 font-semibold">Vendor</th>
                          <th className="text-right p-4 font-semibold">Amount</th>
                          <th className="text-right p-4 font-semibold">VAT</th>
                          <th className="text-right p-4 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-muted-foreground">
                              No expenses found for selected period
                            </td>
                          </tr>
                        ) : (
                          filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="border-t hover:bg-table-row-hover">
                              <td className="p-4 font-medium">{expense.expenseNumber}</td>
                              <td className="p-4">{expense.date}</td>
                              <td className="p-4">{expense.category}</td>
                              <td className="p-4">{expense.description}</td>
                              <td className="p-4">{expense.vendor || "-"}</td>
                              <td className="p-4 text-right">SAR {expense.amount.toLocaleString()}</td>
                              <td className="p-4 text-right">SAR {expense.vatAmount.toFixed(2)}</td>
                              <td className="p-4 text-right font-semibold">SAR {expense.totalAmount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                        {filteredExpenses.length > 0 && (
                          <tr className="border-t-2 bg-muted font-bold">
                            <td colSpan={5} className="p-4">Total</td>
                            <td className="p-4 text-right">SAR {totals.amount.toLocaleString()}</td>
                            <td className="p-4 text-right">SAR {totals.vatAmount.toFixed(2)}</td>
                            <td className="p-4 text-right">SAR {totals.totalAmount.toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 2cm;
          }
          h1 {
            page-break-after: avoid;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </>
  );
}