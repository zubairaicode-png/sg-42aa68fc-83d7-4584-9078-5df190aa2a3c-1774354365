import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Edit, Trash2, AlertTriangle, Package, Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/types";
import Link from "next/link";
import { excelService } from "@/services/excelService";
import { useToast } from "@/hooks/use-toast";
import { productService } from "@/services/productService";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    return (
      product.product_code?.toLowerCase().includes(query) ||
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query)
    );
  });

  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0),
    lowStockItems: products.filter(p => (p.stock_quantity || 0) <= (p.reorder_level || 0)).length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length,
  };

  const getStockStatus = (product: any) => {
    const stock = product.stock_quantity || 0;
    const min = product.reorder_level || 0;
    
    if (stock === 0) return { label: "Out of Stock", color: "text-destructive bg-destructive/10" };
    if (stock <= min) return { label: "Low Stock", color: "text-warning bg-warning/10" };
    return { label: "In Stock", color: "text-success bg-success/10" };
  };

  const handleExportExcel = () => {
    try {
      excelService.exportProducts(products);
      toast({
        title: "Success",
        description: "Products exported to Excel successfully",
      });
    } catch (error) {
      console.error("Error exporting products:", error);
      toast({
        title: "Error",
        description: "Failed to export products",
        variant: "destructive",
      });
    }
  };

  const handleImportExcel = async (file: File) => {
    try {
      setLoading(true);
      const importedProducts = await excelService.importProducts(file);
      
      for (const product of importedProducts) {
        await productService.create(product as any);
      }
      
      toast({
        title: "Success",
        description: `Imported ${importedProducts.length} products successfully`,
      });
      
      loadProducts();
    } catch (error) {
      console.error("Error importing products:", error);
      toast({
        title: "Error",
        description: "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate("products");
  };

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setLoading(true);
      await productService.delete(productToDelete);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <>
      <SEO 
        title="Inventory Management - Saudi ERP System"
        description="Manage product inventory and stock levels"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Products & Services</h1>
              <p className="text-muted-foreground">Manage your inventory and services</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Label htmlFor="import-products" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                  </span>
                </Button>
              </Label>
              <Input
                id="import-products"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportExcel(file);
                }}
              />
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => router.push("/inventory/create")}>
                <Plus className="h-5 w-5 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{stats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">SAR {stats.totalValue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">{stats.lowStockItems}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-destructive">{stats.outOfStock}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Product Inventory</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No products found matching your search" : "No products yet. Add your first product to get started."}
                  </p>
                  {!searchQuery && (
                    <Button className="mt-4" onClick={() => router.push("/inventory/create")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-table-header">
                        <tr>
                          <th className="text-left p-4 font-semibold text-sm">SKU</th>
                          <th className="text-left p-4 font-semibold text-sm">Product Name</th>
                          <th className="text-left p-4 font-semibold text-sm">Category</th>
                          <th className="text-right p-4 font-semibold text-sm">Stock</th>
                          <th className="text-right p-4 font-semibold text-sm">Min Stock</th>
                          <th className="text-right p-4 font-semibold text-sm">Cost Price</th>
                          <th className="text-right p-4 font-semibold text-sm">Selling Price</th>
                          <th className="text-center p-4 font-semibold text-sm">Status</th>
                          <th className="text-center p-4 font-semibold text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => {
                          const status = getStockStatus(product);
                          return (
                            <tr key={product.id} className="border-t hover:bg-table-row-hover transition-colors">
                              <td className="p-4 font-medium">{product.product_code}</td>
                              <td className="p-4">{product.name}</td>
                              <td className="p-4 text-sm">{product.category}</td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {(product.stock_quantity || 0) <= (product.reorder_level || 0) && (
                                    <AlertTriangle className="h-4 w-4 text-warning" />
                                  )}
                                  <span className="font-semibold">{product.stock_quantity || 0}</span>
                                  <span className="text-muted-foreground text-sm">{product.unit}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right text-sm text-muted-foreground">
                                {product.reorder_level || 0}
                              </td>
                              <td className="p-4 text-right">SAR {(product.cost_price || 0).toLocaleString()}</td>
                              <td className="p-4 text-right font-semibold">SAR {(product.selling_price || 0).toLocaleString()}</td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "inline-block px-3 py-1 rounded-full text-xs font-medium",
                                  status.color
                                )}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => router.push(`/inventory/create?id=${product.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => confirmDelete(product.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}