import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building2, FileText, DollarSign, Palette, Loader2, Upload, Save, Receipt } from "lucide-react";
import { InvoiceLayoutDesigner, LayoutField } from "@/components/InvoiceLayoutDesigner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
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
    district: "",
    additionalNumber: "5678",
    postalCode: "12345",
    city: "Riyadh",
    country: "Saudi Arabia",
    email: "info@company.com",
    phone: "+966 50 000 0000",
    website: "www.company.com",
    logo: "",
    baseCurrency: "SAR",
    currencySymbol: "SAR",
    currencyPosition: "before"
  });

  // Tax Settings State
  const [taxSettings, setTaxSettings] = useState({
    taxName: "VAT",
    taxRate: 15,
    taxNumber: "300000000000003",
    enableTax: true,
  });

  // Invoice Design State
  const [invoiceDesign, setInvoiceDesign] = useState({
    template_style: "modern",
    primary_color: "#2980B9",
    secondary_color: "#3498DB",
    footer_text: "Thank you for your business!",
    layout_name: "Default Layout"
  });

  // Accounting Year State
  const [accountingYear, setAccountingYear] = useState({
    fiscalYearStart: "01-01", // MM-DD format
    fiscalYearEnd: "12-31",
    currentYear: new Date().getFullYear().toString(),
    lockPreviousPeriods: false,
    allowPostingToPreviousYear: false,
  });

  // Layout designer state
  const [layoutFields, setLayoutFields] = useState<LayoutField[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load company info
    const savedCompanyInfo = localStorage.getItem("companyInfo");
    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    }

    // Load tax settings
    const savedTaxSettings = localStorage.getItem("taxSettings");
    if (savedTaxSettings) {
      setTaxSettings(JSON.parse(savedTaxSettings));
    }

    // Load invoice design
    const savedInvoiceDesign = localStorage.getItem("invoiceDesign");
    if (savedInvoiceDesign) {
      setInvoiceDesign(JSON.parse(savedInvoiceDesign));
    }

    // Load accounting year
    const savedAccountingYear = localStorage.getItem("accountingYear");
    if (savedAccountingYear) {
      setAccountingYear(JSON.parse(savedAccountingYear));
    }
  };

  const handleSaveCompany = () => {
    setLoading(true);
    localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings Saved",
        description: "Company information has been updated successfully",
      });
    }, 1000);
  };

  const handleSaveTax = () => {
    setLoading(true);
    localStorage.setItem("taxSettings", JSON.stringify(taxSettings));
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Tax Settings Saved",
        description: "Tax configuration has been updated successfully",
      });
    }, 1000);
  };

  const handleSaveInvoiceDesign = () => {
    setLoading(true);
    localStorage.setItem("invoiceDesign", JSON.stringify(invoiceDesign));
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Invoice Design Saved",
        description: "Invoice template preferences have been updated successfully",
      });
    }, 1000);
  };

  const handleSaveAccountingYear = () => {
    setLoading(true);
    localStorage.setItem("accountingYear", JSON.stringify(accountingYear));
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Accounting Year Saved",
        description: "Fiscal year settings have been updated successfully",
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

  const fetchInvoiceDesign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("invoice_design_settings")
        .select("*")
        .eq("created_by", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setInvoiceDesign({
          template_style: data.template_style || "modern",
          primary_color: data.primary_color || "#2980B9",
          secondary_color: data.secondary_color || "#3498DB",
          footer_text: data.footer_text || "",
          layout_name: data.layout_name || "Default Layout"
        });

        // Parse layout fields if they exist
        if (data.header_layout || data.footer_layout) {
          const headerFields = data.header_layout ? JSON.parse(data.header_layout as string) : [];
          const footerFields = data.footer_layout ? JSON.parse(data.footer_layout as string) : [];
          setLayoutFields([...headerFields, ...footerFields]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching invoice design:", error);
    }
  };

  const saveInvoiceDesign = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Separate header and footer fields
      const headerFields = layoutFields.filter(f => f.section === "header");
      const footerFields = layoutFields.filter(f => f.section === "footer");

      const designData = {
        ...invoiceDesign,
        header_layout: JSON.stringify(headerFields),
        footer_layout: JSON.stringify(footerFields),
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("invoice_design_settings")
        .upsert(designData, { onConflict: "created_by" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice design settings saved successfully!",
      });
    } catch (error: any) {
      console.error("Error saving invoice design:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice design settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTaxSettings = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tax_settings")
        .upsert({ ...taxSettings, created_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "created_by" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax settings saved successfully!",
      });
    } catch (error: any) {
      console.error("Error saving tax settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tax settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SEO 
        title="Settings - ERP System"
        description="Configure your company settings and preferences"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-heading">Settings</h1>
              <p className="text-muted-foreground">Manage your company information and system preferences</p>
            </div>

            <Tabs defaultValue="company" className="space-y-6">
              <TabsList>
                <TabsTrigger value="company">Company Information</TabsTrigger>
                <TabsTrigger value="tax">Tax Settings</TabsTrigger>
                <TabsTrigger value="invoice">Invoice Design</TabsTrigger>
                <TabsTrigger value="accounting-year">Accounting Year</TabsTrigger>
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
                          <Label htmlFor="district">District (الحي)</Label>
                          <Input
                            id="district"
                            value={companyInfo.district}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, district: e.target.value })}
                            placeholder="Al Olaya"
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

                    {/* Currency Settings */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Currency & Formatting (العملة والتنسيق)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="baseCurrency">Base Currency Code *</Label>
                          <Input
                            id="baseCurrency"
                            value={companyInfo.baseCurrency || "SAR"}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, baseCurrency: e.target.value.toUpperCase() })}
                            placeholder="SAR, USD, EUR..."
                            maxLength={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currencySymbol">Currency Symbol *</Label>
                          <Input
                            id="currencySymbol"
                            value={companyInfo.currencySymbol || "SAR"}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, currencySymbol: e.target.value })}
                            placeholder="SAR, $, €..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Symbol Position</Label>
                          <Select
                            value={companyInfo.currencyPosition || "before"}
                            onValueChange={(v) => setCompanyInfo({ ...companyInfo, currencyPosition: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="before">Before Amount (SAR 100)</SelectItem>
                              <SelectItem value="after">After Amount (100 SAR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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

              <TabsContent value="tax">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Tax Settings
                    </CardTitle>
                    <CardDescription>
                      Configure tax settings that apply across all invoices and quotations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="taxName">Tax Name *</Label>
                        <Input
                          id="taxName"
                          value={taxSettings.taxName}
                          onChange={(e) => setTaxSettings({ ...taxSettings, taxName: e.target.value })}
                          placeholder="VAT, GST, Sales Tax"
                        />
                        <p className="text-xs text-muted-foreground">
                          Display name for tax on invoices (e.g., "VAT", "GST", "Sales Tax")
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax Rate (%) *</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          value={taxSettings.taxRate}
                          onChange={(e) => setTaxSettings({ ...taxSettings, taxRate: parseFloat(e.target.value) || 0 })}
                          placeholder="15"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <p className="text-xs text-muted-foreground">
                          Default tax rate applied to all items (Saudi Arabia VAT: 15%)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxNumber">Tax Registration Number *</Label>
                        <Input
                          id="taxNumber"
                          value={taxSettings.taxNumber}
                          onChange={(e) => setTaxSettings({ ...taxSettings, taxNumber: e.target.value })}
                          placeholder="300000000000003"
                          maxLength={15}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your official tax registration number (15 digits for Saudi VAT)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="enableTax">Tax Status</Label>
                        <Select
                          value={taxSettings.enableTax ? "enabled" : "disabled"}
                          onValueChange={(value) => setTaxSettings({ ...taxSettings, enableTax: value === "enabled" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled (Apply tax to all invoices)</SelectItem>
                            <SelectItem value="disabled">Disabled (No tax calculation)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Enable or disable tax calculation globally
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-sm font-semibold mb-4">Tax Display Preview</h3>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>SAR 1,000.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{taxSettings.taxName} ({taxSettings.taxRate}%):</span>
                          <span>SAR {(1000 * taxSettings.taxRate / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t pt-2">
                          <span>Total:</span>
                          <span>SAR {(1000 + (1000 * taxSettings.taxRate / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveTax} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Saving..." : "Save Tax Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoice">
                <InvoiceLayoutDesigner
                  initialLayout={layoutFields}
                  onSave={(layout) => {
                    setLayoutFields(layout);
                    saveInvoiceDesign();
                  }}
                  companyData={{
                    name_en: companyInfo.nameEn,
                    name_ar: companyInfo.nameAr,
                    vat_number: companyInfo.vatNumber,
                    cr_number: companyInfo.crNumber,
                    phone: companyInfo.phone,
                    email: companyInfo.email,
                    website: companyInfo.website,
                    address: `${companyInfo.buildingNumber || ""} ${companyInfo.streetName || ""}, ${companyInfo.district || ""}, ${companyInfo.city || ""} ${companyInfo.postalCode || ""}`.trim(),
                  }}
                />

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Template & Color Settings</CardTitle>
                    <CardDescription>Choose template style and customize brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Invoice Template</Label>
                      <Select
                        value={invoiceDesign.template_style}
                        onValueChange={(value) => setInvoiceDesign({ ...invoiceDesign, template_style: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern Minimal (Blue Accent)</SelectItem>
                          <SelectItem value="classic">Classic Professional (Green Accent)</SelectItem>
                          <SelectItem value="premium">Premium Corporate (Gold Accent)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose the default template for PDF invoices and quotations
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={invoiceDesign.primary_color}
                          onChange={(e) => setInvoiceDesign({ ...invoiceDesign, primary_color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={invoiceDesign.primary_color}
                          onChange={(e) => setInvoiceDesign({ ...invoiceDesign, primary_color: e.target.value })}
                          placeholder="#2980B9"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Accent color for headers and highlights in invoices
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footerText">Invoice Footer Text</Label>
                      <Textarea
                        id="footerText"
                        value={invoiceDesign.footer_text}
                        onChange={(e) => setInvoiceDesign({ ...invoiceDesign, footer_text: e.target.value })}
                        rows={3}
                        placeholder="Thank you for your business!"
                      />
                      <p className="text-xs text-muted-foreground">
                        Text displayed at the bottom of every invoice
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={saveInvoiceDesign} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Design Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="accounting-year">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Accounting Year & Fiscal Period Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your fiscal year dates and accounting period controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Accounting Year */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Current Accounting Year</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentYear">Current Fiscal Year *</Label>
                          <Select
                            value={accountingYear.currentYear}
                            onValueChange={(value) => setAccountingYear({ ...accountingYear, currentYear: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                              <SelectItem value="2027">2027</SelectItem>
                              <SelectItem value="2028">2028</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Select the current fiscal year for your business
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fiscalYearStart">Fiscal Year Start (Month-Day) *</Label>
                          <Input
                            id="fiscalYearStart"
                            value={accountingYear.fiscalYearStart}
                            onChange={(e) => setAccountingYear({ ...accountingYear, fiscalYearStart: e.target.value })}
                            placeholder="01-01"
                            maxLength={5}
                          />
                          <p className="text-xs text-muted-foreground">
                            Format: MM-DD (e.g., 01-01 for January 1st)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fiscalYearEnd">Fiscal Year End (Month-Day) *</Label>
                          <Input
                            id="fiscalYearEnd"
                            value={accountingYear.fiscalYearEnd}
                            onChange={(e) => setAccountingYear({ ...accountingYear, fiscalYearEnd: e.target.value })}
                            placeholder="12-31"
                            maxLength={5}
                          />
                          <p className="text-xs text-muted-foreground">
                            Format: MM-DD (e.g., 12-31 for December 31st)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fiscal Period Display */}
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Current Fiscal Period</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Period Start:</span>
                          <span className="font-medium">
                            {accountingYear.fiscalYearStart.split('-')[1]}/{accountingYear.fiscalYearStart.split('-')[0]}/{accountingYear.currentYear}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Period End:</span>
                          <span className="font-medium">
                            {accountingYear.fiscalYearEnd.split('-')[1]}/{accountingYear.fiscalYearEnd.split('-')[0]}/{parseInt(accountingYear.currentYear) + (accountingYear.fiscalYearEnd < accountingYear.fiscalYearStart ? 1 : 0)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span className="text-muted-foreground">Fiscal Year Type:</span>
                          <span className="font-medium">
                            {accountingYear.fiscalYearStart === "01-01" && accountingYear.fiscalYearEnd === "12-31" 
                              ? "Calendar Year" 
                              : "Non-Calendar Year"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Period Controls */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Period Controls & Restrictions</h3>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="lockPreviousPeriods" className="font-medium">
                            Lock Previous Periods
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Prevent posting to closed accounting periods
                          </p>
                        </div>
                        <Switch
                          id="lockPreviousPeriods"
                          checked={accountingYear.lockPreviousPeriods}
                          onCheckedChange={(checked) => 
                            setAccountingYear({ ...accountingYear, lockPreviousPeriods: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="allowPostingToPreviousYear" className="font-medium">
                            Allow Posting to Previous Year
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow transactions to be posted to the previous fiscal year
                          </p>
                        </div>
                        <Switch
                          id="allowPostingToPreviousYear"
                          checked={accountingYear.allowPostingToPreviousYear}
                          onCheckedChange={(checked) => 
                            setAccountingYear({ ...accountingYear, allowPostingToPreviousYear: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Common Fiscal Year Examples */}
                    <div className="border-t pt-6">
                      <h3 className="text-sm font-semibold mb-4">Common Fiscal Year Configurations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded space-y-1">
                          <h4 className="font-medium text-sm">Calendar Year (Saudi Arabia Standard)</h4>
                          <p className="text-xs text-muted-foreground">Start: 01-01 | End: 12-31</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAccountingYear({
                              ...accountingYear,
                              fiscalYearStart: "01-01",
                              fiscalYearEnd: "12-31"
                            })}
                          >
                            Apply
                          </Button>
                        </div>

                        <div className="bg-muted p-3 rounded space-y-1">
                          <h4 className="font-medium text-sm">Hijri Calendar Year</h4>
                          <p className="text-xs text-muted-foreground">Start: 01-01 (Muharram) | End: 12-29/30 (Dhul Hijjah)</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAccountingYear({
                              ...accountingYear,
                              fiscalYearStart: "01-01",
                              fiscalYearEnd: "12-29"
                            })}
                          >
                            Apply
                          </Button>
                        </div>

                        <div className="bg-muted p-3 rounded space-y-1">
                          <h4 className="font-medium text-sm">July Start (Common Alternative)</h4>
                          <p className="text-xs text-muted-foreground">Start: 07-01 | End: 06-30</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAccountingYear({
                              ...accountingYear,
                              fiscalYearStart: "07-01",
                              fiscalYearEnd: "06-30"
                            })}
                          >
                            Apply
                          </Button>
                        </div>

                        <div className="bg-muted p-3 rounded space-y-1">
                          <h4 className="font-medium text-sm">April Start (UK Standard)</h4>
                          <p className="text-xs text-muted-foreground">Start: 04-01 | End: 03-31</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAccountingYear({
                              ...accountingYear,
                              fiscalYearStart: "04-01",
                              fiscalYearEnd: "03-31"
                            })}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveAccountingYear} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Saving..." : "Save Accounting Year Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}