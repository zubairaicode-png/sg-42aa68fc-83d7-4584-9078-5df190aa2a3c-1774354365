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
import { toast } from "@/sonnerie";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const products: Product[] = [
    {
      id: "1",
      sku: "PRN-001",
      name: "HP LaserJet Printer",
      category: "Electronics",
      unit: "pcs",
      costPrice: 1200,
      sellingPrice: 1500,
      stock: 15,
      minStock: 10,
      maxStock: 50,
      taxable: true,
      createdAt: "2026-03-01T10:00:00Z",
    },
    {
      id: "2",
      sku: "FUR-045",
      name: "Office Chair Executive",
      category: "Office Supplies",
      unit: "pcs",
      costPrice: 350,
      sellingPrice: 480,
      stock: 8,
      minStock: 15,
      maxStock: 40,
      taxable: true,
      createdAt: "2026-03-05T14:30:00Z",
    },
    {
      id: "3",
      sku: "STA-012",
      name: "Whiteboard Markers Set",
      category: "Office Supplies",
      unit: "pack",
      costPrice: 25,
      sellingPrice: 35,
      stock: 45,
      minStock: 50,
      maxStock: 200,
      taxable: true,
      createdAt: "2026-03-10T09:15:00Z",
    },
    {
      id: "4",
      sku: "STA-001",
      name: "A4 Paper Ream",
      category: "Office Supplies",
      unit: "box",
      costPrice: 18,
      sellingPrice: 25,
      stock: 120,
      minStock: 30,
      maxStock: 300,
      taxable: true,
      createdAt: "2026-02-15T11:20:00Z",
    },
  ];

  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
    lowStockItems: products.filter(p => p.stock <= p.minStock).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: "Out of Stock", color: "text-destructive bg-destructive/10" };
    if (product.stock <= product.minStock) return { label: "Low Stock", color: "text-warning bg-warning/10" };
    if (product.stock >= product.maxStock) return { label: "Overstock", color: "text-muted-foreground bg-muted" };
    return { label: "In Stock", color: "text-success bg-success/10" };
  };

  const loadProducts = async () => {
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
      
      // Import products to database
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

  const deleteProduct = async (id: string) => {
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
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-table-header">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">SKU</th>
                        <th className="text-left p-4 font-semibold text-sm">Product Name</th>
                        <th className="text-left p-4 font-semibold text-sm">Category</th>
                        <th className="text-right p-4 font-semibold text-sm">Stock</th>
                        <th className="text-right p-4 font-semibold text-sm">Min/Max</th>
                        <th className="text-right p-4 font-semibold text-sm">Cost Price</th>
                        <th className="text-right p-4 font-semibold text-sm">Selling Price</th>
                        <th className="text-center p-4 font-semibold text-sm">Status</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const status = getStockStatus(product);
                        return (
                          <tr key={product.id} className="border-t hover:bg-table-row-hover transition-colors">
                            <td className="p-4 font-medium">{product.sku}</td>
                            <td className="p-4">{product.name}</td>
                            <td className="p-4 text-sm">{product.category}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {product.stock <= product.minStock && (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                )}
                                <span className="font-semibold">{product.stock}</span>
                                <span className="text-muted-foreground text-sm">{product.unit}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right text-sm text-muted-foreground">
                              {product.minStock} / {product.maxStock}
                            </td>
                            <td className="p-4 text-right">SAR {product.costPrice.toLocaleString()}</td>
                            <td className="p-4 text-right font-semibold">SAR {product.sellingPrice.toLocaleString()}</td>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Package className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}