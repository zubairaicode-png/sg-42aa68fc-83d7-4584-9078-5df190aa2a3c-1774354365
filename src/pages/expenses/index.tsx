import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
  status: "draft" | "pending" | "approved" | "rejected" | "paid";
  receiptAttached: boolean;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const expensesData = localStorage.getItem("expenses");
    if (expensesData) {
      setExpenses(JSON.parse(expensesData));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-success bg-success/10";
      case "paid": return "text-primary bg-primary/10";
      case "pending": return "text-warning bg-warning/10";
      case "rejected": return "text-destructive bg-destructive/10";
      case "draft": return "text-muted-foreground bg-muted/50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          expense.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && expense.status === "pending";
    if (activeTab === "approved") return matchesSearch && expense.status === "approved";
    if (activeTab === "paid") return matchesSearch && expense.status === "paid";
    return matchesSearch;
  });

  const stats = {
    totalExpenses: expenses.reduce((sum, e) => sum + e.totalAmount, 0),
    pendingApproval: expenses.filter(e => e.status === "pending").length,
    pendingAmount: expenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.totalAmount, 0),
    paidThisMonth: expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return e.status === "paid" && 
             expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.totalAmount, 0),
  };

  return (
    <>
      <SEO 
        title="Expenses - Saudi ERP System"
        description="Manage business expenses and reimbursements"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Expenses</h1>
              <p className="text-muted-foreground mt-1">Track and manage business expenses</p>
            </div>
            <Link href="/expenses/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Expense
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">SAR {stats.totalExpenses.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">{stats.pendingApproval}</div>
                <p className="text-xs text-muted-foreground mt-1">SAR {stats.pendingAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-primary">SAR {stats.paidThisMonth.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">
                  SAR {expenses.length > 0 ? (stats.totalExpenses / expenses.length).toFixed(0) : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="all">All Expenses</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="approved">Approved</TabsTrigger>
                      <TabsTrigger value="paid">Paid</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search expenses..."
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
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-table-header">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Expense #</th>
                        <th className="text-left p-4 font-semibold text-sm">Date</th>
                        <th className="text-left p-4 font-semibold text-sm">Category</th>
                        <th className="text-left p-4 font-semibold text-sm">Description</th>
                        <th className="text-left p-4 font-semibold text-sm">Vendor</th>
                        <th className="text-right p-4 font-semibold text-sm">Amount</th>
                        <th className="text-right p-4 font-semibold text-sm">VAT</th>
                        <th className="text-right p-4 font-semibold text-sm">Total</th>
                        <th className="text-center p-4 font-semibold text-sm">Status</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-8 text-muted-foreground">
                            {searchQuery ? "No expenses found matching your search" : "No expenses yet. Create your first expense to get started."}
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <tr key={expense.id} className="border-t hover:bg-table-row-hover transition-colors">
                            <td className="p-4 font-medium">{expense.expenseNumber}</td>
                            <td className="p-4 text-sm">{expense.date}</td>
                            <td className="p-4 text-sm">{expense.category}</td>
                            <td className="p-4">{expense.description}</td>
                            <td className="p-4 text-sm">{expense.vendor}</td>
                            <td className="p-4 text-right">SAR {expense.amount.toLocaleString()}</td>
                            <td className="p-4 text-right text-sm">SAR {expense.vatAmount.toFixed(2)}</td>
                            <td className="p-4 text-right font-semibold">SAR {expense.totalAmount.toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-block px-3 py-1 rounded-full text-xs font-medium capitalize",
                                getStatusColor(expense.status)
                              )}>
                                {expense.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link href={`/expenses/${expense.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/expenses/edit/${expense.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}