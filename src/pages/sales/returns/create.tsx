import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SAUDI_VAT_RATE } from "@/lib/constants";

interface ReturnItem {
  productId: string;
  productName: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface ReturnFormData {
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: ReturnItem[];
  reason: string;
  notes: string;
  refundMethod: "cash" | "credit" | "bank";
}

export default function CreateSalesReturnPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ReturnFormData>({
    originalInvoiceId: "",
    originalInvoiceNumber: "",
    customerId: "",
    customerName: "",
    date: new Date().toISOString().split("T")[0],
    items: [],
    reason: "",
    notes: "",
    refundMethod: "cash",
  });

  const loadInvoice = (invoiceNumber: string) => {
    // Mock loading invoice data - replace with actual data loading
    if (invoiceNumber === "INV-2026-00125") {
      setFormData({
        ...formData,
        originalInvoiceId: "1",
        originalInvoiceNumber: invoiceNumber,
        customerId: "1",
        customerName: "Al-Rajhi Trading Co.",
        items: [
          {
            productId: "1",
            productName: "HP LaserJet Printer",
            originalQuantity: 2,
            returnQuantity: 1,
            unitPrice: 1500,
            taxRate: SAUDI_VAT_RATE,
            taxAmount: 225,
            total: 1725,
          },
        ],
      });
    }
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    
    if (quantity > item.originalQuantity) {
      alert("Return quantity cannot exceed original quantity");
      return;
    }
    
    item.returnQuantity = quantity;
    const subtotal = item.returnQuantity * item.unitPrice;
    item.taxAmount = (subtotal * item.taxRate) / 100;
    item.total = subtotal + item.taxAmount;
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.returnQuantity * item.unitPrice);
    }, 0);
    
    const taxAmount = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = formData.items.reduce((sum, item) => sum + item.total, 0);
    
    return { subtotal, taxAmount, total };
  };

  const totals = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.originalInvoiceNumber) {
      alert("Please select an original invoice");
      return;
    }
    
    if (formData.items.length === 0) {
      alert("Please add at least one item to return");
      return;
    }
    
    if (!formData.reason) {
      alert("Please provide a reason for the return");
      return;
    }
    
    // Save return data
    console.log("Sales return data:", formData);
    router.push("/sales/returns");
  };

  return (
    <>
      <SEO 
        title="Create Sales Return - Saudi ERP System"
        description="Create a new sales return / credit note"
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sales/returns">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">Create Sales Return</h1>
                <p className="text-muted-foreground mt-1">Process customer returns and issue credit notes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/sales/returns">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Create Return
              </Button>
            </div>
          </div>

          {/* Return Details */}
          <Card>
            <CardHeader>
              <CardTitle>Return Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="originalInvoice">Original Invoice Number *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.originalInvoiceNumber}
                      onValueChange={(value) => loadInvoice(value)}
                    >
                      <SelectTrigger id="originalInvoice">
                        <SelectValue placeholder="Select invoice to return" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INV-2026-00125">INV-2026-00125</SelectItem>
                        <SelectItem value="INV-2026-00124">INV-2026-00124</SelectItem>
                        <SelectItem value="INV-2026-00123">INV-2026-00123</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="returnNumber">Return Number</Label>
                  <Input
                    id="returnNumber"
                    value="RET-2026-00003"
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Input
                    id="customer"
                    value={formData.customerName || "Select invoice first"}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Return Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reason">Reason for Return *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select return reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective">Defective Product</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item Delivered</SelectItem>
                      <SelectItem value="damaged">Damaged in Transit</SelectItem>
                      <SelectItem value="not_as_described">Not as Described</SelectItem>
                      <SelectItem value="customer_request">Customer Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Return</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select an original invoice to load items</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium">{item.productName}</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Original Quantity: {item.originalQuantity} | Unit Price: SAR {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Return Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            max={item.originalQuantity}
                            value={item.returnQuantity}
                            onChange={(e) => updateReturnQuantity(index, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Subtotal</Label>
                          <Input
                            value={`SAR ${(item.returnQuantity * item.unitPrice).toFixed(2)}`}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>VAT ({item.taxRate}%)</Label>
                          <Input
                            value={`SAR ${item.taxAmount.toFixed(2)}`}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <Input
                            value={`SAR ${item.total.toFixed(2)}`}
                            disabled
                            className="bg-muted font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              {formData.items.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="max-w-md ml-auto space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">SAR {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (VAT {SAUDI_VAT_RATE}%):</span>
                      <span className="font-medium">SAR {totals.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t">
                      <span>Total Refund Amount:</span>
                      <span className="text-primary">SAR {totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refund Details */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refundMethod">Refund Method *</Label>
                <Select
                  value={formData.refundMethod}
                  onValueChange={(value: "cash" | "credit" | "bank") => setFormData({ ...formData, refundMethod: value })}
                >
                  <SelectTrigger id="refundMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Refund</SelectItem>
                    <SelectItem value="credit">Store Credit</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this return..."
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