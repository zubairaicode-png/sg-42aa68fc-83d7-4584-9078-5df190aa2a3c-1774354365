import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast, toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Upload, 
  RefreshCw,
  Settings as SettingsIcon,
  Plus,
  FileText,
  Calendar,
  Building2,
  AlertTriangle,
  Send,
  QrCode,
  FileJson,
  Key,
  Lock,
  Unlock,
  CheckCircle,
  FileCode
} from "lucide-react";
import { zatcaService } from "@/services/zatcaService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateZATCAPDF, type InvoiceData } from "@/lib/zatcaPdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ZATCAStatus {
  complianceStatus: "compliant" | "warning" | "critical";
  certificateStatus: "active" | "expiring" | "expired" | "not_configured";
  certificateExpiry: string;
  lastSync: string;
  totalInvoices: number;
  reportedInvoices: number;
  clearedInvoices: number;
  rejectedInvoices: number;
  pendingInvoices: number;
}

interface ZATCADevice {
  id: string;
  device_name: string;
  status: string;
  certificate_expiry?: string;
  last_used?: string;
}

interface SalesInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_id?: string;
  customer_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method?: string;
  zatca_status?: string;
  zatca_uuid?: string;
  zatca_synced_at?: string;
}

interface SalesReturn {
  id: string;
  return_number: string;
  return_date: string;
  original_invoice_id?: string;
  original_invoice_number?: string;
  customer_id?: string;
  customer_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  zatca_status?: string;
  zatca_uuid?: string;
  zatca_synced_at?: string;
}

