import { useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export default function CreateJournalEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: "",
    description: "",
  });

  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountCode: "", accountName: "", description: "", debit: 0, credit: 0 },
    { id: "2", accountCode: "", accountName: "", description: "", debit: 0, credit: 0 },
  ]);

  // Chart of Accounts
  const accounts = [
    { code: "1100", name: "Cash", type: "asset" },
    { code: "1200", name: "Accounts Receivable", type: "asset" },
    { code: "1300", name: "Inventory", type: "asset" },
    { code: "1400", name: "Prepaid Expenses", type: "asset" },
    { code: "1500", name: "Fixed Assets", type: "asset" },
    { code: "2100", name: "Accounts Payable", type: "liability" },
    { code: "2200", name: "VAT Payable", type: "liability" },
    { code: "2300", name: "Salaries Payable", type: "liability" },
    { code: "2400", name: "Loans Payable", type: "liability" },
    { code: "3100", name: "Owner's Equity", type: "equity" },
    { code: "3200", name: "Retained Earnings", type: "equity" },
    { code: "4100", name: "Sales Revenue", type: "revenue" },
    { code: "4200", name: "Service Revenue", type: "revenue" },
    { code: "5100", name: "Cost of Goods Sold", type: "expense" },
    { code: "5200", name: "Operating Expenses", type: "expense" },
    { code: "5300", name: "Salaries Expense", type: "expense" },
    { code: "5400", name: "Rent Expense", type: "expense" },
    { code: "5500", name: "Utilities Expense", type: "expense" },
  ];

  const addLine = () => {
    const newLine: JournalLine = {
      id: Date.now().toString(),
      accountCode: "",
      accountName: "",
      description: "",
      debit: 0,
      credit: 0,
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "Journal entry must have at least 2 lines (debit and credit)",
        variant: "destructive",
      });
      return;
    }
    setLines(lines.filter(line => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        
        // If account code is selected, update account name
        if (field === "accountCode") {
          const account = accounts.find(a => a.code === value);
          if (account) {
            updated.accountName = account.name;
          }
        }
        
        return updated;
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in date and description",
        variant: "destructive",
      });
      return;
    }

    // Check if all lines have accounts
    const invalidLines = lines.filter(line => !line.accountCode);
    if (invalidLines.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select an account for all lines",
        variant: "destructive",
      });
      return;
    }

    // Check if at least one debit and one credit exists
    const hasDebit = lines.some(line => Number(line.debit) > 0);
    const hasCredit = lines.some(line => Number(line.credit) > 0);
    
    if (!hasDebit || !hasCredit) {
      toast({
        title: "Validation Error",
        description: "Journal entry must have at least one debit and one credit",
        variant: "destructive",
      });
      return;
    }

    // Check if debits equal credits (double-entry accounting)
    const { totalDebit, totalCredit } = calculateTotals();
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({
        title: "Balance Error",
        description: `Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Generate entry number
    const entryNumber = `JE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;

    // Simulate saving
    const journalEntry = {
      id: Date.now().toString(),
      entryNumber,
      date: formData.date,
      reference: formData.reference,
      description: formData.description,
      lines: lines.filter(line => line.accountCode && (Number(line.debit) > 0 || Number(line.credit) > 0)),
      totalDebit,
      totalCredit,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
    localStorage.setItem("journalEntries", JSON.stringify([...existingEntries, journalEntry]));

    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Success",
        description: `Journal Entry ${entryNumber} created successfully`,
      });
      router.push("/accounting");
    }, 1000);
  };

  const { totalDebit, totalCredit, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <>
      <SEO 
        title="Create Journal Entry - Saudi ERP System"
        description="Create new accounting journal entry"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/accounting">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-heading">Create Journal Entry</h1>
              <p className="text-muted-foreground mt-1">Record a new accounting transaction</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Journal Entry Details</CardTitle>
                <CardDescription>
                  Enter the transaction date, reference, and line items. Debits must equal Credits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Transaction Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="e.g., INV-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief transaction description"
                      required
                    />
                  </div>
                </div>

                {/* Journal Lines */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Journal Lines</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-table-header">
                          <tr>
                            <th className="text-left p-3 font-semibold text-sm w-[200px]">Account</th>
                            <th className="text-left p-3 font-semibold text-sm">Description</th>
                            <th className="text-right p-3 font-semibold text-sm w-[140px]">Debit</th>
                            <th className="text-right p-3 font-semibold text-sm w-[140px]">Credit</th>
                            <th className="text-center p-3 font-semibold text-sm w-[60px]">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line, index) => (
                            <tr key={line.id} className="border-t">
                              <td className="p-3">
                                <Select
                                  value={line.accountCode}
                                  onValueChange={(value) => updateLine(line.id, "accountCode", value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map((account) => (
                                      <SelectItem key={account.code} value={account.code}>
                                        {account.code} - {account.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3">
                                <Input
                                  value={line.description}
                                  onChange={(e) => updateLine(line.id, "description", e.target.value)}
                                  placeholder="Line description"
                                  className="w-full"
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.debit || ""}
                                  onChange={(e) => {
                                    updateLine(line.id, "debit", Number(e.target.value));
                                    if (Number(e.target.value) > 0) {
                                      updateLine(line.id, "credit", 0);
                                    }
                                  }}
                                  placeholder="0.00"
                                  className="text-right"
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.credit || ""}
                                  onChange={(e) => {
                                    updateLine(line.id, "credit", Number(e.target.value));
                                    if (Number(e.target.value) > 0) {
                                      updateLine(line.id, "debit", 0);
                                    }
                                  }}
                                  placeholder="0.00"
                                  className="text-right"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeLine(line.id)}
                                  disabled={lines.length <= 2}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 bg-table-header font-semibold">
                          <tr>
                            <td className="p-3" colSpan={2}>Total</td>
                            <td className="p-3 text-right">SAR {totalDebit.toFixed(2)}</td>
                            <td className="p-3 text-right">SAR {totalCredit.toFixed(2)}</td>
                            <td className="p-3"></td>
                          </tr>
                          {!isBalanced && (
                            <tr>
                              <td colSpan={5} className="p-3">
                                <div className="flex items-center gap-2 text-destructive text-sm">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>
                                    Out of balance by SAR {Math.abs(difference).toFixed(2)}
                                    {difference > 0 ? " (Debit exceeds Credit)" : " (Credit exceeds Debit)"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Balance Check Alert */}
                {isBalanced && totalDebit > 0 && (
                  <div className="rounded-md border border-success bg-success/10 p-4">
                    <div className="flex items-center gap-2 text-success">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Entry is balanced! Debits equal Credits.</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Link href="/accounting">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading || !isBalanced || totalDebit === 0}>
                    {loading ? "Creating..." : "Create Journal Entry"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </DashboardLayout>
    </>
  );
}