import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Download, DollarSign } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  status: "draft" | "pending" | "approved" | "rejected" | "paid" | "unpaid";
  paid_amount?: number;
  receiptAttached: boolean;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export default function ExpenseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadExpense(id as string);
    }
  }, [id]);

  const loadExpense = (expenseId: string) => {
    try {
      setLoading(true);
      const expensesData = localStorage.getItem("expenses");
      if (expensesData) {
        const expenses = JSON.parse(expensesData);
        const foundExpense = expenses.find((exp: Expense) => exp.id === expenseId);
        if (foundExpense) {
          setExpense(foundExpense);
        } else {
          toast({
            title: "Error",
            description: "Expense not found",
            variant: "destructive",
          });
          router.push("/expenses");
        }
      }
    } catch (error) {
      console.error("Error loading expense:", error);
      toast({
        title: "Error",
        description: "Failed to load expense details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!expense) return;
    
    if (confirm(`Are you sure you want to delete expense ${expense.expenseNumber}?`)) {
      try {
        const expensesData = localStorage.getItem("expenses");
        if (expensesData) {
          const expenses = JSON.parse(expensesData);
          const updatedExpenses = expenses.filter((exp: Expense) => exp.id !== expense.id);
          localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
          
          toast({
            title: "Success",
            description: "Expense deleted successfully",
          });
          
          router.push("/expenses");
        }
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast({
          title: "Error",
          description: "Failed to delete expense",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-success bg-success/10";
      case "paid": return "text-primary bg-primary/10";
      case "pending": return "text-warning bg-warning/10";
      case "rejected": return "text-destructive bg-destructive/10";
      case "draft": return "text-muted-foreground bg-muted/50";
      case "unpaid": return "text-warning bg-warning/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading expense...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!expense) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Expense not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const paidAmount = expense.paid_amount || 0;
  const dueAmount = expense.totalAmount - paidAmount;

  return (
    <>
      <SEO 
        title={`Expense ${expense.expenseNumber} - Saudi ERP System`}
        description="View expense details"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/expenses">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">Expense Details</h1>
                <p className="text-muted-foreground mt-1">{expense.expenseNumber}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/expenses/edit/${expense.id}`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>

          {/* Expense Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expense Number:</span>
                  <span className="font-semibold">{expense.expenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-semibold">{expense.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold">{expense.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-semibold">{expense.description}</span>
                </div>
                {expense.vendor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor:</span>
                    <span className="font-semibold">{expense.vendor}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold capitalize">{expense.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-medium capitalize",
                    getStatusColor(expense.status)
                  )}>
                    {expense.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Amount Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Amount:</span>
                  <span className="font-semibold">SAR {expense.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (15%):</span>
                  <span className="font-semibold">SAR {expense.vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold text-lg">SAR {expense.totalAmount.toFixed(2)}</span>
                </div>
                
                {paidAmount > 0 && (
                  <>
                    <div className="flex justify-between pt-2 border-t text-success">
                      <span className="font-semibold">Paid Amount:</span>
                      <span className="font-semibold">SAR {paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Amount Due:</span>
                      <span className={`font-semibold ${dueAmount > 0 ? 'text-destructive' : 'text-success'}`}>
                        SAR {dueAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {expense.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{expense.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Approval Information */}
          {expense.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved By:</span>
                  <span className="font-semibold">{expense.approvedBy}</span>
                </div>
                {expense.approvedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved Date:</span>
                    <span className="font-semibold">{expense.approvedDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}