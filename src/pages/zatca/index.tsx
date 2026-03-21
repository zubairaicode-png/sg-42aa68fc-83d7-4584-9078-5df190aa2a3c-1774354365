import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [devices, setDevices] = useState<ComplianceDevice[]>([
    {
      id: "1",
      deviceName: "Main POS Terminal",
      otp: "123456",
      csrStatus: "approved",
      certificateStatus: "active",
      certificateExpiry: "2027-12-31",
      lastUsed: "2026-03-21T18:00:00Z",
    },
  ]);

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
              <Button variant="outline">
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
          <Tabs defaultValue="overview" className="space-y-4">
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
                    <Button>
                      <Key className="h-4 w-4 mr-2" />
                      Register New Device
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{device.deviceName}</h3>
                            <p className="text-sm text-muted-foreground">Last used: {new Date(device.lastUsed).toLocaleString()}</p>
                          </div>
                          <Badge className={getStatusColor(device.certificateStatus)}>
                            {device.certificateStatus === "active" ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                            {device.certificateStatus}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">CSR Status:</span>
                            <Badge className={`ml-2 ${getStatusColor(device.csrStatus)}`}>
                              {device.csrStatus}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Certificate Expiry:</span>
                            <span className="ml-2 font-medium">{device.certificateExpiry}</span>
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
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
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
                      <Input type="number" value="30" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Organization VAT Number</Label>
                      <Input value="300000000000003" />
                    </div>
                    <div className="space-y-2">
                      <Label>CR Number</Label>
                      <Input value="1010000000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization Unit</Label>
                      <Input value="Riyadh Branch" />
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