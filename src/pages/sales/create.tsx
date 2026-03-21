import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Save, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SAUDI_VAT_RATE } from "@/lib/constants";
import type { InvoiceItem } from "@/types";

interface InvoiceFormData {
  customerId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
}

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    vatNumber: "",
    buildingNumber: "",
    additionalNumber: "",
    streetName: "",
    district: "",
    city: "",
    postalCode: "",
  });
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [
      {
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: SAUDI_VAT_RATE,
        taxAmount: 0,
        discount: 0,
        total: 0,
      },
    ],
    notes: "",
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      alert("Please fill in all required customer fields");
      return;
    }

    // Get existing customers
    const existingCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
    
    // Create new customer
    const customer = {
      id: (existingCustomers.length + 1).toString(),
      ...newCustomer,
      type: "business",
      address: "",
      country: "Saudi Arabia",
      taxNumber: newCustomer.vatNumber,
      paymentTerms: 30,
      creditLimit: 0,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    existingCustomers.push(customer);
    localStorage.setItem("customers", JSON.stringify(existingCustomers));

    // Set as selected customer
    setFormData({ ...formData, customerId: customer.id });

    // Reset form and close dialog
    setNewCustomer({ 
      name: "", 
      email: "", 
      phone: "", 
      vatNumber: "",
      buildingNumber: "",
      additionalNumber: "",
      streetName: "",
      district: "",
      city: "",
      postalCode: "",
    });
    setIsCustomerDialogOpen(false);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          productName: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: SAUDI_VAT_RATE,
          taxAmount: 0,
          discount: 0,
          total: 0,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate totals
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    item.taxAmount = (taxableAmount * item.taxRate) / 100;
    item.total = taxableAmount + item.taxAmount;
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    const discountAmount = formData.items.reduce((sum, item) => {
      return sum + ((item.quantity * item.unitPrice * item.discount) / 100);
    }, 0);
    
    const taxAmount = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = formData.items.reduce((sum, item) => sum + item.total, 0);
    
    return { subtotal, discountAmount, taxAmount, total };
  };

  const totals = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the invoice
    console.log("Invoice data:", formData);
    router.push("/sales");
  };

  return (
    <>
      <SEO 
        title="Create Sales Invoice - Saudi ERP System"
        description="Create a new sales invoice"
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sales">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">Create Sales Invoice</h1>
                <p className="text-muted-foreground mt-1">Fill in the details below</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/sales">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Invoice
              </Button>
            </div>
          </div>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                    >
                      <SelectTrigger id="customer" className="flex-1">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Al-Rajhi Trading Co.</SelectItem>
                        <SelectItem value="2">Najd Commercial Est.</SelectItem>
                        <SelectItem value="3">Riyadh Supplies Ltd.</SelectItem>
                        <SelectItem value="4">Gulf Electronics</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="customerName">Customer Name *</Label>
                              <Input
                                id="customerName"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="Enter customer name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customerEmail">Email *</Label>
                              <Input
                                id="customerEmail"
                                type="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="customer@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customerPhone">Phone *</Label>
                              <Input
                                id="customerPhone"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                placeholder="+966 XX XXX XXXX"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customerVat">VAT Number</Label>
                              <Input
                                id="customerVat"
                                value={newCustomer.vatNumber}
                                onChange={(e) => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
                                placeholder="3XXXXXXXXXX003"
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <h4 className="font-medium mb-3">Saudi National Address</h4>
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label htmlFor="buildingNumber">Building Number *</Label>
                                <Input
                                  id="buildingNumber"
                                  value={newCustomer.buildingNumber}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, buildingNumber: e.target.value })}
                                  placeholder="1234"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="additionalNumber">Additional Number</Label>
                                <Input
                                  id="additionalNumber"
                                  value={newCustomer.additionalNumber}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, additionalNumber: e.target.value })}
                                  placeholder="5678"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code *</Label>
                                <Input
                                  id="postalCode"
                                  value={newCustomer.postalCode}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, postalCode: e.target.value })}
                                  placeholder="12345"
                                  maxLength={5}
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 mt-4">
                              <div className="space-y-2">
                                <Label htmlFor="streetName">Street Name *</Label>
                                <Input
                                  id="streetName"
                                  value={newCustomer.streetName}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, streetName: e.target.value })}
                                  placeholder="King Fahd Road"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="district">District *</Label>
                                <Input
                                  id="district"
                                  value={newCustomer.district}
                                  onChange={(e) => setNewCustomer({ ...newCustomer, district: e.target.value })}
                                  placeholder="Al Olaya"
                                />
                              </div>
                            </div>
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="city">City *</Label>
                              <Input
                                id="city"
                                value={newCustomer.city}
                                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                                placeholder="Riyadh"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={handleAddCustomer}>
                            Add Customer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value="INV-2026-00126"
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
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
                    
                    <div className="grid gap-4 md:grid-cols-7">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Product/Service *</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => {
                            updateItem(index, "productId", value);
                            updateItem(index, "productName", "HP LaserJet Printer");
                            updateItem(index, "unitPrice", 1500);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">HP LaserJet Printer</SelectItem>
                            <SelectItem value="2">Office Chair Executive</SelectItem>
                            <SelectItem value="3">Whiteboard Markers</SelectItem>
                            <SelectItem value="4">A4 Paper Ream</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Discount %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>VAT Amount</Label>
                        <Input
                          value={`SAR ${item.taxAmount.toFixed(2)}`}
                          disabled
                          className="bg-muted font-medium"
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
                    
                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">SAR {(item.quantity * item.unitPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax ({item.taxRate}%):</span>
                        <span className="font-medium">SAR {item.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium">SAR {((item.quantity * item.unitPrice * item.discount) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t">
                <div className="max-w-md ml-auto space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">SAR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-destructive">-SAR {totals.discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (VAT {SAUDI_VAT_RATE}%):</span>
                    <span className="font-medium">SAR {totals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span>Total Amount:</span>
                    <span className="text-primary">SAR {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional notes or terms..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}