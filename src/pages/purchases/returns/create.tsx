import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { purchaseReturnService } from "@/services/purchaseReturnService";
import { supplierService } from "@/services/supplierService";
import { productService } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";

export default function CreatePurchaseReturn() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    supplier_id: "",
    return_date: new Date().toISOString().split('T')[0],
    reason: "",
    status: "draft",
  });
  
  const [items, setItems] = useState<any[]>([
    { product_id: "", quantity: 1, unit_price: 0, reason: "" }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppData, prodData] = await Promise.all([
        supplierService.getAll(),
        productService.getAll()
      ]);
      setSuppliers(suppData);
      setProducts(prodData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load initial data", variant: "destructive" });
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0, reason: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.cost_price || 0;
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      toast({ title: "Validation Error", description: "Please select a supplier", variant: "destructive" });
      return;
    }
    
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one valid item", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const total_amount = calculateTotal();
      
      const returnData = {
        ...formData,
        return_number: `RET-${Date.now()}`,
        total_amount,
      };
      
      await purchaseReturnService.create(returnData as any, validItems as any);
      
      toast({ title: "Success", description: "Purchase return created successfully" });
      router.push("/purchases/returns");
    } catch (error) {
      toast({ title: "Error", description: "Failed to create return", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="New Purchase Return - Saudi ERP" description="Create a return to supplier" />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => router.push("/purchases/returns")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-heading">New Purchase Return</h1>
                <p className="text-muted-foreground">Create a return to supplier</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" /> {isSubmitting ? "Saving..." : "Save Return"}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Return Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={formData.supplier_id} onValueChange={v => setFormData({...formData, supplier_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Return Date *</Label>
                  <Input 
                    type="date" 
                    value={formData.return_date} 
                    onChange={e => setFormData({...formData, return_date: e.target.value})} 
                    required 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Return</Label>
                  <Input 
                    placeholder="E.g., Damaged goods, wrong items..." 
                    value={formData.reason} 
                    onChange={e => setFormData({...formData, reason: e.target.value})} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Returned Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3 pl-2">Product</th>
                      <th className="pb-3 pl-2 w-32">Qty</th>
                      <th className="pb-3 pl-2 w-32">Unit Price</th>
                      <th className="pb-3 pl-2">Specific Reason</th>
                      <th className="pb-3 pl-2 text-right w-32">Total</th>
                      <th className="pb-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 pr-2">
                          <Select value={item.product_id} onValueChange={v => handleItemChange(index, "product_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-2">
                          <Input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={e => handleItemChange(index, "quantity", e.target.value)} 
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={item.unit_price} 
                            onChange={e => handleItemChange(index, "unit_price", e.target.value)} 
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Input 
                            placeholder="Reason" 
                            value={item.reason} 
                            onChange={e => handleItemChange(index, "reason", e.target.value)} 
                          />
                        </td>
                        <td className="py-3 pl-2 text-right font-medium">
                          SAR {(item.quantity * item.unit_price).toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="text-xl font-bold">
                  Total Amount: <span className="text-primary">SAR {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}