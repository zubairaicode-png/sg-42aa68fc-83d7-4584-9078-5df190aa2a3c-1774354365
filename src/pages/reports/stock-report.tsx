import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Download, Printer, AlertTriangle } from "lucide-react";
import type { Product } from "@/types";

interface StockSummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function StockReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<StockSummary>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const productsData = localStorage.getItem("products");
    const productsList: Product[] = productsData ? JSON.parse(productsData) : [];
    setProducts(productsList);

    const totalValue = productsList.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    const lowStock = productsList.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStock = productsList.filter(p => p.stock === 0).length;

    setSummary({
      totalProducts: productsList.length,
      totalValue,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = filteredProducts.filter(p => p.stock === 0);

  return (
    <>
      <SEO 
        title="Stock Report - Reports"
        description="View inventory stock levels and valuation"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
                <Package className="h-8 w-8" />
                Stock Report
              </h1>
              <p className="text-muted-foreground mt-1">تقرير المخزون - Inventory valuation and levels</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 no-print">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.totalProducts}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total Stock Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  SAR {summary.totalValue.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{summary.lowStockCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{summary.outOfStockCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="no-print">
            <CardHeader>
              <CardTitle>Search Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="search">Search by name or SKU</Label>
                <Input
                  id="search"
                  placeholder="Enter product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="print-full-width">
            <CardHeader className="print-header">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Stock Valuation Report</h2>
                <p className="text-sm text-muted-foreground">تقرير تقييم المخزون</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated on: {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Stock</TabsTrigger>
                  <TabsTrigger value="low">Low Stock</TabsTrigger>
                  <TabsTrigger value="out">Out of Stock</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Unit Price (SAR)</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Min. Stock</TableHead>
                          <TableHead className="text-right">Stock Value (SAR)</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No products found
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {filteredProducts.map((product) => {
                              const stockValue = product.stock * product.costPrice;
                              const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                              const isOutOfStock = product.stock === 0;

                              return (
                                <TableRow key={product.id}>
                                  <TableCell className="font-medium">{product.sku}</TableCell>
                                  <TableCell>{product.name}</TableCell>
                                  <TableCell>
                                    <span className="px-2 py-1 rounded text-xs bg-muted">
                                      {product.category}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">{product.costPrice.toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-medium">{product.stock}</TableCell>
                                  <TableCell className="text-right">{product.minStock}</TableCell>
                                  <TableCell className="text-right font-semibold">{stockValue.toFixed(2)}</TableCell>
                                  <TableCell>
                                    {isOutOfStock ? (
                                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                                        <AlertTriangle className="h-3 w-3" />
                                        Out of Stock
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">
                                        <AlertTriangle className="h-3 w-3" />
                                        Low Stock
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                        In Stock
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="font-bold bg-muted">
                              <TableCell colSpan={6}>Total Stock Value</TableCell>
                              <TableCell className="text-right text-lg">{summary.totalValue.toFixed(2)}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="low">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="text-right">Current Stock</TableHead>
                          <TableHead className="text-right">Minimum Stock</TableHead>
                          <TableHead className="text-right">Reorder Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No low stock products
                            </TableCell>
                          </TableRow>
                        ) : (
                          lowStockProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.sku}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="text-right text-yellow-600 font-bold">{product.stock}</TableCell>
                              <TableCell className="text-right">{product.minStock}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {product.minStock - product.stock + 20}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="out">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Unit Price (SAR)</TableHead>
                          <TableHead className="text-right">Suggested Reorder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outOfStockProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No out of stock products
                            </TableCell>
                          </TableRow>
                        ) : (
                          outOfStockProducts.map((product) => (
                            <TableRow key={product.id} className="bg-red-50">
                              <TableCell className="font-medium">{product.sku}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell className="text-right">{product.costPrice.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {product.minStock + 20}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100%;
            box-shadow: none;
            border: none;
          }
          .print-header {
            border-bottom: 2px solid #000;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
}