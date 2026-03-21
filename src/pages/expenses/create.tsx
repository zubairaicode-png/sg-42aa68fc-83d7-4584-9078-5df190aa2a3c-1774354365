import { useState } from "react";
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
import { useRouter } from "next/router";
import { SAUDI_VAT_RATE } from "@/lib/constants";

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

export default function CreateExpensePage() {
  const router = useRouter();
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
  });

  const calculateVAT = (amount: number, vatIncluded: boolean) => {
    if (vatIncluded) {
      // VAT is included in the amount
      const vatAmount = (amount * SAUDI_VAT_RATE) / (100 + SAUDI_VAT_RATE);
      const baseAmount = amount - vatAmount;
      return { baseAmount, vatAmount, totalAmount: amount };
    } else {
      // VAT needs to be added
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
      alert("Please select an expense category");
      return;
    }
    
    if (!formData.description) {
      alert("Please enter a description");
      return;
    }
    
    if (formData.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Generate expense number
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    // Create expense object
    const expense = {
      id: Date.now().toString(),
      expenseNumber,
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: formData.amount,
      vatAmount: formData.vatAmount,
      totalAmount: formData.totalAmount,
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor,
      status: "pending",
      receiptAttached: formData.receiptAttached,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingExpenses = localStorage.getItem("expenses");
    const expenses = existingExpenses ? JSON.parse(existingExpenses) : [];
    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));

    // Create accounting entry
    const journalEntry = {
      id: Date.now().toString(),
      entryNumber: `JE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      date: formData.date,
      description: `Expense: ${formData.description}`,
      reference: expenseNumber,
      lines: [
        {
          account: getCategoryAccount(formData.category),
          description: formData.description,
          debit: formData.amount,
          credit: 0,
        },
        {
          account: "1300 - VAT Receivable",
          description: "Input VAT",
          debit: formData.vatAmount,
          credit: 0,
        },
        {
          account: getPaymentAccount(formData.paymentMethod),
          description: "Payment",
          debit: 0,
          credit: formData.totalAmount,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Save journal entry
    const existingJournals = localStorage.getItem("journalEntries");
    const journals = existingJournals ? JSON.parse(existingJournals) : [];
    journals.push(journalEntry);
    localStorage.setItem("journalEntries", JSON.stringify(journals));

    console.log("Expense created:", expense);
    router.push("/expenses");
  };

  const getCategoryAccount = (category: string): string => {
    const mapping: { [key: string]: string } = {
      "Office Rent": "5200 - Rent Expense",
      "Utilities": "5400 - Utilities Expense",
      "Salaries & Wages": "5300 - Salaries Expense",
      "Marketing & Advertising": "5100 - Marketing Expense",
      "Office Supplies": "5100 - Office Supplies",
      "Travel & Transportation": "5100 - Travel Expense",
      "Meals & Entertainment": "5100 - Entertainment Expense",
      "Professional Fees": "5100 - Professional Fees",
      "Insurance": "5100 - Insurance Expense",
      "Software & Subscriptions": "5100 - Software Expense",
      "Maintenance & Repairs": "5100 - Maintenance Expense",
      "Telecommunications": "5100 - Telecom Expense",
      "Banking Fees": "5100 - Bank Charges",
      "Taxes & Licenses": "5100 - Tax Expense",
    };
    return mapping[category] || "5100 - Other Expense";
  };

  const getPaymentAccount = (method: string): string => {
    const mapping: { [key: string]: string } = {
      "cash": "1100 - Cash",
      "bank": "1200 - Bank Account",
      "card": "1200 - Bank Account",
    };
    return mapping[method] || "1100 - Cash";
  };

  return (
    <>
      <SEO 
        title="Create Expense - Saudi ERP System"
        description="Record a new business expense"
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
                <h1 className="text-3xl font-bold font-heading">Create Expense</h1>
                <p className="text-muted-foreground mt-1">Record a new business expense</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/expenses">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Expense
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
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
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
                <p className="text-xs text-muted-foreground">Upload receipt or invoice (PDF, JPG, PNG)</p>
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