import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { SAUDI_VAT_RATE } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: number;
  vatIncluded: boolean;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  vendor: string;
  receiptAttached: boolean;
  notes: string;
  paid_amount: number;
  payment_status: "paid" | "unpaid" | "pending";
}

const EXPENSE_CATEGORIES = [
  "Office Rent",
  "Utilities",
  "Salaries & Wages",
  "Marketing & Advertising",
  "Office Supplies",
  "Travel & Transportation",
  "Meals & Entertainment",
  "Professional Fees",
  "Insurance",
  "Software & Subscriptions",
  "Maintenance & Repairs",
  "Telecommunications",
  "Banking Fees",
  "Taxes & Licenses",
  "Other",
];

export default function EditExpensePage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    amount: 0,
    vatIncluded: true,
    vatAmount: 0,
    totalAmount: 0,
    paymentMethod: "cash",
    vendor: "",
    receiptAttached: false,
    notes: "",
    paid_amount: 0,
    payment_status: "unpaid",
  });

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
        const expense = expenses.find((exp: any) => exp.id === expenseId);
        
        if (expense) {
          setFormData({
            date: expense.date || new Date().toISOString().split("T")[0],
            category: expense.category || "",
            description: expense.description || "",
            amount: parseFloat(expense.amount) || 0,
            vatIncluded: true,
            vatAmount: parseFloat(expense.vatAmount) || 0,
            totalAmount: parseFloat(expense.totalAmount) || 0,
            paymentMethod: expense.paymentMethod || "cash",
            vendor: expense.vendor || "",
            receiptAttached: expense.receiptAttached || false,
            notes: expense.notes || "",
            paid_amount: parseFloat(expense.paid_amount) || 0,
            payment_status: expense.status || "unpaid",
          });
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
        description: "Failed to load expense",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateVAT = (amount: number, vatIncluded: boolean) => {
    if (vatIncluded) {
      const vatAmount = (amount * SAUDI_VAT_RATE) / (100 + SAUDI_VAT_RATE);
      const baseAmount = amount - vatAmount;
      return { baseAmount, vatAmount, totalAmount: amount };
    } else {
      const vatAmount = (amount * SAUDI_VAT_RATE) / 100;
      const totalAmount = amount + vatAmount;
      return { baseAmount: amount, vatAmount, totalAmount };
    }
  };

  const handleAmountChange = (value: number) => {
    const { baseAmount, vatAmount, totalAmount } = calculateVAT(value, formData.vatIncluded);
    setFormData({
      ...formData,
      amount: baseAmount,
      vatAmount,
      totalAmount,
    });
  };

  const handleVATToggle = (vatIncluded: boolean) => {
    const { baseAmount, vatAmount, totalAmount } = calculateVAT(
      vatIncluded ? formData.totalAmount : formData.amount,
      vatIncluded
    );
    setFormData({
      ...formData,
      vatIncluded,
      amount: baseAmount,
      vatAmount,
      totalAmount,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select an expense category",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description) {
      toast({
        title: "Validation Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (formData.paid_amount > formData.totalAmount) {
      toast({
        title: "Validation Error",
        description: `Paid amount (${formData.paid_amount.toFixed(2)}) cannot exceed expense total (${formData.totalAmount.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    try {
      const expensesData = localStorage.getItem("expenses");
      if (expensesData) {
        const expenses = JSON.parse(expensesData);
        const expenseIndex = expenses.findIndex((exp: any) => exp.id === id);
        
        if (expenseIndex !== -1) {
          // Update expense
          expenses[expenseIndex] = {
            ...expenses[expenseIndex],
            date: formData.date,
            category: formData.category,
            description: formData.description,
            amount: formData.amount,
            vatAmount: formData.vatAmount,
            totalAmount: formData.totalAmount,
            paymentMethod: formData.paymentMethod,
            vendor: formData.vendor,
            status: formData.payment_status,
            paid_amount: formData.paid_amount,
            receiptAttached: formData.receiptAttached,
            notes: formData.notes,
            updatedAt: new Date().toISOString(),
          };
          
          localStorage.setItem("expenses", JSON.stringify(expenses));
          
          toast({
            title: "Success",
            description: "Expense updated successfully",
          });
          
          router.push("/expenses");
        }
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
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

  return (
    <>
      <SEO 
        title="Edit Expense - Saudi ERP System"
        description="Edit expense details"
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/expenses">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">Edit Expense</h1>
                <p className="text-muted-foreground mt-1">Update expense details</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/expenses">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Update Expense
              </Button>
            </div>
          </div>

          {/* Expense Details */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Expense Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="Enter expense description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    placeholder="Enter vendor name"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                      <SelectItem value="cheque">📝 Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Details */}
          <Card>
            <CardHeader>
              <CardTitle>Amount & VAT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatIncluded">VAT Status</Label>
                  <Select
                    value={formData.vatIncluded ? "included" : "excluded"}
                    onValueChange={(value) => handleVATToggle(value === "included")}
                  >
                    <SelectTrigger id="vatIncluded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="included">VAT Included in Amount</SelectItem>
                      <SelectItem value="excluded">VAT Excluded (Add to Amount)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {formData.vatIncluded ? "Total Amount (Inc. VAT)" : "Amount (Exc. VAT)"} *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.vatIncluded ? formData.totalAmount || "" : formData.amount || ""}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Amount:</span>
                  <span className="font-medium">SAR {formData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({SAUDI_VAT_RATE}%):</span>
                  <span className="font-medium">SAR {formData.vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Amount:</span>
                  <span className="text-primary">SAR {formData.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paid_amount">Amount Paid (SAR)</Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.totalAmount}
                    placeholder="0.00"
                    value={formData.paid_amount || ""}
                    onChange={(e) => {
                      const paidAmount = parseFloat(e.target.value) || 0;
                      let status: "paid" | "unpaid" | "pending" = "unpaid";
                      if (paidAmount >= formData.totalAmount) {
                        status = "paid";
                      } else if (paidAmount > 0) {
                        status = "pending";
                      }
                      setFormData({ 
                        ...formData, 
                        paid_amount: paidAmount,
                        payment_status: status
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <div className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium capitalize ${
                    formData.payment_status === "paid" 
                      ? "bg-success/10 text-success"
                      : formData.payment_status === "pending"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {formData.payment_status}
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Expense Total:</span>
                    <span className="font-semibold">SAR {formData.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Amount Paid:</span>
                    <span className="font-semibold text-success">SAR {formData.paid_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Amount Due:</span>
                    <span className={`font-bold text-lg ${
                      (formData.totalAmount - formData.paid_amount) > 0 
                        ? 'text-destructive' 
                        : 'text-success'
                    }`}>
                      SAR {(formData.totalAmount - formData.paid_amount).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt/Invoice</Label>
                <div className="flex gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFormData({ ...formData, receiptAttached: !!e.target.files?.length })}
                  />
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}