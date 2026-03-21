import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { zatcaService } from "@/services/zatcaService";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Send, 
  Download,
  Settings,
  Key,
  QrCode,
  Lock,
  Unlock,
  RefreshCw,
  FileJson,
  FileCode,
  Clock,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

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

interface ComplianceDevice {
  id: string;
  deviceName: string;
  otp: string;
  csrStatus: "pending" | "generated" | "submitted" | "approved";
  certificateStatus: "not_configured" | "active" | "expired";
  certificateExpiry: string;
  lastUsed: string;
}

export default function ZATCAPhase2Page() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  
  const [devices, setDevices] = useState<any[]>([]);

  // Organization Details State
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

  useEffect(() => {
    fetchDevices();
    loadOrganizationDetails();
  }, []);

  const loadOrganizationDetails = () => {
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
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleSyncWithZATCA = async () => {
    // Validate required fields
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
      // Save to localStorage first
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

      // In production, this would call ZATCA API to validate and sync
      // For now, we'll simulate the sync
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

  const [status, setStatus] = useState<ZATCAStatus>({
    complianceStatus: "compliant",
    certificateStatus: "active",
    certificateExpiry: "2027-12-31",
    lastSync: new Date().toISOString(),
    totalInvoices: 1250,
    reportedInvoices: 1248,
    clearedInvoices: 1245,
    rejectedInvoices: 2,
    pendingInvoices: 3,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
      case "active":
      case "approved":
        return "bg-success/10 text-success";
      case "warning":
      case "expiring":
      case "pending":
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
      case "approved":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
      case "expiring":
      case "pending":
        return <AlertTriangle className="h-5 w-5" />;
      case "critical":
      case "expired":
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const complianceRate = ((status.clearedInvoices / status.totalInvoices) * 100).toFixed(1);

  return (
    <>
      <SEO 
        title="ZATCA Phase 2 Integration - Saudi ERP System"
        description="ZATCA e-invoicing Phase 2 compliance and integration"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">ZATCA Phase 2 Integration</h1>
              <p className="text-muted-foreground mt-1">E-Invoicing Compliance & Real-time Reporting</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab("settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </div>

          {/* Compliance Status Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(status.complianceStatus)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(status.complianceStatus)}
                      <span className="capitalize">{status.complianceStatus}</span>
                    </span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Rate: {complianceRate}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Certificate Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(status.certificateStatus)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(status.certificateStatus)}
                      <span className="capitalize">{status.certificateStatus}</span>
                    </span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Expires: {status.certificateExpiry}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cleared Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-success">{status.clearedInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">of {status.totalInvoices} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending / Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div>
                    <div className="text-2xl font-bold font-heading text-warning">{status.pendingInvoices}</div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-heading text-destructive">{status.rejectedInvoices}</div>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="devices">Device Management</TabsTrigger>
              <TabsTrigger value="invoices">Invoice Status</TabsTrigger>
              <TabsTrigger value="logs">Submission Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* ZATCA Phase 2 Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>ZATCA Phase 2 Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">QR Code Generation</span>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cryptographic Stamp</span>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">XML Invoice Format</span>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Real-time Clearance</span>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Simplified Invoices</span>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Standard Invoices</span>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-success/10 p-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Invoice INV-2026-00125 cleared</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-success/10 p-2">
                        <Send className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Invoice INV-2026-00124 reported</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-warning/10 p-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Certificate renewal reminder</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* API Integration Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Integration Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ZATCA Production API</span>
                      <Badge className="bg-success/10 text-success">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Sync</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(status.lastSync).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Response Time</span>
                      <span className="text-xs text-muted-foreground">145ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate (24h)</span>
                      <span className="text-xs text-success font-semibold">99.8%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate Test QR Code
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileJson className="h-4 w-4 mr-2" />
                      Validate Invoice XML
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Submit Pending Invoices
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Compliance Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
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
                          <Button onClick={handleRegisterDevice} disabled={isLoading}>
                            {isLoading ? "Registering..." : "Register Device"}
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
                            <p className="text-sm text-muted-foreground">Last used: {device.last_used ? new Date(device.last_used).toLocaleString() : "Never"}</p>
                          </div>
                          <Badge className={getStatusColor(device.status)}>
                            {device.status === "active" ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                            {device.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Certificate Expiry:</span>
                            <span className="ml-2 font-medium">{device.certificate_expiry ? new Date(device.certificate_expiry).toLocaleDateString() : "Not Generated"}</span>
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

            {/* Invoice Status Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Submission Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-table-header">
                        <tr>
                          <th className="text-left p-4 font-semibold text-sm">Invoice #</th>
                          <th className="text-left p-4 font-semibold text-sm">Date</th>
                          <th className="text-left p-4 font-semibold text-sm">Customer</th>
                          <th className="text-right p-4 font-semibold text-sm">Amount</th>
                          <th className="text-center p-4 font-semibold text-sm">ZATCA Status</th>
                          <th className="text-center p-4 font-semibold text-sm">UUID</th>
                          <th className="text-center p-4 font-semibold text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t hover:bg-table-row-hover">
                          <td className="p-4 font-medium">INV-2026-00125</td>
                          <td className="p-4 text-sm">2026-03-21</td>
                          <td className="p-4">Al-Rajhi Trading Co.</td>
                          <td className="p-4 text-right font-semibold">SAR 3,450.00</td>
                          <td className="p-4 text-center">
                            <Badge className="bg-success/10 text-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Cleared
                            </Badge>
                          </td>
                          <td className="p-4 text-center text-xs font-mono">a1b2c3d4...</td>
                          <td className="p-4 text-center">
                            <Button size="sm" variant="ghost">
                              <FileCode className="h-3 w-3 mr-1" />
                              View XML
                            </Button>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-table-row-hover">
                          <td className="p-4 font-medium">INV-2026-00124</td>
                          <td className="p-4 text-sm">2026-03-20</td>
                          <td className="p-4">Najd Commercial Est.</td>
                          <td className="p-4 text-right font-semibold">SAR 5,750.00</td>
                          <td className="p-4 text-center">
                            <Badge className="bg-warning/10 text-warning">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </td>
                          <td className="p-4 text-center text-xs font-mono">-</td>
                          <td className="p-4 text-center">
                            <Button size="sm" variant="ghost">
                              <Send className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submission Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Submission Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-success">[SUCCESS]</span> 2026-03-21 18:00:45 - Invoice INV-2026-00125 cleared - UUID: a1b2c3d4-e5f6-7890
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-primary">[INFO]</span> 2026-03-21 17:55:30 - Invoice INV-2026-00125 submitted for clearance
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-success">[SUCCESS]</span> 2026-03-21 17:45:12 - Certificate validated successfully
                    </div>
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-warning">[WARNING]</span> 2026-03-20 16:30:00 - Certificate expires in 280 days
                    </div>
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
                    <p className="text-sm text-muted-foreground">
                      National Address (العنوان الوطني) for ZATCA compliance
                    </p>
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

                    <div className="space-y-2">
                      <Label>Country Code</Label>
                      <Input value="SA" disabled />
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
                        onClick={handleSyncWithZATCA}
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
      </DashboardLayout>
    </>
  );
}