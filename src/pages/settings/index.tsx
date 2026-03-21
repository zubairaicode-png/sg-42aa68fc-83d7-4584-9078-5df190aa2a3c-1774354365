import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    nameEn: "Your Company Name",
    nameAr: "اسم شركتك",
    vatNumber: "300000000000003",
    crNumber: "1010000000",
    buildingNumber: "1234",
    streetName: "King Fahd Road",
    additionalNumber: "5678",
    postalCode: "12345",
    city: "Riyadh",
    country: "Saudi Arabia",
    email: "info@company.com",
    phone: "+966 50 000 0000",
    website: "www.company.com",
    logo: ""
  });

  const handleSaveCompany = () => {
    setLoading(true);
    // Save to localStorage for now
    localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Company information has been updated successfully",
      });
    }, 1000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo({ ...companyInfo, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <SEO 
        title="Settings - ERP System"
        description="Configure your company settings and preferences"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your company information and system preferences</p>
          </div>

          <Tabs defaultValue="company" className="space-y-6">
            <TabsList>
              <TabsTrigger value="company">Company Information</TabsTrigger>
              <TabsTrigger value="invoice">Invoice Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    This information will appear on all your invoices and documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {companyInfo.logo ? (
                        <img src={companyInfo.logo} alt="Company Logo" className="h-20 w-20 object-contain border rounded" />
                      ) : (
                        <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                          <Upload className="h-8 w-8" />
                        </div>
                      )}
                      <div>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="max-w-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload your company logo (PNG, JPG, SVG)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Names */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nameEn">Company Name (English) *</Label>
                      <Input
                        id="nameEn"
                        value={companyInfo.nameEn}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, nameEn: e.target.value })}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameAr">Company Name (Arabic) *</Label>
                      <Input
                        id="nameAr"
                        value={companyInfo.nameAr}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, nameAr: e.target.value })}
                        placeholder="اسم شركتك"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* ZATCA Required Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">VAT Number (الرقم الضريبي) *</Label>
                      <Input
                        id="vatNumber"
                        value={companyInfo.vatNumber}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, vatNumber: e.target.value })}
                        placeholder="300000000000003"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground">15-digit VAT registration number</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crNumber">CR Number (رقم السجل التجاري) *</Label>
                      <Input
                        id="crNumber"
                        value={companyInfo.crNumber}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, crNumber: e.target.value })}
                        placeholder="1010000000"
                      />
                      <p className="text-xs text-muted-foreground">Commercial Registration Number</p>
                    </div>
                  </div>

                  {/* National Address (ZATCA Phase 2) */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">National Address (العنوان الوطني)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="buildingNumber">Building Number (رقم المبنى) *</Label>
                        <Input
                          id="buildingNumber"
                          value={companyInfo.buildingNumber}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, buildingNumber: e.target.value })}
                          placeholder="1234"
                          maxLength={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="streetName">Street Name (اسم الشارع) *</Label>
                        <Input
                          id="streetName"
                          value={companyInfo.streetName}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, streetName: e.target.value })}
                          placeholder="King Fahd Road"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="additionalNumber">Additional Number (الرقم الإضافي) *</Label>
                        <Input
                          id="additionalNumber"
                          value={companyInfo.additionalNumber}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, additionalNumber: e.target.value })}
                          placeholder="5678"
                          maxLength={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code (الرمز البريدي) *</Label>
                        <Input
                          id="postalCode"
                          value={companyInfo.postalCode}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                          placeholder="12345"
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City (المدينة) *</Label>
                        <Input
                          id="city"
                          value={companyInfo.city}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                          placeholder="Riyadh"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={companyInfo.country}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                          placeholder="Saudi Arabia"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                        placeholder="info@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                        placeholder="+966 50 000 0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                        placeholder="www.company.com"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveCompany} disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoice">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Settings</CardTitle>
                  <CardDescription>
                    Customize your invoice template and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      defaultValue="INV"
                      placeholder="INV"
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: INV-2024-00001
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceTerms">Default Payment Terms</Label>
                    <Textarea
                      id="invoiceTerms"
                      defaultValue="Payment is due within 30 days from the invoice date."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceNotes">Invoice Footer Notes</Label>
                    <Textarea
                      id="invoiceNotes"
                      defaultValue="Thank you for your business!"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}