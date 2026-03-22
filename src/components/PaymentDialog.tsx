import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, CreditCard, Building2, Banknote } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  type: "sales" | "purchase";
  onPaymentRecorded: (invoice: any, amount: number, method: string, notes: string) => void;
}

export function PaymentDialog({ open, onOpenChange, invoice, type, onPaymentRecorded }: PaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const remainingBalance = invoice 
    ? (parseFloat(invoice.total_amount || 0) - parseFloat(invoice.paid_amount || 0))
    : 0;

  const handleSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > remainingBalance) {
      alert(`Payment amount cannot exceed remaining balance of SAR ${remainingBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await onPaymentRecorded(invoice, amount, paymentMethod, paymentNotes);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error recording payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNotes("");
  };

  const handlePayFull = () => {
    setPaymentAmount(remainingBalance.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for {type === "sales" ? "customer" : "supplier"}: {invoice?.customer_name || invoice?.supplier_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Details */}
          <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice Number:</span>
              <span className="font-medium">{invoice?.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">SAR {parseFloat(invoice?.total_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-medium">SAR {parseFloat(invoice?.paid_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground font-semibold">Remaining Balance:</span>
              <span className="font-bold text-lg text-destructive">SAR {remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount (SAR)</Label>
            <div className="flex gap-2">
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={remainingBalance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePayFull}
                disabled={remainingBalance <= 0}
              >
                Pay Full
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <span>Cash</span>
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit/Debit Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
                <SelectItem value="cheque">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Cheque</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Notes */}
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes (Optional)</Label>
            <Textarea
              id="payment-notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}