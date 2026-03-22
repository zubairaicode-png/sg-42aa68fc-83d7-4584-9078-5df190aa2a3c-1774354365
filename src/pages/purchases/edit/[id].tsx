import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  id?: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
}

export default function EditPurchaseInvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    supplier_vat: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    payment_status: "unpaid" as "paid" | "unpaid" | "pending" | "overdue",
    notes: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      product_code: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      tax_rate: 15,
      line_total: 0,
    },
  ]);

  useEffect(() => {
    if (id) {
      loadInvoice(id as string);
    }
    loadSuppliers();
    loadProducts();
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select(`
          *,
          items:purchase_invoice_items(*)
        `)
        .eq("id", invoiceId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          supplier_id: data.supplier_id || "",
          supplier_name: data.supplier_name || "",
          supplier_vat: data.supplier_vat || "",
          invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
          due_date: data.due_date || new Date().toISOString().split('T')[0],
          payment_status: (data.payment_status as "paid" | "unpaid" | "pending" | "overdue") || "unpaid",
          notes: data.notes || "",
        });

        if (data.items && data.items.length > 0) {
          setItems(data.items.map((item: any) => ({
            id: item.id,
            product_code: item.product_code || "",
            product_name: item.product_name || "",
            quantity: parseFloat(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            discount_amount: parseFloat(item.discount_amount) || 0,
            tax_rate: parseFloat(item.tax_rate) || 15,
            line_total: parseFloat(item.line_total) || 0,
          })));
        }
      }
    } catch (error: any) {
      console.error("Error loading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error loading products:", error);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setFormData({
        ...formData,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        supplier_vat: supplier.vat_number || "",
      });
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_code: product.code || "",
        product_name: product.name || "",
        unit_price: parseFloat(product.price) || 0,
      };
      calculateLineTotal(index, newItems);
      setItems(newItems);
    }
  };

  const calculateLineTotal = (index: number, itemsList: InvoiceItem[]) => {
    const item = itemsList[index];
    const subtotal = (item.quantity * item.unit_price) - item.discount_amount;
    const taxAmount = subtotal * (item.tax_rate / 100);
    itemsList[index].line_total = subtotal + taxAmount;
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    calculateLineTotal(index, newItems);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_code: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        tax_rate: 15,
        line_total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + ((item.quantity * item.unit_price) - item.discount_amount);
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const itemSubtotal = (item.quantity * item.unit_price) - item.discount_amount;
      return sum + (itemSubtotal * (item.tax_rate / 100));
    }, 0);

    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0 || !items[0].product_name) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const totals = calculateTotals();

      // Update the invoice
      const { error: invoiceError } = await supabase
        .from("purchase_invoices")
        .update({
          supplier_id: formData.supplier_id,
          supplier_name: formData.supplier_name,
          supplier_vat: formData.supplier_vat,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          payment_status: formData.payment_status,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id as string);

      if (invoiceError) throw invoiceError;

      // Delete old items
      const { error: deleteError } = await supabase
        .from("purchase_invoice_items")
        .delete()
        .eq("invoice_id", id as string);

      if (deleteError) throw deleteError;

      // Insert new items
      const itemsToInsert = items.map(item => ({
        invoice_id: id as string,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        tax_rate: item.tax_rate,
        tax_amount: (item.quantity * item.unit_price - item.discount_amount) * (item.tax_rate / 100),
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Purchase invoice updated successfully",
      });

      router.push("/purchases");
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (loading && !formData.supplier_id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO title="Edit Purchase Invoice - Saudi ERP System" />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/purchases">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Edit Purchase Invoice</h1>
                <p className="text-muted-foreground mt-1">Update invoice details</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/purchases">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Updating..." : "Update Invoice"}
              </Button>
            </div>
          </div>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_vat">Supplier VAT Number</Label>
                  <Input
                    id="supplier_vat"
                    value={formData.supplier_vat}
                    disabled
                    placeholder="Auto-filled from supplier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select 
                    value={formData.payment_status} 
                    onValueChange={(value: any) => setFormData({ ...formData, payment_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Items</CardTitle>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select 
                          value={item.product_code} 
                          onValueChange={(value) => handleProductChange(index, value)}
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
                        <Label>Product Name</Label>
                        <Input
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, "product_name", e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Price (SAR)</Label>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Discount (SAR)</Label>
                        <Input
                          type="number"
                          value={item.discount_amount}
                          onChange={(e) => handleItemChange(index, "discount_amount", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>VAT Rate (%)</Label>
                        <Input
                          type="number"
                          value={item.tax_rate}
                          onChange={(e) => handleItemChange(index, "tax_rate", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Line Total (SAR)</Label>
                        <Input
                          value={item.line_total.toFixed(2)}
                          disabled
                          className="font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md ml-auto">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{totals.subtotal.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>VAT (15%):</span>
                  <span className="font-semibold">{totals.taxAmount.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">{totals.total.toFixed(2)} SAR</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}