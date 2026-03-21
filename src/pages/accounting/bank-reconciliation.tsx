import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Download, CheckCircle, XCircle, FileSpreadsheet, Save } from "lucide-react";
import { bankReconciliationService, type BankAccountWithBalance, type BankTransactionWithMatching } from "@/services/bankReconciliationService";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";

export default function BankReconciliationPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithBalance[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [transactions, setTransactions] = useState<BankTransactionWithMatching[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    iban: "",
    swiftCode: "",
    currency: "SAR",
    openingBalance: "0",
    accountType: "checking" as "checking" | "savings" | "current",
  });
  
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all", // all, matched, unmatched
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions();
    }
  }, [selectedAccount, filters]);

  const loadBankAccounts = async () => {
    try {
      const data = await bankReconciliationService.getBankAccounts();
      setBankAccounts(data);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await bankReconciliationService.getBankTransactions(
        selectedAccount,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      
      // Filter by status if needed
      let filteredData = data;
      if (filters.status === "matched") {
        filteredData = data.filter(t => t.is_matched);
      } else if (filters.status === "unmatched") {
        filteredData = data.filter(t => !t.is_matched);
      }
      
      setTransactions(filteredData);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.accountName || !newAccount.accountNumber || !newAccount.bankName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await bankReconciliationService.createBankAccount({
        account_name: newAccount.accountName,
        account_number: newAccount.accountNumber,
        bank_name: newAccount.bankName,
        branch_name: newAccount.branchName || null,
        iban: newAccount.iban || null,
        swift_code: newAccount.swiftCode || null,
        currency: newAccount.currency,
        opening_balance: parseFloat(newAccount.openingBalance) || 0,
        current_balance: parseFloat(newAccount.openingBalance) || 0,
        account_type: newAccount.accountType,
        is_active: true,
      } as any);

      toast({
        title: "Success",
        description: "Bank account created successfully",
      });

      // Reset form
      setNewAccount({
        accountName: "",
        accountNumber: "",
        bankName: "",
        branchName: "",
        iban: "",
        swiftCode: "",
        currency: "SAR",
        openingBalance: "0",
        accountType: "checking",
      });
      setIsAccountDialogOpen(false);
      loadBankAccounts();
    } catch (error) {
      console.error("Error creating bank account:", error);
      toast({
        title: "Error",
        description: "Failed to create bank account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportTransactions = async (file: File) => {
    try {
      setLoading(true);
      
      // Parse CSV/Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const transactions = lines.slice(1).map(line => {
          const [date, description, debit, credit, balance] = line.split(",");
          const amount = parseFloat(debit || credit || "0");
          const type = debit ? "debit" : "credit";
          
          return {
            transaction_date: date?.trim(),
            description: description?.trim(),
            amount,
            transaction_type: type,
            balance_after: parseFloat(balance || "0"),
            category: "Uncategorized",
            matched_transaction_type: null,
            reconciled: false,
            matched_transaction_id: null,
          } as any;
        }).filter(t => t.transaction_date && t.amount);

        await bankReconciliationService.importBankTransactions(selectedAccount, transactions);
        
        toast({
          title: "Success",
          description: `Imported ${transactions.length} transactions`,
        });
        
        loadTransactions();
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing transactions:", error);
      toast({
        title: "Error",
        description: "Failed to import transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMatchTransaction = async (transactionId: string, journalEntryId: string) => {
    try {
      await bankReconciliationService.matchTransaction(transactionId, journalEntryId);
      toast({
        title: "Success",
        description: "Transaction matched successfully",
      });
      loadTransactions();
    } catch (error) {
      console.error("Error matching transaction:", error);
      toast({
        title: "Error",
        description: "Failed to match transaction",
        variant: "destructive",
      });
    }
  };

  const handleBulkReconcile = async () => {
    try {
      setReconciling(true);
      
      // Create reconciliation record
      const reconData = {
        account_id: selectedAccount,
        statement_date: new Date().toISOString().split("T")[0],
        reconciliation_date: new Date().toISOString().split("T")[0],
        statement_balance: 0, // Calculate from selected transactions
        book_balance: 0, // Calculate from accounting records
        difference: 0,
        status: "completed" as const,
        notes: `Reconciled ${selectedTransactions.size} transactions`,
      } as any;
      
      await bankReconciliationService.createReconciliation(reconData);
      
      toast({
        title: "Success",
        description: "Bank reconciliation completed",
      });
      
      setSelectedTransactions(new Set());
      loadTransactions();
    } catch (error) {
      console.error("Error reconciling:", error);
      toast({
        title: "Error",
        description: "Failed to complete reconciliation",
        variant: "destructive",
      });
    } finally {
      setReconciling(false);
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const selectedAccountData = bankAccounts.find(acc => acc.id === selectedAccount);
  const unmatchedCount = transactions.filter(t => !t.is_matched).length;
  const matchedCount = transactions.filter(t => t.is_matched).length;

  return (
    <>
      <SEO 
        title="Bank Reconciliation - Saudi ERP System"
        description="Match bank statements with accounting records"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold font-heading">Bank Reconciliation</h1>
              <p className="text-muted-foreground">Match bank statements with your accounting records</p>
            </div>

            {/* Bank Account Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Bank Account</CardTitle>
                <CardDescription>Choose the bank account to reconcile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bank Account</Label>
                    <div className="flex gap-2">
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name} ({account.account_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAccountDialogOpen(true)}
                      >
                        Add Account
                      </Button>
                    </div>
                  </div>
                  
                  {selectedAccountData && (
                    <div className="space-y-2">
                      <Label>Current Balance</Label>
                      <div className="text-2xl font-bold text-primary">
                        SAR {selectedAccountData.current_balance?.toLocaleString() || "0.00"}
                      </div>
                    </div>
                  )}
                </div>

                {selectedAccount && (
                  <div className="flex gap-2">
                    <Label htmlFor="import-transactions" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Transactions (CSV)
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="import-transactions"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportTransactions(file);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Bank Account Dialog */}
            <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                  <DialogDescription>
                    Create a new bank account for reconciliation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Account Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="accountName">
                        Account Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="accountName"
                        placeholder="e.g., Al Rajhi Current Account"
                        value={newAccount.accountName}
                        onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">
                        Account Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        placeholder="e.g., 123456789"
                        value={newAccount.accountNumber}
                        onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">
                        Bank Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="bankName"
                        placeholder="e.g., Al Rajhi Bank"
                        value={newAccount.bankName}
                        onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branchName">Branch Name</Label>
                      <Input
                        id="branchName"
                        placeholder="e.g., Riyadh Main Branch"
                        value={newAccount.branchName}
                        onChange={(e) => setNewAccount({ ...newAccount, branchName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        placeholder="e.g., SA0380000000608010167519"
                        value={newAccount.iban}
                        onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                      <Input
                        id="swiftCode"
                        placeholder="e.g., RJHISARI"
                        value={newAccount.swiftCode}
                        onChange={(e) => setNewAccount({ ...newAccount, swiftCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="accountType">Account Type</Label>
                      <Select
                        value={newAccount.accountType}
                        onValueChange={(value: "checking" | "savings" | "current") =>
                          setNewAccount({ ...newAccount, accountType: value })
                        }
                      >
                        <SelectTrigger id="accountType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        placeholder="SAR"
                        value={newAccount.currency}
                        onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="openingBalance">Opening Balance</Label>
                      <Input
                        id="openingBalance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newAccount.openingBalance}
                        onChange={(e) => setNewAccount({ ...newAccount, openingBalance: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAccountDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateAccount} disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Filters */}
            {selectedAccount && (
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Transactions</SelectItem>
                          <SelectItem value="matched">Matched Only</SelectItem>
                          <SelectItem value="unmatched">Unmatched Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={loadTransactions} className="w-full">
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            {selectedAccount && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{transactions.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Matched</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">{matchedCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Unmatched</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">{unmatchedCount}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Transactions Table */}
            {selectedAccount && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Bank Transactions</CardTitle>
                      <CardDescription>Select transactions to reconcile</CardDescription>
                    </div>
                    {selectedTransactions.size > 0 && (
                      <Button onClick={handleBulkReconcile} disabled={reconciling}>
                        <Save className="h-4 w-4 mr-2" />
                        {reconciling ? "Reconciling..." : `Reconcile ${selectedTransactions.size} Selected`}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found. Import a bank statement to get started.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedTransactions.size === unmatchedCount && unmatchedCount > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTransactions(new Set(transactions.filter(t => !t.is_matched).map(t => t.id)));
                                  } else {
                                    setSelectedTransactions(new Set());
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedTransactions.has(transaction.id)}
                                  disabled={transaction.is_matched}
                                  onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(transaction.transaction_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {transaction.reference_number || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.transaction_type === "debit" ? (
                                  <span className="text-destructive">SAR {transaction.amount.toLocaleString()}</span>
                                ) : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.transaction_type === "credit" ? (
                                  <span className="text-success">SAR {transaction.amount.toLocaleString()}</span>
                                ) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                SAR {transaction.balance_after?.toLocaleString() || "0.00"}
                              </TableCell>
                              <TableCell>
                                {transaction.is_matched ? (
                                  <Badge className="bg-success/10 text-success">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Matched
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-warning">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Unmatched
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}