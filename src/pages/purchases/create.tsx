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
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { SaudiRiyalIcon } from "@/components/icons/SaudiRiyalIcon";
import { useToast } from "@/hooks/use-toast";
import { purchaseService } from "@/services/purchaseService";
import { supplierService } from "@/services/supplierService";
import { productService } from "@/services/productService";
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceItem } from "@/types";

interface PurchaseFormData {
  supplierId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  paid_amount: number;
  payment_method: string;
  payment_notes: string;
}

export default function CreatePurchaseInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [addingProductToIndex, setAddingProductToIndex] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, code: "" });
  const [newSupplier, setNewSupplier] = useState({
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
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplierId: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
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
    paid_amount: 0,
    payment_method: "",
    payment_notes: "",
  });

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
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
        const newItems = [...formData.items];
        const index = addingProductToIndex;
        newItems[index] = {
          ...newItems[index],
          productId: createdProduct.id,
          productName: createdProduct.name,
          unitPrice: createdProduct.cost_price || 0,
        };
        const item = newItems[index];
        const subtotal = item.quantity * item.unitPrice;
        const discountAmount = (subtotal * item.discount) / 100;
        const taxableAmount = subtotal - discountAmount;
        item.taxAmount = (taxableAmount * item.taxRate) / 100;
        item.total = taxableAmount + item.taxAmount;
        
        setFormData({ ...formData, items: newItems });
      }
      
      setNewProduct({ name: "", price: 0, code: "" });
      setIsProductDialogOpen(false);
      setAddingProductToIndex(null);
      toast({ title: "Success", description: "Product added successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add product", variant: "destructive" });
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.email || !newSupplier.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required supplier fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await supplierService.create({
        supplier_number: `SUP-${Date.now()}`,
        name: newSupplier.name,
        email: newSupplier.email,
        phone: newSupplier.phone,
        vat_number: newSupplier.vatNumber || null,
        address: [newSupplier.buildingNumber, newSupplier.streetName, newSupplier.district, newSupplier.postalCode].filter(Boolean).join(", ") || null,
        city: newSupplier.city || null,
        country: "Saudi Arabia",
        status: "active",
      });

      await loadSuppliers();
      
      setNewSupplier({ 
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
      
      setIsSupplierDialogOpen(false);

      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
    } catch (error: any) {
      console.error("Error adding supplier:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add supplier",
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
    
    console.log("=== PURCHASE INVOICE SAVE STARTED ===");
    console.log("Form Data:", formData);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Current user:", user);
    console.log("Auth error:", authError);
    
    if (!user) {
      console.log("ERROR: User not authenticated");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create purchase invoices",
        variant: "destructive",
      });
      return;
    }
    
    console.log("User authenticated:", user.email);
    console.log("Suppliers Array:", suppliers);
    console.log("Selected Supplier ID:", formData.supplierId);
    
    // Validation
    if (!formData.supplierId) {
      console.log("ERROR: No supplier selected");
      toast({
        title: "Validation Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date || !formData.dueDate) {
      console.log("ERROR: Missing dates");
      toast({
        title: "Validation Error",
        description: "Please fill in invoice date and due date",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0) {
      console.log("ERROR: No items");
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    // Validate all items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      console.log(`Validating item ${i + 1}:`, item);
      
      if (!item.productName.trim()) {
        console.log(`ERROR: Item ${i + 1} has no product name`);
        toast({
          title: "Validation Error",
          description: `Please enter product name for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (item.quantity <= 0) {
        console.log(`ERROR: Item ${i + 1} has invalid quantity`);
        toast({
          title: "Validation Error",
          description: `Please enter valid quantity for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (item.unitPrice <= 0) {
        console.log(`ERROR: Item ${i + 1} has invalid unit price`);
        toast({
          title: "Validation Error",
          description: `Please enter valid unit price for item ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate payment amount
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

    console.log("All validations passed!");

    try {
      setLoading(true);

      // Get supplier info from loaded suppliers
      const supplier = suppliers.find(s => s.id === formData.supplierId);
      console.log("Supplier found:", supplier);
      
      if (!supplier) {
        console.log("ERROR: Supplier not found in suppliers array");
        throw new Error("Supplier not found");
      }

      const supplierName = supplier.name;
      const supplierVat = supplier.vat_number || "";
      console.log("Supplier Name:", supplierName);
      console.log("Supplier VAT:", supplierVat);

      // Generate invoice number (in production, this should come from backend)
      const invoiceNumber = `PINV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      console.log("Generated Invoice Number:", invoiceNumber);

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

      // Prepare purchase invoice data
      const purchaseData = {
        supplier_id: formData.supplierId,
        supplier_name: supplierName,
        supplier_vat: supplierVat,
        invoice_number: invoiceNumber,
        invoice_date: formData.date,
        due_date: formData.dueDate,
        subtotal: totals.subtotal,
        total_amount: totals.total,
        tax_amount: totals.taxAmount,
        paid_amount: paidAmount,
        payment_status: paymentStatus,
        notes: formData.notes || null,
      };

      // Prepare items data
      const itemsData = formData.items.map(item => ({
        product_id: item.productId || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        line_total: item.total,
        discount_amount: (item.quantity * item.unitPrice * item.discount) / 100,
        discount_percentage: item.discount,
      }));

      console.log("Purchase invoice data to save:", { purchaseData, itemsData });

      // Save to database using Supabase
      console.log("Calling purchaseService.createInvoice...");
      const result = await purchaseService.createInvoice(purchaseData, itemsData);
      console.log("Purchase invoice created successfully:", result);

      toast({
        title: "Success",
        description: "Purchase invoice created successfully",
      });

      console.log("Redirecting to /purchases");
      router.push("/purchases");
    } catch (error: any) {
      console.error("=== ERROR SAVING PURCHASE INVOICE ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast({
        title: "Error",
        description: error.message || "Failed to save purchase invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("=== PURCHASE INVOICE SAVE ENDED ===");
    }
  };

  return (
    <>
      <SEO 
        title="Create Purchase Invoice - Saudi ERP System"
        description="Create a new purchase invoice"
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/purchases">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">Create Purchase Invoice</h1>
                <p className="text-muted-foreground mt-1">Record supplier invoice</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/purchases">
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
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="supplier"
                        placeholder="Type to search suppliers..."
                        value={formData.supplierId ? suppliers.find(s => s.id === formData.supplierId)?.name || "" : supplierSearchQuery}
                        onChange={(e) => {
                          setSupplierSearchQuery(e.target.value);
                          setFormData({ ...formData, supplierId: "" });
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                      
                      {supplierSearchQuery && !formData.supplierId && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {suppliers
                            .filter(supplier => {
                              const query = supplierSearchQuery.toLowerCase().trim();
                              return (
                                supplier.name.toLowerCase().includes(query) ||
                                (supplier.supplier_number && supplier.supplier_number.toLowerCase().includes(query)) ||
                                (supplier.email && supplier.email.toLowerCase().includes(query)) ||
                                (supplier.phone && supplier.phone.includes(query))
                              );
                            })
                            .map((supplier) => (
                              <button
                                key={supplier.id}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                                onClick={() => {
                                  setFormData({ ...formData, supplierId: supplier.id });
                                  setSupplierSearchQuery("");
                                }}
                              >
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {supplier.supplier_number && `${supplier.supplier_number} | `}
                                  {supplier.email}
                                  {supplier.phone && ` | ${supplier.phone}`}
                                </div>
                              </button>
                            ))}
                          {suppliers.filter(supplier => {
                            const query = supplierSearchQuery.toLowerCase().trim();
                            return (
                              supplier.name.toLowerCase().includes(query) ||
                              (supplier.supplier_number && supplier.supplier_number.toLowerCase().includes(query)) ||
                              (supplier.email && supplier.email.toLowerCase().includes(query)) ||
                              (supplier.phone && supplier.phone.includes(query))
                            );
                          }).length === 0 && (
                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                              No suppliers found. Click + to add a new supplier.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Supplier</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="supplierName">Supplier Name *</Label>
                              <Input
                                id="supplierName"
                                value={newSupplier.name}
                                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                placeholder="Enter supplier name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="supplierEmail">Email *</Label>
                              <Input
                                id="supplierEmail"
                                type="email"
                                value={newSupplier.email}
                                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                placeholder="supplier@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="supplierPhone">Phone *</Label>
                              <Input
                                id="supplierPhone"
                                value={newSupplier.phone}
                                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                placeholder="+966 XX XXX XXXX"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="supplierVat">VAT Number</Label>
                              <Input
                                id="supplierVat"
                                value={newSupplier.vatNumber}
                                onChange={(e) => setNewSupplier({ ...newSupplier, vatNumber: e.target.value })}
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
                                  value={newSupplier.buildingNumber}
                                  onChange={(e) => setNewSupplier({ ...newSupplier, buildingNumber: e.target.value })}
                                  placeholder="1234"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="additionalNumber">Additional Number</Label>
                                <Input
                                  id="additionalNumber"
                                  value={newSupplier.additionalNumber}
                                  onChange={(e) => setNewSupplier({ ...newSupplier, additionalNumber: e.target.value })}
                                  placeholder="5678"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code *</Label>
                                <Input
                                  id="postalCode"
                                  value={newSupplier.postalCode}
                                  onChange={(e) => setNewSupplier({ ...newSupplier, postalCode: e.target.value })}
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
                                  value={newSupplier.streetName}
                                  onChange={(e) => setNewSupplier({ ...newSupplier, streetName: e.target.value })}
                                  placeholder="King Fahd Road"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="district">District *</Label>
                                <Input
                                  id="district"
                                  value={newSupplier.district}
                                  onChange={(e) => setNewSupplier({ ...newSupplier, district: e.target.value })}
                                  placeholder="Al Olaya"
                                />
                              </div>
                            </div>
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="city">City *</Label>
                              <Input
                                id="city"
                                value={newSupplier.city}
                                onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                                placeholder="Riyadh"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={handleAddSupplier}>
                            Add Supplier
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
                    value="PINV-2026-00046"
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
              <CardTitle>Purchase Items</CardTitle>
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
                    
                    <div className="grid gap-4 md:grid-cols-6">
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
                                {products
                                  .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                  .map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      className="w-full px-4 py-2 hover:bg-accent text-left text-sm border-b last:border-b-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const newItems = [...formData.items];
                                        newItems[index] = {
                                          ...newItems[index],
                                          productId: product.id,
                                          productName: product.name,
                                          unitPrice: product.cost_price || 0,
                                        };
                                        const i = newItems[index];
                                        const subtotal = i.quantity * i.unitPrice;
                                        const discountAmount = (subtotal * i.discount) / 100;
                                        const taxableAmount = subtotal - discountAmount;
                                        i.taxAmount = (taxableAmount * i.taxRate) / 100;
                                        i.total = taxableAmount + i.taxAmount;
                                        setFormData({ ...formData, items: newItems });
                                        setSelectedItemIndex(null);
                                      }}
                                    >
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Code: {product.product_code} | Stock: {product.stock_quantity}
                                      </div>
                                    </button>
                                  ))}
                                {products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                                  <div className="px-4 py-3 text-sm text-muted-foreground">
                                    No products found. Click + to add.
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
                        <Label>Total</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center gap-1 font-semibold">
                          <SaudiRiyalIcon size={14} />
                          <span>{item.total.toFixed(2)}</span>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Record payment made at the time of invoice creation (optional)
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
                    Enter 0 for unpaid invoice, or enter the amount paid to supplier
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
                <Label>Cost Price</Label>
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