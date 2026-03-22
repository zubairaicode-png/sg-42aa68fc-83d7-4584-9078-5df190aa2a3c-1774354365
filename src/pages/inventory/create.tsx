import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@/lib/constants";
import { productService } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";

interface ProductFormData {
  product_code: string;
  name: string;
  name_ar: string;
  description: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  max_stock_level: number;
  taxable: boolean;
  barcode: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = router.query;
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    product_code: "",
    name: "",
    name_ar: "",
    description: "",
    category: "",
    unit: "pcs",
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    reorder_level: 0,
    max_stock_level: 0,
    taxable: true,
    barcode: "",
  });

  useEffect(() => {
    if (isEditMode && typeof id === "string") {
      loadProduct(id);
    }
  }, [id, isEditMode]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const product = await productService.getById(productId);
      if (product) {
        setFormData({
          product_code: product.product_code || "",
          name: product.name || "",
          name_ar: product.name_ar || "",
          description: product.description || "",
          category: product.category || "",
          unit: product.unit || "pcs",
          cost_price: product.cost_price || 0,
          selling_price: product.selling_price || 0,
          stock_quantity: product.stock_quantity || 0,
          reorder_level: product.reorder_level || 0,
          max_stock_level: product.max_stock_level || 0,
          taxable: product.taxable ?? true,
          barcode: product.barcode || "",
        });
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.product_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Product code is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode && typeof id === "string") {
        // Update existing product
        await productService.update(id, formData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        // Create new product
        await productService.create(formData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }
      
      router.push("/inventory");
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const margin = formData.selling_price > 0 
    ? (((formData.selling_price - formData.cost_price) / formData.selling_price) * 100).toFixed(2)
    : "0";

  if (loading && isEditMode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-semibold">Loading product...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO 
        title={`${isEditMode ? "Edit" : "Add"} Product - Saudi ERP System`}
        description={`${isEditMode ? "Edit" : "Add new"} product to inventory`}
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/inventory">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">
                  {isEditMode ? "Edit Product" : "Add New Product"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isEditMode ? "Update product details" : "Enter product details"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/inventory">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : isEditMode ? "Update Product" : "Save Product"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product_code">SKU / Product Code *</Label>
                  <Input
                    id="product_code"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    placeholder="e.g., PRN-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name (English) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., HP LaserJet Printer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_ar">Product Name (Arabic)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="اسم المنتج بالعربي"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measure *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description and specifications"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price (SAR) *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price (SAR) *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profit Margin</Label>
                  <Input
                    value={`${margin}%`}
                    disabled
                    className="bg-muted font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="taxable"
                  checked={formData.taxable}
                  onCheckedChange={(checked) => setFormData({ ...formData, taxable: checked })}
                />
                <Label htmlFor="taxable" className="cursor-pointer">
                  Subject to VAT (15%)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Current Stock *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Minimum Stock Level *</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_stock_level">Maximum Stock Level *</Label>
                  <Input
                    id="max_stock_level"
                    type="number"
                    min="0"
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Maximum inventory capacity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}