import { useState, useEffect } from "react";
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
import { customerService } from "@/services/customerService";
import { productService } from "@/services/productService";
import { quotationService, type CreateQuotationData } from "@/services/quotationService";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";

interface QuotationItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_amount: number;
  total_amount: number;
}

export default function CreateQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    vatNumber: "",
  });

  const [formData, setFormData] = useState({
    customer_id: "",
    quotation_date: new Date().toISOString().split("T")[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "draft",
    notes: "",
    discount_amount: 0,
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      vat_rate: SAUDI_VAT_RATE,
      discount_amount: 0,
      total_amount: 0,
    },
  ]);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required customer fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const customer = await customerService.create({
        customer_number: `CUST-${Date.now()}`,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        vat_number: newCustomer.vatNumber,
        address: "",
        city: "",
        country: "Saudi Arabia",
      });

      setFormData({ ...formData, customer_id: customer.id });
      setCustomers([...customers, customer]);
      setNewCustomer({ name: "", email: "", phone: "", vatNumber: "" });
      setIsCustomerDialogOpen(false);

      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: SAUDI_VAT_RATE,
        discount_amount: 0,
        total_amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = product.selling_price || 0;
        newItems[index].vat_rate = product.vat_rate || SAUDI_VAT_RATE;
      }
    }
    
    // Calculate totals
    const item = newItems[index];
    const subtotal = item.quantity * item.unit_price;
    const afterDiscount = subtotal - item.discount_amount;
    const vatAmount = afterDiscount * (item.vat_rate / 100);
    item.total_amount = afterDiscount + vatAmount;
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalDiscount = formData.discount_amount + items.reduce((sum, item) => sum + item.discount_amount, 0);
    const vatAmount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price - item.discount_amount;
      return sum + (itemSubtotal * item.vat_rate / 100);
    }, 0);
    const total = subtotal - totalDiscount + vatAmount;

    return { subtotal, totalDiscount, vatAmount, total };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0 || !items[0].product_id) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const quotationData: CreateQuotationData = {
        customer_id: formData.customer_id,
        quotation_date: formData.quotation_date,
        valid_until: formData.valid_until,
        status: formData.status,
        notes: formData.notes,
        discount_amount: formData.discount_amount,
        vat_amount: totals.vatAmount,
        items: items.map((item) => ({
          product_id: item.product_id,
          description: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          discount_amount: item.discount_amount,
        })),
      };

      await quotationService.create(quotationData);

      toast({
        title: "Success",
        description: "Quotation created successfully",
      });

      router.push("/quotations");
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Create Quotation - Saudi ERP System"
        description="Create a new sales quotation"
      />
      <AuthGuard>
        <DashboardLayout>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/quotations">
                  <Button type="button" variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold font-heading">Create Quotation</h1>
                  <p className="text-muted-foreground mt-1">Fill in the details below</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/quotations">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Quotation"}
                </Button>
              </div>
            </div>

            {/* Quotation Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.customer_id}
                        onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                      >
                        <SelectTrigger id="customer" className="flex-1">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
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
                              <Label htmlFor="customerVat">VAT Number (Optional)</Label>
                              <Input
                                id="customerVat"
                                value={newCustomer.vatNumber}
                                onChange={(e) => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
                                placeholder="3XXXXXXXXXX003"
                              />
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quotation_date">Quotation Date *</Label>
                    <Input
                      id="quotation_date"
                      type="date"
                      value={formData.quotation_date}
                      onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Valid Until *</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotation Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quotation Items</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium">Item {index + 1}</span>
                        {items.length > 1 && (
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
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, "product_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
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
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Discount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount_amount}
                            onChange={(e) => updateItem(index, "discount_amount", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>VAT ({item.vat_rate}%)</Label>
                          <Input
                            value={`SAR ${((item.quantity * item.unit_price - item.discount_amount) * item.vat_rate / 100).toFixed(2)}`}
                            disabled
                            className="bg-muted font-medium"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <Input
                            value={`SAR ${item.total_amount.toFixed(2)}`}
                            disabled
                            className="bg-muted font-semibold"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">SAR {(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax ({item.vat_rate}%):</span>
                          <span className="font-medium">SAR {((item.quantity * item.unit_price - item.discount_amount) * item.vat_rate / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-medium">SAR {item.discount_amount.toFixed(2)}</span>
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
                      <Label htmlFor="discount">Overall Discount:</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                        className="w-32 h-8 text-right"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Discount:</span>
                      <span className="font-medium text-destructive">-SAR {totals.totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (VAT):</span>
                      <span className="font-medium">SAR {totals.vatAmount.toFixed(2)}</span>
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
      </AuthGuard>
    </>
  );
}