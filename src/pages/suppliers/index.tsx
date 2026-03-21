import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { supplierService } from "@/services/supplierService";
import type { Database } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";
import { excelService } from "@/services/excelService";
import { useToast } from "@/hooks/use-toast";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await supplierService.delete(id);
        await loadSuppliers();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert("Failed to delete supplier");
      }
    }
  };

  const handleExportExcel = () => {
    try {
      excelService.exportSuppliers(suppliers as any);
      toast({ title: "Success", description: "Suppliers exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export suppliers", variant: "destructive" });
    }
  };

  const handleImportExcel = async (file: File) => {
    try {
      setLoading(true);
      const imported = await excelService.importSuppliers(file);
      for (const supplier of imported) {
        await supplierService.create(supplier as any);
      }
      toast({ title: "Success", description: `Imported ${imported.length} suppliers successfully` });
      loadSuppliers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to import suppliers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    excelService.downloadTemplate("suppliers");
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEO 
        title="Suppliers - Saudi ERP System"
        description="Manage your supplier database"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading">Suppliers</h1>
              <p className="text-muted-foreground mt-1">Manage your supplier database</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate} className="hidden sm:flex">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Label htmlFor="import-suppliers" className="cursor-pointer mb-0">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
              </Label>
              <Input
                id="import-suppliers"
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
                Export
              </Button>
              <Link href="/suppliers/create">
                <Button>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Supplier
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{suppliers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-success">
                  {suppliers.filter(s => s.status === "active").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-muted-foreground">
                  {suppliers.filter(s => s.status === "inactive").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suppliers List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Supplier Directory</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
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
                <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No suppliers found matching your search" : "No suppliers yet. Add your first supplier!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-table-header">
                        <tr>
                          <th className="text-left p-4 font-semibold text-sm">Supplier Name</th>
                          <th className="text-left p-4 font-semibold text-sm">Email</th>
                          <th className="text-left p-4 font-semibold text-sm">Phone</th>
                          <th className="text-left p-4 font-semibold text-sm">VAT Number</th>
                          <th className="text-left p-4 font-semibold text-sm">Status</th>
                          <th className="text-center p-4 font-semibold text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuppliers.map((supplier) => (
                          <tr key={supplier.id} className="border-t hover:bg-table-row-hover transition-colors">
                            <td className="p-4 font-medium">{supplier.name}</td>
                            <td className="p-4 text-sm">{supplier.email || "-"}</td>
                            <td className="p-4 text-sm">{supplier.phone || "-"}</td>
                            <td className="p-4 text-sm">{supplier.vat_number || "-"}</td>
                            <td className="p-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                supplier.status === "active" 
                                  ? "bg-success/10 text-success" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {supplier.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Link href={`/suppliers/create?id=${supplier.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(supplier.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}