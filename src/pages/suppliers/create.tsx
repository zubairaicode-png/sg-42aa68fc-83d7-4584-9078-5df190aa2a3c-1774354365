import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supplierService } from "@/services/supplierService";

export default function CreateSupplierPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierNumber: "",
    name: "",
    email: "",
    phone: "",
    vatNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Saudi Arabia",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      loadSupplier(id);
    }
  }, [id]);

  const loadSupplier = async (supplierId: string) => {
    try {
      const supplier = await supplierService.getById(supplierId);
      if (supplier) {
        setFormData({
          supplierNumber: supplier.supplier_number || "",
          name: supplier.name || "",
          email: supplier.email || "",
          phone: supplier.phone || "",
          vatNumber: supplier.vat_number || "",
          address: supplier.address || "",
          city: supplier.city || "",
          postalCode: supplier.postal_code || "",
          country: supplier.country || "Saudi Arabia",
          status: (supplier.status as "active" | "inactive") || "active",
        });
      }
    } catch (error) {
      console.error("Error loading supplier:", error);
      alert("Failed to load supplier");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const supplierData = {
        supplier_number: formData.supplierNumber || `SUP-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vat_number: formData.vatNumber || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postalCode || null,
        country: formData.country,
        status: formData.status,
      };

      if (id && typeof id === "string") {
        await supplierService.update(id, supplierData);
        alert("Supplier updated successfully!");
      } else {
        await supplierService.create(supplierData);
        alert("Supplier created successfully!");
      }
      
      router.push("/suppliers");
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={`${id ? "Edit" : "Add"} Supplier - Saudi ERP System`}
        description={`${id ? "Edit" : "Add new"} supplier information`}
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/suppliers">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">{id ? "Edit" : "Add"} Supplier</h1>
                <p className="text-muted-foreground mt-1">{id ? "Update" : "Create new"} supplier information</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/suppliers">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Supplier"}
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
                  <Label htmlFor="supplierNumber">Supplier Number</Label>
                  <Input
                    id="supplierNumber"
                    value={formData.supplierNumber}
                    onChange={(e) => setFormData({ ...formData, supplierNumber: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter supplier name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="supplier@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 XX XXX XXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    placeholder="300000000000003"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter street address"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Riyadh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Saudi Arabia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}