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
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Save, 
  Link2, 
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  Calendar,
  DollarSign
} from "lucide-react";
import { bankReconciliationService, type BankAccountWithBalance, type BankTransactionWithMatching } from "@/services/bankReconciliationService";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface JournalEntry {
  id: string;
  entry_date: string;
  reference_number: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
}

interface MatchSuggestion {
  bankTransactionId: string;
  journalEntryId: string;
  confidence: number;
  reason: string;
}

export default function BankReconciliationPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithBalance[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [transactions, setTransactions] = useState<BankTransactionWithMatching[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<string>("");
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [selectedBankTransaction, setSelectedBankTransaction] = useState<BankTransactionWithMatching | null>(null);
  
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
    status: "all",
    searchTerm: "",
    minAmount: "",
    maxAmount: "",
  });

  const [reconciliationSummary, setReconciliationSummary] = useState({
    bankBalance: 0,
    bookBalance: 0,
    difference: 0,
    matchedCount: 0,
    unmatchedCount: 0,
    reconciledCount: 0,
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions();
      loadJournalEntries();
    }
  }, [selectedAccount, filters]);

  useEffect(() => {
    if (transactions.length > 0 && journalEntries.length > 0) {
      generateMatchSuggestions();
    }
  }, [transactions, journalEntries]);

  useEffect(() => {
    calculateReconciliationSummary();
  }, [transactions, selectedAccount]);

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
      
      let filteredData = data;
      
      // Apply status filter
      if (filters.status === "matched") {
        filteredData = filteredData.filter(t => t.is_matched);
      } else if (filters.status === "unmatched") {
        filteredData = filteredData.filter(t => !t.is_matched);
      } else if (filters.status === "reconciled") {
        filteredData = filteredData.filter(t => t.reconciled);
      }
      
      // Apply search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(t => 
          t.description?.toLowerCase().includes(searchLower) ||
          t.reference_number?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply amount filter
      if (filters.minAmount) {
        const min = parseFloat(filters.minAmount);
        filteredData = filteredData.filter(t => t.amount >= min);
      }
      if (filters.maxAmount) {
        const max = parseFloat(filters.maxAmount);
        filteredData = filteredData.filter(t => t.amount <= max);
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

  const loadJournalEntries = async () => {
    try {
      const { data, error } = await (supabase
        .from("journal_entries" as any)
        .select("*")
        .eq("status", "posted")
        .order("entry_date", { ascending: false })
        .limit(100)) as any;

      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
  };

  const generateMatchSuggestions = () => {
    const suggestions: MatchSuggestion[] = [];
    
    transactions.forEach(transaction => {
      if (transaction.is_matched) return;
      
      journalEntries.forEach(entry => {
        let confidence = 0;
        const reasons: string[] = [];
        
        // Check amount match
        const transactionAmount = transaction.amount;
        const entryAmount = transaction.transaction_type === "debit" 
          ? entry.total_debit 
          : entry.total_credit;
        
        if (Math.abs(transactionAmount - entryAmount) < 0.01) {
          confidence += 50;
          reasons.push("Exact amount match");
        } else if (Math.abs(transactionAmount - entryAmount) < transactionAmount * 0.05) {
          confidence += 25;
          reasons.push("Similar amount");
        }
        
        // Check date proximity (within 7 days)
        const transDate = new Date(transaction.transaction_date);
        const entryDate = new Date(entry.entry_date);
        const daysDiff = Math.abs((transDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          confidence += 30;
          reasons.push("Same date");
        } else if (daysDiff <= 3) {
          confidence += 15;
          reasons.push("Within 3 days");
        } else if (daysDiff <= 7) {
          confidence += 5;
          reasons.push("Within 7 days");
        }
        
        // Check description similarity
        if (transaction.description && entry.description) {
          const transDesc = transaction.description.toLowerCase();
          const entryDesc = entry.description.toLowerCase();
          
          if (transDesc.includes(entryDesc) || entryDesc.includes(transDesc)) {
            confidence += 20;
            reasons.push("Description match");
          }
        }
        
        // Check reference number match
        if (transaction.reference_number && entry.reference_number) {
          if (transaction.reference_number === entry.reference_number) {
            confidence += 30;
            reasons.push("Reference match");
          }
        }
        
        // Only suggest if confidence is reasonable
        if (confidence >= 50) {
          suggestions.push({
            bankTransactionId: transaction.id,
            journalEntryId: entry.id,
            confidence,
            reason: reasons.join(", "),
          });
        }
      });
    });
    
    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);
    setMatchSuggestions(suggestions);
  };

  const calculateReconciliationSummary = () => {
    const selectedAccountData = bankAccounts.find(acc => acc.id === selectedAccount);
    const bankBalance = selectedAccountData?.current_balance || 0;
    
    const matchedCount = transactions.filter(t => t.is_matched).length;
    const unmatchedCount = transactions.filter(t => !t.is_matched).length;
    const reconciledCount = transactions.filter(t => t.reconciled).length;
    
    // Calculate book balance (sum of all transactions)
    const bookBalance = transactions.reduce((sum, t) => {
      return sum + (t.transaction_type === "credit" ? t.amount : -t.amount);
    }, selectedAccountData?.opening_balance || 0);
    
    const difference = bankBalance - bookBalance;
    
    setReconciliationSummary({
      bankBalance,
      bookBalance,
      difference,
      matchedCount,
      unmatchedCount,
      reconciledCount,
    });
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
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const transactions = lines.slice(1).map(line => {
          const [date, description, debit, credit, balance, reference] = line.split(",");
          const amount = parseFloat(debit || credit || "0");
          const type = debit ? "debit" : "credit";
          
          return {
            transaction_date: date?.trim(),
            description: description?.trim(),
            reference_number: reference?.trim() || null,
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
      setIsMatchDialogOpen(false);
      setSelectedBankTransaction(null);
    } catch (error) {
      console.error("Error matching transaction:", error);
      toast({
        title: "Error",
        description: "Failed to match transaction",
        variant: "destructive",
      });
    }
  };

  const handleAutoMatch = async () => {
    try {
      setLoading(true);
      let matchedCount = 0;
      
      for (const suggestion of matchSuggestions) {
        if (suggestion.confidence >= 80) {
          await handleMatchTransaction(suggestion.bankTransactionId, suggestion.journalEntryId);
          matchedCount++;
        }
      }
      
      toast({
        title: "Auto-Match Complete",
        description: `Automatically matched ${matchedCount} transactions`,
      });
      
      loadTransactions();
    } catch (error) {
      console.error("Error auto-matching:", error);
      toast({
        title: "Error",
        description: "Failed to auto-match transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReconcile = async () => {
    try {
      setReconciling(true);
      
      const reconData = {
        account_id: selectedAccount,
        statement_date: new Date().toISOString().split("T")[0],
        reconciliation_date: new Date().toISOString().split("T")[0],
        statement_balance: reconciliationSummary.bankBalance,
        book_balance: reconciliationSummary.bookBalance,
        difference: reconciliationSummary.difference,
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

  const openMatchDialog = (transaction: BankTransactionWithMatching) => {
    setSelectedBankTransaction(transaction);
    setIsMatchDialogOpen(true);
  };

  const getMatchSuggestionForTransaction = (transactionId: string) => {
    return matchSuggestions.find(s => s.bankTransactionId === transactionId);
  };

  const selectedAccountData = bankAccounts.find(acc => acc.id === selectedAccount);
  const unmatchedCount = transactions.filter(t => !t.is_matched).length;
  const matchedCount = transactions.filter(t => t.is_matched).length;
  const highConfidenceMatches = matchSuggestions.filter(s => s.confidence >= 80).length;

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
                    {highConfidenceMatches > 0 && (
                      <Button type="button" variant="default" onClick={handleAutoMatch}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Auto-Match {highConfidenceMatches} Transactions
                      </Button>
                    )}
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

            {/* Reconciliation Summary */}
            {selectedAccount && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Bank Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      SAR {reconciliationSummary.bankBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Book Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      SAR {reconciliationSummary.bookBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Difference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-2xl font-bold",
                      Math.abs(reconciliationSummary.difference) < 0.01 ? "text-success" : "text-warning"
                    )}>
                      SAR {reconciliationSummary.difference.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Matched
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {reconciliationSummary.matchedCount}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Unmatched
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {reconciliationSummary.unmatchedCount}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            {selectedAccount && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search description, reference..."
                          className="pl-8"
                          value={filters.searchTerm}
                          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={filters.status} 
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Transactions</SelectItem>
                          <SelectItem value="matched">Matched Only</SelectItem>
                          <SelectItem value="unmatched">Unmatched Only</SelectItem>
                          <SelectItem value="reconciled">Reconciled Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
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
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div className="space-y-2">
                      <Label>Min Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={filters.minAmount}
                        onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Max Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <Button onClick={loadTransactions} className="w-full">
                        Apply Filters
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setFilters({
                          startDate: "",
                          endDate: "",
                          status: "all",
                          searchTerm: "",
                          minAmount: "",
                          maxAmount: "",
                        })}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transactions Table */}
            {selectedAccount && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Bank Transactions</CardTitle>
                      <CardDescription>
                        {transactions.length} transaction(s) • {matchedCount} matched • {unmatchedCount} unmatched
                      </CardDescription>
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
                            <TableHead>Match</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => {
                            const suggestion = getMatchSuggestionForTransaction(transaction.id);
                            
                            return (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedTransactions.has(transaction.id)}
                                    disabled={transaction.is_matched}
                                    onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                                  />
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {transaction.description}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {transaction.reference_number || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {transaction.transaction_type === "debit" ? (
                                    <span className="text-destructive font-medium">
                                      SAR {transaction.amount.toLocaleString()}
                                    </span>
                                  ) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {transaction.transaction_type === "credit" ? (
                                    <span className="text-success font-medium">
                                      SAR {transaction.amount.toLocaleString()}
                                    </span>
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
                                  ) : transaction.reconciled ? (
                                    <Badge className="bg-blue-500/10 text-blue-500">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Reconciled
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-warning">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Unmatched
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {suggestion && !transaction.is_matched && (
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs",
                                        suggestion.confidence >= 80 ? "border-success text-success" :
                                        suggestion.confidence >= 60 ? "border-blue-500 text-blue-500" :
                                        "border-warning text-warning"
                                      )}
                                    >
                                      {suggestion.confidence}% match
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {!transaction.is_matched && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openMatchDialog(transaction)}
                                    >
                                      <Link2 className="h-3 w-3 mr-1" />
                                      Match
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Match Transaction Dialog */}
            <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Match Transaction</DialogTitle>
                  <DialogDescription>
                    Select a journal entry to match with this bank transaction
                  </DialogDescription>
                </DialogHeader>
                
                {selectedBankTransaction && (
                  <div className="space-y-4">
                    {/* Bank Transaction Details */}
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Bank Transaction</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {new Date(selectedBankTransaction.transaction_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Description:</span>
                          <span className="font-medium">{selectedBankTransaction.description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reference:</span>
                          <span className="font-mono text-xs">
                            {selectedBankTransaction.reference_number || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className={cn(
                            "font-bold",
                            selectedBankTransaction.transaction_type === "debit" ? "text-destructive" : "text-success"
                          )}>
                            {selectedBankTransaction.transaction_type === "debit" ? "-" : "+"}
                            SAR {selectedBankTransaction.amount.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Journal Entries List */}
                    <div className="space-y-2">
                      <Label>Select Journal Entry to Match</Label>
                      <div className="rounded-md border max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead>Select</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Debit</TableHead>
                              <TableHead className="text-right">Credit</TableHead>
                              <TableHead>Match</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {journalEntries.map((entry) => {
                              const suggestion = matchSuggestions.find(
                                s => s.bankTransactionId === selectedBankTransaction.id && 
                                     s.journalEntryId === entry.id
                              );
                              
                              return (
                                <TableRow 
                                  key={entry.id}
                                  className={cn(
                                    "cursor-pointer hover:bg-muted/50",
                                    selectedJournalEntry === entry.id && "bg-primary/5"
                                  )}
                                  onClick={() => setSelectedJournalEntry(entry.id)}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedJournalEntry === entry.id}
                                      onCheckedChange={() => setSelectedJournalEntry(entry.id)}
                                    />
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {new Date(entry.entry_date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {entry.reference_number}
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate">
                                    {entry.description}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    SAR {entry.total_debit.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    SAR {entry.total_credit.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    {suggestion && (
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant="outline"
                                          className={cn(
                                            "text-xs",
                                            suggestion.confidence >= 80 ? "border-success text-success" :
                                            suggestion.confidence >= 60 ? "border-blue-500 text-blue-500" :
                                            "border-warning text-warning"
                                          )}
                                        >
                                          {suggestion.confidence}%
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {suggestion.reason}
                                        </span>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMatchDialogOpen(false);
                      setSelectedBankTransaction(null);
                      setSelectedJournalEntry("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!selectedJournalEntry}
                    onClick={() => {
                      if (selectedBankTransaction && selectedJournalEntry) {
                        handleMatchTransaction(selectedBankTransaction.id, selectedJournalEntry);
                      }
                    }}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Match Transaction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}