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
import { customerService } from "@/services/customerService";

export default function CreateCustomerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerNumber: "",
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
    unitNumber: "",
    shortAddress: "",
    address: "",
    country: "Saudi Arabia",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    try {
      const customer = await customerService.getById(customerId);
      if (customer) {
        setFormData({
          customerNumber: customer.customer_number || "",
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          vatNumber: customer.vat_number || "",
          buildingNumber: customer.building_number || "",
          additionalNumber: customer.additional_number || "",
          streetName: customer.street_name || "",
          district: customer.district || "",
          city: customer.city || "",
          postalCode: customer.postal_code || "",
          unitNumber: customer.unit_number || "",
          shortAddress: customer.short_address || "",
          address: customer.address || "",
          country: customer.country || "Saudi Arabia",
          status: (customer.status as "active" | "inactive") || "active",
        });
      }
    } catch (error) {
      console.error("Error loading customer:", error);
      alert("Failed to load customer");
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
      const customerData = {
        customer_number: formData.customerNumber || `CUST-${Math.floor(Math.random() * 100000)}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vat_number: formData.vatNumber || null,
        building_number: formData.buildingNumber || null,
        additional_number: formData.additionalNumber || null,
        street_name: formData.streetName || null,
        district: formData.district || null,
        city: formData.city || null,
        postal_code: formData.postalCode || null,
        unit_number: formData.unitNumber || null,
        short_address: formData.shortAddress || null,
        address: formData.address || null,
        country: formData.country,
        status: formData.status,
      };

      if (id && typeof id === "string") {
        await customerService.update(id, customerData);
        alert("Customer updated successfully!");
      } else {
        await customerService.create(customerData);
        alert("Customer created successfully!");
      }
      
      router.push("/customers");
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={`${id ? "Edit" : "Add"} Customer - Saudi ERP System`}
        description={`${id ? "Edit" : "Add new"} customer information`}
      />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/customers">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold font-heading">{id ? "Edit" : "Add"} Customer</h1>
                <p className="text-muted-foreground mt-1">{id ? "Update" : "Create new"} customer information</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/customers">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Customer"}
              </Button>
            </div>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerNumber">Customer Number</Label>
                  <Input
                    id="customerNumber"
                    value={formData.customerNumber}
                    onChange={(e) => setFormData({ ...formData, customerNumber: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter customer name"
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
                    placeholder="customer@example.com"
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
              <CardTitle>Saudi National Address Information</CardTitle>
              <p className="text-sm text-muted-foreground">As per Saudi Post National Address format</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="buildingNumber">Building Number (رقم المبنى) *</Label>
                  <Input
                    id="buildingNumber"
                    value={formData.buildingNumber}
                    onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
                    placeholder="1234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNumber">Additional Number (الرقم الإضافي)</Label>
                  <Input
                    id="additionalNumber"
                    value={formData.additionalNumber}
                    onChange={(e) => setFormData({ ...formData, additionalNumber: e.target.value })}
                    placeholder="5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit Number (رقم الوحدة)</Label>
                  <Input
                    id="unitNumber"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="streetName">Street Name (اسم الشارع) *</Label>
                  <Input
                    id="streetName"
                    value={formData.streetName}
                    onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                    placeholder="King Fahd Road"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District (الحي) *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Al Olaya"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City (المدينة) *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Riyadh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code (الرمز البريدي) *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="12345"
                    maxLength={5}
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

              <div className="space-y-2">
                <Label htmlFor="shortAddress">Short Address (العنوان المختصر)</Label>
                <Input
                  id="shortAddress"
                  value={formData.shortAddress}
                  onChange={(e) => setFormData({ ...formData, shortAddress: e.target.value })}
                  placeholder="e.g., Near Al Faisaliah Tower"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Additional Address Notes</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Any additional address information..."
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