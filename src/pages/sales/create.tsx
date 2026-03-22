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
import { SAUDI_VAT_RATE, formatSAR } from "@/lib/constants";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { SaudiRiyalIcon } from "@/components/icons/SaudiRiyalIcon";
import { productService } from "@/services/productService";
import { salesService } from "@/services/salesService";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceItem } from "@/types";
import type { Database } from "@/integrations/supabase/types";

interface InvoiceFormData {
  customerId: string;
  po_number: string;
  payment_type: "cash" | "bank" | "cheque" | "card";
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  paid_amount: number;
  payment_method: string;
  payment_notes: string;
}

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [products, setProducts] = useState<Database["public"]["Tables"]["products"]["Row"][]>([]);
  const [customers, setCustomers] = useState<Database["public"]["Tables"]["customers"]["Row"][]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [addingProductToIndex, setAddingProductToIndex] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, code: "" });
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
    po_number: "",
    payment_type: "cash",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    items: [
      {
        productId: "",
        productName: "",
        serialNumber: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: SAUDI_VAT_RATE,
        taxAmount: 0,
        discount: 0,
        total: 0,
      },
    ],
    notes: "",
    paid_amount: 0,
    payment_method: "",
    payment_notes: "",
  });
  const [isManualInvoice, setIsManualInvoice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) {
      toast({ title: "Validation Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    try {
      const productData = {
        name: newProduct.name,
        product_code: newProduct.code || `PRD-${Date.now()}`,
        cost_price: newProduct.price,
        selling_price: newProduct.price,
        stock_quantity: 0,
        status: "active",
      };
      const createdProduct = await productService.create(productData);
      await loadProducts();
      
      if (addingProductToIndex !== null && createdProduct) {
        selectProduct(addingProductToIndex, createdProduct);
      }
      
      setNewProduct({ name: "", price: 0, code: "" });
      setIsProductDialogOpen(false);
      setAddingProductToIndex(null);
      toast({ title: "Success", description: "Product added successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add product", variant: "destructive" });
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required customer fields (Name, Email, Phone)",
        variant: "destructive",
      });
      return;
    }

    try {
      const customerData = {
        customer_number: `CUST-${Date.now()}`,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        vat_number: newCustomer.vatNumber || null,
        building_number: newCustomer.buildingNumber || null,
        additional_number: newCustomer.additionalNumber || null,
        street_name: newCustomer.streetName || null,
        district: newCustomer.district || null,
        city: newCustomer.city || null,
        postal_code: newCustomer.postalCode || null,
        country: "Saudi Arabia",
        status: "active",
        opening_balance: 0,
      };

      const createdCustomer = await customerService.create(customerData);
      
      toast({
        title: "Success",
        description: "Customer added successfully",
      });

      // Reload customers list
      await loadCustomers();
      
      // Set the newly created customer as selected
      if (createdCustomer) {
        setFormData({ ...formData, customerId: createdCustomer.id });
      }

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
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          productName: "",
          serialNumber: "",
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
    
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    item.taxAmount = (taxableAmount * item.taxRate) / 100;
    item.total = taxableAmount + item.taxAmount;
    
    setFormData({ ...formData, items: newItems });
  };

  const selectProduct = (index: number, product: Database["public"]["Tables"]["products"]["Row"]) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      serialNumber: product.serial_number || "",
      unitPrice: product.selling_price,
    };
    
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    item.taxAmount = (taxableAmount * item.taxRate) / 100;
    item.total = taxableAmount + item.taxAmount;
    
    setFormData({ ...formData, items: newItems });
    setSelectedItemIndex(null);
    setProductSearchQuery("");
  };

  const getFilteredProducts = () => {
    if (!productSearchQuery.trim()) {
      return products;
    }
    
    const query = productSearchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.product_code && p.product_code.toLowerCase().includes(query)) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date || !formData.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in invoice date and due date",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    // Validate all items have required fields
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!isManualInvoice && !item.productId) {
        toast({
          title: "Validation Error",
          description: `Please select a product for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (isManualInvoice && !item.productName.trim()) {
        toast({
          title: "Validation Error",
          description: `Please enter description for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (item.quantity <= 0) {
        toast({
          title: "Validation Error",
          description: `Please enter valid quantity for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (item.unitPrice <= 0) {
        toast({
          title: "Validation Error",
          description: `Please enter valid unit price for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate payment amount
    const totals = calculateTotals();
    if (formData.paid_amount > totals.total) {
      toast({
        title: "Validation Error",
        description: `Paid amount (${formData.paid_amount.toFixed(2)}) cannot exceed invoice total (${totals.total.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    if (formData.paid_amount > 0 && !formData.payment_method) {
      toast({
        title: "Validation Error",
        description: "Please select a payment method when recording a payment",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get customer info from loaded customers
      const customer = customers.find(c => c.id === formData.customerId);
      const customerName = customer?.name || "Unknown Customer";
      const customerVat = customer?.vat_number || "";

      // Generate invoice number (in production, this should come from backend)
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

      // Calculate totals
      const totals = calculateTotals();

      // Calculate payment status based on paid amount
      let paymentStatus: "paid" | "unpaid" | "pending" = "unpaid";
      const paidAmount = formData.paid_amount || 0;
      
      if (paidAmount >= totals.total) {
        paymentStatus = "paid";
      } else if (paidAmount > 0) {
        paymentStatus = "pending";
      }

      // Prepare invoice data
      const invoiceData = {
        customer_id: formData.customerId,
        customer_name: customerName,
        customer_vat: customerVat,
        invoice_number: invoiceNumber,
        invoice_date: formData.date,
        due_date: formData.dueDate,
        subtotal: totals.subtotal,
        total_amount: totals.total,
        tax_amount: totals.taxAmount,
        paid_amount: paidAmount,
        status: paymentStatus,
        po_number: formData.po_number,
        payment_type: formData.payment_type,
        notes: formData.notes,
        created_by: null, // Will be set by backend if auth is implemented
      };

      // Prepare items data
      const itemsData = formData.items.map(item => ({
        product_id: item.productId && !item.productId.startsWith('manual') ? item.productId : null,
        product_name: item.productName,
        product_code: null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        total_amount: item.total,
        discount_amount: (item.quantity * item.unitPrice * item.discount) / 100,
        discount_percentage: item.discount,
      }));

      // Save to database
      await salesService.createInvoice(invoiceData, itemsData);

      toast({
        title: "Success",
        description: "Sales invoice created successfully",
      });

      router.push("/sales");
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Create Sales Invoice - Saudi ERP System"
        description="Create a new sales invoice"
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Invoice"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Information</CardTitle>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="manualInvoice"
                    checked={isManualInvoice}
                    onChange={(e) => setIsManualInvoice(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="manualInvoice" className="cursor-pointer font-normal">
                    Manual Invoice (No Stock)
                  </Label>
                </div>
              </div>
              {isManualInvoice && (
                <p className="text-sm text-muted-foreground mt-2">
                  ℹ️ Manual mode enabled: Enter custom item descriptions without stock selection. 
                  This invoice will not affect inventory levels.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="customer"
                        placeholder="Type to search customers..."
                        value={
                          formData.customerId 
                            ? customers.find(c => c.id === formData.customerId)?.name || ""
                            : ""
                        }
                        onChange={(e) => {
                          // Clear selection when typing
                          setFormData({ ...formData, customerId: "" });
                        }}
                        onFocus={(e) => {
                          e.target.select();
                        }}
                      />
                      
                      {!formData.customerId && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {customers.length > 0 ? (
                            customers
                              .filter(customer => 
                                customer.name.toLowerCase().includes(formData.customerId.toLowerCase()) ||
                                (customer.customer_number && customer.customer_number.toLowerCase().includes(formData.customerId.toLowerCase())) ||
                                (customer.email && customer.email.toLowerCase().includes(formData.customerId.toLowerCase())) ||
                                (customer.phone && customer.phone.includes(formData.customerId))
                              )
                              .map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  className="w-full px-4 py-2 hover:bg-accent text-left text-sm border-b last:border-b-0"
                                  onClick={() => {
                                    setFormData({ ...formData, customerId: customer.id });
                                  }}
                                >
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {customer.customer_number && `Code: ${customer.customer_number}`}
                                    {customer.email && ` | ${customer.email}`}
                                    {customer.phone && ` | ${customer.phone}`}
                                  </div>
                                </button>
                              ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                              No customers found. Click + to add a new customer.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
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
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                    placeholder="Enter PO number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentType">Payment Type *</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value: "cash" | "bank" | "cheque" | "card") => 
                      setFormData({ ...formData, payment_type: value })
                    }
                  >
                    <SelectTrigger id="paymentType">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="cheque">📝 Cheque</SelectItem>
                      <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      date: e.target.value,
                      dueDate: e.target.value // Set due date same as invoice date
                    })}
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
                    
                    <div className="grid gap-4 md:grid-cols-8">
                      {isManualInvoice ? (
                        <div className="md:col-span-2 space-y-2">
                          <Label>Item Description *</Label>
                          <Input
                            placeholder="Enter item description"
                            value={item.productName}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = {
                                ...newItems[index],
                                productName: e.target.value,
                                productId: `manual-${index}`,
                              };
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                      ) : (
                        <div className="md:col-span-2 space-y-2">
                          <Label>Product/Service *</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={selectedItemIndex === index ? productSearchQuery : (item.productName || "")}
                                placeholder={item.productName || "Type to search products..."}
                                onChange={(e) => {
                                  setProductSearchQuery(e.target.value);
                                  setSelectedItemIndex(index);
                                }}
                                onFocus={() => {
                                  setSelectedItemIndex(index);
                                  setProductSearchQuery("");
                                }}
                                onBlur={() => {
                                  setTimeout(() => setSelectedItemIndex(null), 200);
                                }}
                              />
                              
                              {selectedItemIndex === index && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  {getFilteredProducts().length > 0 ? (
                                    getFilteredProducts().map((product) => (
                                      <button
                                        key={product.id}
                                        type="button"
                                        className="w-full px-4 py-2 hover:bg-accent text-left text-sm border-b last:border-b-0"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          selectProduct(index, product);
                                        }}
                                      >
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Code: {product.product_code} | Stock: {product.stock_quantity}
                                          {product.serial_number && ` | S/N: ${product.serial_number}`}
                                        </div>
                                      </button>
                                    ))
                                  ) : productSearchQuery ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">
                                      No products found for "{productSearchQuery}"
                                    </div>
                                  ) : (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">
                                      <div className="font-medium mb-2">💡 Search Tips:</div>
                                      <ul className="space-y-1 text-xs">
                                        <li>• Type product name (e.g., "HP Laptop")</li>
                                        <li>• Type product code (e.g., "PRN-001")</li>
                                        <li>• Type serial number (e.g., "SN-HP-001")</li>
                                        <li>• Type description keywords</li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setAddingProductToIndex(index);
                                setIsProductDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isManualInvoice && item.serialNumber && (
                        <div className="space-y-2">
                          <Label>Serial Number</Label>
                          <Input
                            value={item.serialNumber}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      )}
                      
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
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center gap-1 font-medium">
                          <SaudiRiyalIcon size={14} />
                          <span>{item.taxAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center gap-1 font-semibold">
                          <SaudiRiyalIcon size={14} />
                          {item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium flex items-center gap-1">
                          <SaudiRiyalIcon size={12} />
                          {(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax ({item.taxRate}%):</span>
                        <span className="font-medium flex items-center gap-1">
                          <SaudiRiyalIcon size={12} />
                          {item.taxAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium flex items-center gap-1">
                          <SaudiRiyalIcon size={12} />
                          {((item.quantity * item.unitPrice * item.discount) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="max-w-md ml-auto space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium flex items-center gap-1">
                      <SaudiRiyalIcon size={14} />
                      {totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-destructive flex items-center gap-1">
                      -<SaudiRiyalIcon size={14} />
                      {totals.discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (VAT {SAUDI_VAT_RATE}%):</span>
                    <span className="font-medium flex items-center gap-1">
                      <SaudiRiyalIcon size={14} />
                      {totals.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span>Total Amount:</span>
                    <span className="text-primary flex items-center gap-1.5">
                      <SaudiRiyalIcon size={18} />
                      {totals.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-muted-foreground">Payment Type:</span>
                    <span className="font-medium capitalize">{formData.payment_type}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Record payment received at the time of invoice creation (optional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Amount Paid (SAR)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    max={totals.total}
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter 0 for unpaid invoice, or enter the amount received
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethodForPaid">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger id="paymentMethodForPaid">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="cheque">📝 Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Payment Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={formData.payment_notes}
                  onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
                  placeholder="Add notes about this payment..."
                  rows={2}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Invoice Total:</span>
                  <span className="font-semibold flex items-center gap-1">
                    <SaudiRiyalIcon size={14} />
                    {totals.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Amount Paid:</span>
                  <span className="font-semibold text-success flex items-center gap-1">
                    <SaudiRiyalIcon size={14} />
                    {formData.paid_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Amount Due:</span>
                  <span className={`font-bold text-lg flex items-center gap-1 ${
                    (totals.total - formData.paid_amount) > 0 ? 'text-destructive' : 'text-success'
                  }`}>
                    <SaudiRiyalIcon size={16} />
                    {(totals.total - formData.paid_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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

        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Add Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                  placeholder="Enter product name" 
                />
              </div>
              <div className="space-y-2">
                <Label>Product Code</Label>
                <Input 
                  value={newProduct.code} 
                  onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} 
                  placeholder="Optional (auto-generated if empty)" 
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input 
                  type="number" 
                  value={newProduct.price} 
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} 
                  placeholder="0.00" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleAddProduct}>Add Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}