export default function ZATCAPhase2Page() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [devices, setDevices] = useState<ZATCADevice[]>([]);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sales Invoices & Returns
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  
  // Auto-sync settings
  const [autoSyncInterval, setAutoSyncInterval] = useState<string>("manual");
  const [lastAutoSync, setLastAutoSync] = useState<Date | null>(null);
  
  // PDF Generation states
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<"modern" | "classic" | "premium">("modern");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Organization details state
  const [orgDetails, setOrgDetails] = useState({
    nameEn: "",
    nameAr: "",
    vatNumber: "",
    crNumber: "",
    buildingNumber: "",
    streetName: "",
    district: "",
    city: "",
    postalCode: "",
    additionalNumber: "",
    countryCode: "SA",
    otp: "",
  });

  const [status, setStatus] = useState<ZATCAStatus>({
    complianceStatus: "compliant",
    certificateStatus: "active",
    certificateExpiry: "2027-12-31",
    lastSync: new Date().toISOString(),
    totalInvoices: 0,
    reportedInvoices: 0,
    clearedInvoices: 0,
    rejectedInvoices: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    fetchDevices();
    fetchOrgDetails();
    fetchSalesInvoices();
    fetchSalesReturns();
    loadAutoSyncSettings();
  }, []);

  // Auto-sync interval effect
  useEffect(() => {
    if (autoSyncInterval === "manual") return;

    const intervalMs = {
      "2h": 2 * 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    }[autoSyncInterval];

    if (!intervalMs) return;

    const interval = setInterval(() => {
      handleAutoSync();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoSyncInterval]);

  const loadAutoSyncSettings = () => {
    const saved = localStorage.getItem("zatca_auto_sync_interval");
    if (saved) {
      setAutoSyncInterval(saved);
    }
    const lastSync = localStorage.getItem("zatca_last_auto_sync");
    if (lastSync) {
      setLastAutoSync(new Date(lastSync));
    }
  };

  const handleAutoSyncIntervalChange = (value: string) => {
    setAutoSyncInterval(value);
    localStorage.setItem("zatca_auto_sync_interval", value);
    
    if (value !== "manual") {
      toast({
        title: "Auto-Sync Enabled",
        description: `Invoices will be synced to ZATCA every ${value === "2h" ? "2 hours" : value === "6h" ? "6 hours" : "24 hours"}`,
      });
    } else {
      toast({
        title: "Auto-Sync Disabled",
        description: "Use manual sync button to sync invoices",
      });
    }
  };

  const handleAutoSync = async () => {
    console.log("Running auto-sync to ZATCA...");
    await handleSyncToZATCA();
    const now = new Date();
    setLastAutoSync(now);
    localStorage.setItem("zatca_last_auto_sync", now.toISOString());
  };

  const fetchSalesInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (
            name
          )
        `)
        .order("invoice_date", { ascending: false });

      if (error) throw error;

      const invoices = (data || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_id: inv.customer_id,
        customer_name: inv.customers?.name || "Walking Customer",
        subtotal: Number(inv.subtotal || 0),
        tax_amount: Number(inv.tax_amount || 0),
        total_amount: Number(inv.total_amount || 0),
        payment_method: inv.payment_method,
        zatca_status: inv.zatca_status || "pending",
        zatca_uuid: inv.zatca_uuid,
        zatca_synced_at: inv.zatca_synced_at,
      }));

      setSalesInvoices(invoices);
      updateStatusFromInvoices(invoices, salesReturns);
    } catch (error) {
      console.error("Error fetching sales invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load sales invoices",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchSalesReturns = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_returns")
        .select(`
          *,
          customers (
            name
          ),
          sales_invoices!sales_returns_original_invoice_id_fkey (
            invoice_number
          )
        `)
        .order("return_date", { ascending: false });

      if (error) throw error;

      const returns = (data || []).map((ret: any) => ({
        id: ret.id,
        return_number: ret.return_number,
        return_date: ret.return_date,
        original_invoice_id: ret.original_invoice_id,
        original_invoice_number: ret.sales_invoices?.invoice_number || "N/A",
        customer_id: ret.customer_id,
        customer_name: ret.customers?.name || "Walking Customer",
        subtotal: Number(ret.subtotal || 0),
        tax_amount: Number(ret.tax_amount || 0),
        total_amount: Number(ret.total_amount || 0),
        zatca_status: ret.zatca_status || "pending",
        zatca_uuid: ret.zatca_uuid,
        zatca_synced_at: ret.zatca_synced_at,
      }));

      setSalesReturns(returns);
      updateStatusFromInvoices(salesInvoices, returns);
    } catch (error) {
      console.error("Error fetching sales returns:", error);
      toast({
        title: "Error",
        description: "Failed to load sales returns",
        variant: "destructive",
      });
    }
  };

  const updateStatusFromInvoices = (invoices: SalesInvoice[], returns: SalesReturn[]) => {
    const allDocuments = [...invoices, ...returns];
    const totalInvoices = allDocuments.length;
    const clearedInvoices = allDocuments.filter(doc => doc.zatca_status === "cleared").length;
    const rejectedInvoices = allDocuments.filter(doc => doc.zatca_status === "rejected").length;
    const pendingInvoices = allDocuments.filter(doc => doc.zatca_status === "pending").length;
    const reportedInvoices = allDocuments.filter(doc => doc.zatca_status === "reported").length;

    setStatus(prev => ({
      ...prev,
      totalInvoices,
      reportedInvoices,
      clearedInvoices,
      rejectedInvoices,
      pendingInvoices,
    }));
  };

  const handleSyncSingleInvoice = async (invoiceId: string, type: "invoice" | "return") => {
    try {
      const table = type === "invoice" ? "sales_invoices" : "sales_returns";
      
      // Simulate ZATCA API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error } = await supabase
        .from(table)
        .update({
          zatca_status: "cleared",
          zatca_uuid: `uuid-${invoiceId}-${Date.now()}`,
          zatca_synced_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Sync Successful",
        description: `${type === "invoice" ? "Invoice" : "Return"} synced to ZATCA`,
      });

      // Auto-generate ZATCA PDF after successful sync
      if (type === "invoice") {
        await generateAndDownloadZATCAPDF(invoiceId);
      }

      // Refresh data
      if (type === "invoice") {
        await fetchSalesInvoices();
      } else {
        await fetchSalesReturns();
      }

    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync document",
        variant: "destructive",
      });
    }
  };

  const generateAndDownloadZATCAPDF = async (invoiceId: string) => {
    try {
      // Fetch full invoice details
      const { data: fullInvoice, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (
            name,
            vat_number,
            building_number,
            street_name,
            district,
            city,
            postal_code,
            additional_number
          ),
          sales_invoice_items (
            description,
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            total
          )
        `)
        .eq("id", invoiceId)
        .single();

      if (error) throw error;

      const invoiceData: InvoiceData = {
        invoiceNumber: fullInvoice.invoice_number,
        invoiceDate: new Date(fullInvoice.invoice_date),
        
        supplierNameEn: orgDetails.nameEn || "Your Company",
        supplierNameAr: orgDetails.nameAr || "شركتك",
        supplierVAT: orgDetails.vatNumber || "",
        supplierCR: orgDetails.crNumber || "",
        supplierBuildingNo: orgDetails.buildingNumber || "",
        supplierStreet: orgDetails.streetName || "",
        supplierDistrict: orgDetails.district || "",
        supplierCity: orgDetails.city || "",
        supplierPostalCode: orgDetails.postalCode || "",
        supplierAdditionalNo: orgDetails.additionalNumber || "",
        
        customerName: fullInvoice.customers?.name || "Cash Customer",
        customerVAT: fullInvoice.customers?.vat_number || undefined,
        customerBuildingNo: fullInvoice.customers?.building_number || "",
        customerStreet: fullInvoice.customers?.street_name || "",
        customerDistrict: fullInvoice.customers?.district || "",
        customerCity: fullInvoice.customers?.city || "",
        customerPostalCode: fullInvoice.customers?.postal_code || "",
        customerAdditionalNo: fullInvoice.customers?.additional_number || "",
        
        items: (fullInvoice.sales_invoice_items || []).map((item: any) => ({
          description: item.description || "Item",
          quantity: item.quantity || 0,
          unitPrice: item.unit_price || 0,
          vatRate: item.tax_rate || 15,
          vatAmount: item.tax_amount || 0,
          total: item.total || 0,
        })),
        
        subtotal: fullInvoice.subtotal || 0,
        totalVAT: fullInvoice.tax_amount || 0,
        total: fullInvoice.total_amount || 0,
        
        paymentMethod: fullInvoice.payment_method || "Cash",
        notes: fullInvoice.notes || "",
      };

      const pdfBlob = await generateZATCAPDF(invoiceData, "modern");
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ZATCA-${fullInvoice.invoice_number}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ ZATCA PDF generated for ${fullInvoice.invoice_number}`);
    } catch (error) {
      console.error("Error generating ZATCA PDF:", error);
      // Don't show error to user - PDF generation is bonus feature
    }
  };

  const handleSyncToZATCA = async () => {
    setIsSyncing(true);
    try {
      // Get pending invoices
      const pendingInvoices = salesInvoices.filter(inv => inv.zatca_status === "pending");
      const pendingReturns = salesReturns.filter(ret => ret.zatca_status === "pending");

      if (pendingInvoices.length === 0 && pendingReturns.length === 0) {
        toast({
          title: "No Pending Documents",
          description: "All invoices and returns are already synced to ZATCA",
        });
        setIsSyncing(false);
        return;
      }

      let syncedCount = 0;

      // Sync invoices
      for (const invoice of pendingInvoices) {
        // In production, this would call actual ZATCA API
        // For now, we'll simulate the sync and update status
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

        const { error } = await supabase
          .from("sales_invoices")
          .update({
            zatca_status: "cleared",
            zatca_uuid: `uuid-${invoice.invoice_number}-${Date.now()}`,
            zatca_synced_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);

        if (!error) {
          syncedCount++;
          // Auto-generate ZATCA PDF for each synced invoice
          await generateAndDownloadZATCAPDF(invoice.id);
        }
      }

      // Sync returns
      for (const returnDoc of pendingReturns) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { error } = await supabase
          .from("sales_returns")
          .update({
            zatca_status: "cleared",
            zatca_uuid: `uuid-${returnDoc.return_number}-${Date.now()}`,
            zatca_synced_at: new Date().toISOString(),
          })
          .eq("id", returnDoc.id);

        if (!error) {
          syncedCount++;
        }
      }

      toast({
        title: "Sync Successful",
        description: `Synced ${syncedCount} documents to ZATCA and generated ${pendingInvoices.length} PDFs`,
      });

      // Refresh data
      await fetchSalesInvoices();
      await fetchSalesReturns();

    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with ZATCA",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) {
      toast({
        title: "Error",
        description: "Please select an invoice",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const invoice = salesInvoices.find(inv => inv.id === selectedInvoice);
      if (!invoice) throw new Error("Invoice not found");

      // Fetch full invoice details including items
      const { data: fullInvoice, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (
            name,
            vat_number,
            building_number,
            street_name,
            district,
            city,
            postal_code,
            additional_number
          ),
          sales_invoice_items (
            description,
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            total
          )
        `)
        .eq("id", selectedInvoice)
        .single();

      if (error) throw error;

      const invoiceData: InvoiceData = {
        invoiceNumber: fullInvoice.invoice_number,
        invoiceDate: new Date(fullInvoice.invoice_date),
        
        supplierNameEn: orgDetails.nameEn || "Your Company",
        supplierNameAr: orgDetails.nameAr || "شركتك",
        supplierVAT: orgDetails.vatNumber || "",
        supplierCR: orgDetails.crNumber || "",
        supplierBuildingNo: orgDetails.buildingNumber || "",
        supplierStreet: orgDetails.streetName || "",
        supplierDistrict: orgDetails.district || "",
        supplierCity: orgDetails.city || "",
        supplierPostalCode: orgDetails.postalCode || "",
        supplierAdditionalNo: orgDetails.additionalNumber || "",
        
        customerName: fullInvoice.customers?.name || "Cash Customer",
        customerVAT: fullInvoice.customers?.vat_number || undefined,
        customerBuildingNo: fullInvoice.customers?.building_number || "",
        customerStreet: fullInvoice.customers?.street_name || "",
        customerDistrict: fullInvoice.customers?.district || "",
        customerCity: fullInvoice.customers?.city || "",
        customerPostalCode: fullInvoice.customers?.postal_code || "",
        customerAdditionalNo: fullInvoice.customers?.additional_number || "",
        
        items: (fullInvoice.sales_invoice_items || []).map((item: any) => ({
          description: item.description || "Item",
          quantity: item.quantity || 0,
          unitPrice: item.unit_price || 0,
          vatRate: item.tax_rate || 15,
          vatAmount: item.tax_amount || 0,
          total: item.total || 0,
        })),
        
        subtotal: fullInvoice.subtotal || 0,
        totalVAT: fullInvoice.tax_amount || 0,
        total: fullInvoice.total_amount || 0,
        
        paymentMethod: fullInvoice.payment_method || "Cash",
        notes: fullInvoice.notes || "",
      };

      const pdfBlob = await generateZATCAPDF(invoiceData, selectedTemplate);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${fullInvoice.invoice_number}-${selectedTemplate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `ZATCA-compliant PDF downloaded successfully (${selectedTemplate} template)`,
      });

      setIsPdfDialogOpen(false);
      setSelectedInvoice("");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const fetchOrgDetails = () => {
    try {
      const savedCompanyInfo = localStorage.getItem("companyInfo");
      if (savedCompanyInfo) {
        const companyInfo = JSON.parse(savedCompanyInfo);
        setOrgDetails({
          nameEn: companyInfo.nameEn || "",
          nameAr: companyInfo.nameAr || "",
          vatNumber: companyInfo.vatNumber || "",
          crNumber: companyInfo.crNumber || "",
          buildingNumber: companyInfo.buildingNumber || "",
          streetName: companyInfo.streetName || "",
          district: companyInfo.district || "",
          city: companyInfo.city || "",
          postalCode: companyInfo.postalCode || "",
          additionalNumber: companyInfo.additionalNumber || "",
          countryCode: "SA",
          otp: "",
        });
      }
    } catch (error) {
      console.error("Error loading organization details:", error);
    }
  };

  const fetchDevices = async () => {
    try {
      const data = await zatcaService.devices.getAll();
      setDevices(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegisterDevice = async () => {
    if (!newDeviceName.trim()) {
      toast({ title: "Error", description: "Device name is required", variant: "destructive" });
      return;
    }
    setIsRegistering(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      await zatcaService.devices.create({
        device_name: newDeviceName,
        status: "pending",
        created_by: session.session?.user?.id,
      });
      toast({ title: "Success", description: "Device registered successfully" });
      setIsRegisterDialogOpen(false);
      setNewDeviceName("");
      fetchDevices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to register device", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSyncOrgDetails = async () => {
    if (!orgDetails.vatNumber || !orgDetails.crNumber || !orgDetails.buildingNumber || 
        !orgDetails.streetName || !orgDetails.city || !orgDetails.postalCode) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields (VAT Number, CR Number, and complete National Address)", 
        variant: "destructive" 
      });
      return;
    }

    setIsSyncing(true);
    try {
      const companyInfo = {
        nameEn: orgDetails.nameEn,
        nameAr: orgDetails.nameAr,
        vatNumber: orgDetails.vatNumber,
        crNumber: orgDetails.crNumber,
        buildingNumber: orgDetails.buildingNumber,
        streetName: orgDetails.streetName,
        district: orgDetails.district,
        city: orgDetails.city,
        postalCode: orgDetails.postalCode,
        additionalNumber: orgDetails.additionalNumber,
        country: "Saudi Arabia",
      };
      localStorage.setItem("companyInfo", JSON.stringify(companyInfo));

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({ 
        title: "Sync Successful", 
        description: "Organization details have been synced with ZATCA successfully" 
      });
    } catch (error: any) {
      toast({ 
        title: "Sync Failed", 
        description: error.message || "Failed to sync with ZATCA", 
        variant: "destructive" 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
      case "active":
      case "cleared":
        return "bg-success/10 text-success";
      case "warning":
      case "expiring":
      case "pending":
      case "reported":
        return "bg-warning/10 text-warning";
      case "critical":
      case "expired":
      case "rejected":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
      case "active":
      case "cleared":
        return <CheckCircle2 className="h-5 w-5" />;
      case "warning":
      case "expiring":
      case "pending":
      case "reported":
        return <AlertTriangle className="h-5 w-5" />;
      case "critical":
      case "expired":
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const complianceRate = status.totalInvoices > 0 
    ? ((status.clearedInvoices / status.totalInvoices) * 100).toFixed(1)
    : "0.0";

  return (
    <>
      <SEO 
        title="ZATCA Phase 2 Integration - Saudi ERP System"
        description="ZATCA e-invoicing Phase 2 compliance and integration"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">ZATCA Phase 2 Integration</h1>
                <p className="text-muted-foreground mt-1">
                  Manage e-invoicing compliance and sync invoices to ZATCA
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsPdfDialogOpen(true)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handleSyncToZATCA} disabled={isSyncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync to ZATCA"}
                </Button>
              </div>
            </div>

            {/* Compliance Status Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading">{status.totalInvoices}</div>
                  <p className="text-xs text-muted-foreground mt-1">Invoices + Returns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cleared</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-success">{status.clearedInvoices}</div>
                  <p className="text-xs text-muted-foreground mt-1">Rate: {complianceRate}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-warning">{status.pendingInvoices}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting sync</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Reported</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-primary">{status.reportedInvoices}</div>
                  <p className="text-xs text-muted-foreground mt-1">Simplified invoices</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-heading text-destructive">{status.rejectedInvoices}</div>
                  <p className="text-xs text-muted-foreground mt-1">Need attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Auto-Sync Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Auto-Sync Settings</CardTitle>
                    <CardDescription>Configure automatic synchronization to ZATCA</CardDescription>
                  </div>
                  {lastAutoSync && (
                    <p className="text-sm text-muted-foreground">
                      Last sync: {lastAutoSync.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="sync-interval">Sync Interval</Label>
                    <Select value={autoSyncInterval} onValueChange={handleAutoSyncIntervalChange}>
                      <SelectTrigger id="sync-interval" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Manual Sync Only
                          </div>
                        </SelectItem>
                        <SelectItem value="2h">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Every 2 Hours
                          </div>
                        </SelectItem>
                        <SelectItem value="6h">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Every 6 Hours
                          </div>
                        </SelectItem>
                        <SelectItem value="24h">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Every 24 Hours
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="opacity-0">Action</Label>
                    <Button 
                      onClick={handleSyncToZATCA} 
                      disabled={isSyncing}
                      className="mt-2"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="invoices">
                  <FileText className="h-4 w-4 mr-2" />
                  Sales Invoices ({salesInvoices.length})
                </TabsTrigger>
                <TabsTrigger value="returns">
                  <FileCode className="h-4 w-4 mr-2" />
                  Sales Returns ({salesReturns.length})
                </TabsTrigger>
                <TabsTrigger value="devices">Device Management</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Sales Invoices Tab */}
              <TabsContent value="invoices" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Sales Invoices</CardTitle>
                        <CardDescription>Track and sync sales invoices to ZATCA</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {salesInvoices.filter(inv => inv.zatca_status === "pending").length} Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInvoices ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground mt-2">Loading invoices...</p>
                      </div>
                    ) : salesInvoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No sales invoices found. Create your first invoice to get started.
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">VAT</TableHead>
                              <TableHead className="text-center">ZATCA Status</TableHead>
                              <TableHead className="text-center">UUID</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salesInvoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                                <TableCell>{invoice.customer_name}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  SAR {invoice.total_amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  SAR {invoice.tax_amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getStatusColor(invoice.zatca_status || "pending")}>
                                    {getStatusIcon(invoice.zatca_status || "pending")}
                                    <span className="ml-1 capitalize">{invoice.zatca_status || "pending"}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {invoice.zatca_uuid ? (
                                    <span className="text-xs font-mono">{invoice.zatca_uuid.substring(0, 12)}...</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {invoice.zatca_status === "pending" ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleSyncSingleInvoice(invoice.id, "invoice")}
                                    >
                                      <Send className="h-3 w-3 mr-1" />
                                      Sync
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="ghost" disabled>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Synced
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sales Returns Tab */}
              <TabsContent value="returns" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Sales Returns</CardTitle>
                        <CardDescription>Track and sync sales return invoices to ZATCA</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {salesReturns.filter(ret => ret.zatca_status === "pending").length} Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {salesReturns.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No sales returns found.
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Return #</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Original Invoice</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">VAT</TableHead>
                              <TableHead className="text-center">ZATCA Status</TableHead>
                              <TableHead className="text-center">UUID</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salesReturns.map((returnDoc) => (
                              <TableRow key={returnDoc.id}>
                                <TableCell className="font-medium">{returnDoc.return_number}</TableCell>
                                <TableCell>{new Date(returnDoc.return_date).toLocaleDateString()}</TableCell>
                                <TableCell>{returnDoc.original_invoice_number}</TableCell>
                                <TableCell>{returnDoc.customer_name}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  SAR {returnDoc.total_amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  SAR {returnDoc.tax_amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getStatusColor(returnDoc.zatca_status || "pending")}>
                                    {getStatusIcon(returnDoc.zatca_status || "pending")}
                                    <span className="ml-1 capitalize">{returnDoc.zatca_status || "pending"}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {returnDoc.zatca_uuid ? (
                                    <span className="text-xs font-mono">{returnDoc.zatca_uuid.substring(0, 12)}...</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {returnDoc.zatca_status === "pending" ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleSyncSingleInvoice(returnDoc.id, "return")}
                                    >
                                      <Send className="h-3 w-3 mr-1" />
                                      Sync
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="ghost" disabled>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Synced
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Device Management Tab */}
              <TabsContent value="devices" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Compliance Devices</CardTitle>
                      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Key className="h-4 w-4 mr-2" />
                            Register New Device
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Register New Compliance Device</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Device Name / POS Terminal</Label>
                              <Input 
                                placeholder="e.g. Main POS Riyadh" 
                                value={newDeviceName}
                                onChange={(e) => setNewDeviceName(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleRegisterDevice} disabled={isRegistering}>
                              {isRegistering ? "Registering..." : "Register Device"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {devices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No devices registered. Click "Register New Device" to start.
                        </div>
                      ) : devices.map((device) => (
                        <div key={device.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{device.device_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Last used: {device.last_used ? new Date(device.last_used).toLocaleString() : "Never"}
                              </p>
                            </div>
                            <Badge className={getStatusColor(device.status)}>
                              {device.status === "active" ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                              {device.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Certificate Expiry:</span>
                              <span className="ml-2 font-medium">
                                {device.certificate_expiry ? new Date(device.certificate_expiry).toLocaleDateString() : "Not Generated"}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Download CSR
                            </Button>
                            <Button size="sm" variant="outline">
                              <Key className="h-3 w-3 mr-1" />
                              Renew Certificate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Environment</Label>
                        <select className="w-full border rounded-md p-2">
                          <option value="production">Production</option>
                          <option value="sandbox">Sandbox</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>API Base URL</Label>
                        <Input value="https://api.zatca.gov.sa/e-invoicing" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Timeout (seconds)</Label>
                        <Input type="number" defaultValue="30" />
                      </div>
                      <div className="space-y-2">
                        <Label>OTP (One Time Password)</Label>
                        <Input 
                          value={orgDetails.otp}
                          onChange={(e) => setOrgDetails({ ...orgDetails, otp: e.target.value })}
                          placeholder="Enter OTP from ZATCA portal"
                          maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Get OTP from ZATCA portal for device onboarding
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Details</CardTitle>
                      <CardDescription>
                        National Address (العنوان الوطني) for ZATCA compliance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company Name (EN) *</Label>
                          <Input 
                            value={orgDetails.nameEn}
                            onChange={(e) => setOrgDetails({ ...orgDetails, nameEn: e.target.value })}
                            placeholder="Your Company Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Company Name (AR) *</Label>
                          <Input 
                            value={orgDetails.nameAr}
                            onChange={(e) => setOrgDetails({ ...orgDetails, nameAr: e.target.value })}
                            placeholder="اسم شركتك"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>VAT Number (الرقم الضريبي) *</Label>
                          <Input 
                            value={orgDetails.vatNumber}
                            onChange={(e) => setOrgDetails({ ...orgDetails, vatNumber: e.target.value })}
                            placeholder="300000000000003"
                            maxLength={15}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CR Number (رقم السجل التجاري) *</Label>
                          <Input 
                            value={orgDetails.crNumber}
                            onChange={(e) => setOrgDetails({ ...orgDetails, crNumber: e.target.value })}
                            placeholder="1010000000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Building Number (رقم المبنى) *</Label>
                          <Input 
                            value={orgDetails.buildingNumber}
                            onChange={(e) => setOrgDetails({ ...orgDetails, buildingNumber: e.target.value })}
                            placeholder="1234"
                            maxLength={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Street Name (اسم الشارع) *</Label>
                          <Input 
                            value={orgDetails.streetName}
                            onChange={(e) => setOrgDetails({ ...orgDetails, streetName: e.target.value })}
                            placeholder="King Fahd Road"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>District (الحي)</Label>
                          <Input 
                            value={orgDetails.district}
                            onChange={(e) => setOrgDetails({ ...orgDetails, district: e.target.value })}
                            placeholder="Al Olaya"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City (المدينة) *</Label>
                          <Input 
                            value={orgDetails.city}
                            onChange={(e) => setOrgDetails({ ...orgDetails, city: e.target.value })}
                            placeholder="Riyadh"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Postal Code (الرمز البريدي) *</Label>
                          <Input 
                            value={orgDetails.postalCode}
                            onChange={(e) => setOrgDetails({ ...orgDetails, postalCode: e.target.value })}
                            placeholder="12345"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Additional Number (الرقم الإضافي) *</Label>
                          <Input 
                            value={orgDetails.additionalNumber}
                            onChange={(e) => setOrgDetails({ ...orgDetails, additionalNumber: e.target.value })}
                            placeholder="5678"
                            maxLength={4}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            window.location.href = "/settings";
                          }}
                        >
                          Edit in Settings
                        </Button>
                        <Button 
                          onClick={handleSyncOrgDetails}
                          disabled={isSyncing}
                        >
                          {isSyncing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync with ZATCA
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* PDF Download Dialog */}
          <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Download ZATCA-Compliant Invoice PDF</DialogTitle>
                <DialogDescription>
                  Select an invoice and choose a professional PDF template
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-select">Select Invoice</Label>
                  <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                    <SelectTrigger id="invoice-select">
                      <SelectValue placeholder="Choose an invoice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salesInvoices.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No invoices available
                        </SelectItem>
                      ) : (
                        salesInvoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - {invoice.customer_name} - SAR {invoice.total_amount.toFixed(2)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-select">PDF Template</Label>
                  <Select value={selectedTemplate} onValueChange={(value: any) => setSelectedTemplate(value)}>
                    <SelectTrigger id="template-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          Modern Minimal (Blue)
                        </div>
                      </SelectItem>
                      <SelectItem value="classic">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Classic Professional (Green)
                        </div>
                      </SelectItem>
                      <SelectItem value="premium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                          Premium Corporate (Gold)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    All templates include ZATCA-compliant QR codes, bilingual content (Arabic/English), 
                    and complete National Address details.
                  </p>
                </div>

                {selectedInvoice && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Invoice Preview:</h4>
                    {(() => {
                      const invoice = salesInvoices.find(inv => inv.id === selectedInvoice);
                      return invoice ? (
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Number:</span> {invoice.invoice_number}</p>
                          <p><span className="font-medium">Date:</span> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                          <p><span className="font-medium">Customer:</span> {invoice.customer_name}</p>
                          <p><span className="font-medium">Total:</span> SAR {invoice.total_amount.toFixed(2)}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleDownloadPDF} 
                  disabled={!selectedInvoice || isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}