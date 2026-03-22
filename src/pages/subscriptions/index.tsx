import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  FileText,
  Zap,
  Eye,
  Calendar,
  Server,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { subscriptionService } from "@/services/subscriptionService";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan, CustomerSubscription } from "@/types/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ServerInfo {
  id: string;
  subscription_id: string;
  customer_id: string;
  server_ip: string;
  software_version: string;
  subscription_date: string;
  port: number;
  rdp_port: number;
  backup: boolean;
  backup_option: string;
  contact_domain: string;
  pc_name: string;
  os_type?: string;
  cpu_cores?: number;
  ram_gb?: number;
  disk_gb?: number;
  status: string;
  notes?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    vat_number: string;
  };
  subscription?: {
    plan?: {
      name: string;
    };
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerInfo | null>(null);
  const [serverForm, setServerForm] = useState({
    subscription_id: "",
    customer_id: "",
    server_ip: "",
    software_version: "",
    subscription_date: new Date().toISOString().split("T")[0],
    port: 80,
    rdp_port: 3389,
    backup: false,
    backup_option: "",
    contact_domain: "",
    pc_name: "",
    os_type: "",
    cpu_cores: 0,
    ram_gb: 0,
    disk_gb: 0,
    status: "active",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionsData, metricsData, serversData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getSubscriptions(),
        subscriptionService.getMetrics(),
        loadServers(),
      ]);

      setPlans(plansData);
      setSubscriptions(subscriptionsData);
      setMetrics(metricsData);
      setServers(serversData);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServers = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_servers")
        .select(`
          *,
          customer:customers (
            name,
            email,
            phone,
            vat_number
          ),
          subscription:customer_subscriptions (
            plan:subscription_plans (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading servers:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error loading servers:", error);
      return [];
    }
  };

  const handleAddServer = () => {
    setEditingServer(null);
    setServerForm({
      subscription_id: "",
      customer_id: "",
      server_ip: "",
      software_version: "",
      subscription_date: new Date().toISOString().split("T")[0],
      port: 80,
      rdp_port: 3389,
      backup: false,
      backup_option: "",
      contact_domain: "",
      pc_name: "",
      os_type: "",
      cpu_cores: 0,
      ram_gb: 0,
      disk_gb: 0,
      status: "active",
      notes: "",
    });
    setShowServerDialog(true);
  };

  const handleEditServer = (server: ServerInfo) => {
    setEditingServer(server);
    setServerForm({
      subscription_id: server.subscription_id,
      customer_id: server.customer_id,
      server_ip: server.server_ip,
      software_version: server.software_version,
      subscription_date: server.subscription_date,
      port: server.port,
      rdp_port: server.rdp_port,
      backup: server.backup,
      backup_option: server.backup_option || "",
      contact_domain: server.contact_domain || "",
      pc_name: server.pc_name || "",
      os_type: server.os_type || "",
      cpu_cores: server.cpu_cores || 0,
      ram_gb: server.ram_gb || 0,
      disk_gb: server.disk_gb || 0,
      status: server.status,
      notes: server.notes || "",
    });
    setShowServerDialog(true);
  };

  const handleSaveServer = async () => {
    try {
      if (!serverForm.server_ip || !serverForm.subscription_id || !serverForm.customer_id) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (editingServer) {
        // Update existing server
        const { error } = await supabase
          .from("subscription_servers")
          .update({
            ...serverForm,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingServer.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Server information updated successfully",
        });
      } else {
        // Create new server
        const { error } = await supabase
          .from("subscription_servers")
          .insert({
            ...serverForm,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Server information created successfully",
        });
      }

      setShowServerDialog(false);
      await loadData();
    } catch (error) {
      console.error("Error saving server:", error);
      toast({
        title: "Error",
        description: "Failed to save server information",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm("Are you sure you want to delete this server?")) return;

    try {
      const { error } = await supabase
        .from("subscription_servers")
        .delete()
        .eq("id", serverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server deleted successfully",
      });

      await loadData();
    } catch (error) {
      console.error("Error deleting server:", error);
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoice = async (subscriptionId: string) => {
    try {
      setGeneratingInvoice(subscriptionId);
      const invoice = await subscriptionService.generateInvoiceForSubscription(subscriptionId);
      
      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoice.invoice_number} created successfully!`,
      });

      await loadData();
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const handleBatchGenerate = async () => {
    try {
      setBatchGenerating(true);
      const results = await subscriptionService.generateInvoicesForDueSubscriptions();

      const successCount = results.success.length;
      const failedCount = results.failed.length;

      if (successCount > 0) {
        toast({
          title: "Batch Generation Complete",
          description: `Successfully generated ${successCount} invoice(s). ${failedCount > 0 ? `${failedCount} failed.` : ""}`,
        });
      } else if (failedCount > 0) {
        toast({
          title: "Batch Generation Failed",
          description: `Failed to generate ${failedCount} invoice(s).`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Invoices Due",
          description: "No subscriptions are due for billing today.",
        });
      }

      await loadData();
    } catch (error) {
      console.error("Error in batch generation:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoices",
        variant: "destructive",
      });
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleViewInvoices = async (subscription: any) => {
    try {
      setSelectedSubscription(subscription);
      const invoices = await subscriptionService.getSubscriptionInvoices(subscription.id);
      setInvoiceHistory(invoices);
      setShowInvoiceHistory(true);
    } catch (error) {
      console.error("Error loading invoice history:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice history",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      router.push(`/sales/invoice/${invoiceId}`);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
      cancelled: "outline",
      expired: "outline",
      maintenance: "secondary",
      inactive: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getBillingCycleBadge = (cycle: string) => {
    const colors: Record<string, string> = {
      monthly: "bg-blue-100 text-blue-800",
      quarterly: "bg-purple-100 text-purple-800",
      annual: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={colors[cycle] || "bg-gray-100 text-gray-800"}>
        {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
      </Badge>
    );
  };

  const isDueBilling = (nextBillingDate: string | null) => {
    if (!nextBillingDate) return false;
    const today = new Date();
    const billing = new Date(nextBillingDate);
    return billing <= today;
  };

  const getDueSubscriptionsCount = () => {
    return subscriptions.filter(
      (sub) =>
        (sub.status === "active" || sub.status === "trial") &&
        sub.auto_renew &&
        isDueBilling(sub.next_billing_date)
    ).length;
  };

  const filteredServers = servers.filter((server) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      server.server_ip.toLowerCase().includes(searchLower) ||
      server.pc_name?.toLowerCase().includes(searchLower) ||
      server.contact_domain?.toLowerCase().includes(searchLower) ||
      server.customer?.name.toLowerCase().includes(searchLower) ||
      server.subscription?.plan?.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <SEO
        title="Subscription Management"
        description="Manage subscription plans and customer subscriptions"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Subscription Management</h1>
                <p className="text-muted-foreground">
                  Manage subscription plans, customer subscriptions, and server information
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBatchGenerate}
                  disabled={batchGenerating || getDueSubscriptionsCount() === 0}
                  variant="outline"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {batchGenerating ? "Generating..." : `Generate Due Invoices (${getDueSubscriptionsCount()})`}
                </Button>
              </div>
            </div>

            {/* Metrics Cards */}
            {metrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.active_subscriptions}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.trial_subscriptions} on trial
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MRR</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      SAR {metrics.mrr.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ARR</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      SAR {metrics.arr.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{servers.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {servers.filter(s => s.status === "active").length} active
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="plans" className="space-y-4">
              <TabsList>
                <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                <TabsTrigger value="subscriptions">Active Subscriptions</TabsTrigger>
                <TabsTrigger value="servers">Server Information</TabsTrigger>
              </TabsList>

              {/* Subscription Plans Tab */}
              <TabsContent value="plans" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Subscription Plans</h2>
                    <p className="text-muted-foreground">
                      Manage your hosting and server subscription plans
                    </p>
                  </div>
                  <Button onClick={() => router.push("/subscriptions/plans/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                  </Button>
                </div>

                {loading ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">Loading plans...</p>
                    </CardContent>
                  </Card>
                ) : plans.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        No subscription plans found. Create your first plan to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                      <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription className="mt-2">
                                {plan.description}
                              </CardDescription>
                            </div>
                            {getBillingCycleBadge(plan.billing_cycle)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="text-3xl font-bold">
                              SAR {plan.price.toLocaleString("en-SA")}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              per {plan.billing_cycle === "monthly" ? "month" : plan.billing_cycle === "quarterly" ? "quarter" : "year"}
                            </p>
                            {plan.setup_fee && plan.setup_fee > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                + SAR {plan.setup_fee} setup fee
                              </p>
                            )}
                            {plan.trial_days && plan.trial_days > 0 && (
                              <Badge variant="secondary" className="mt-2">
                                {plan.trial_days} days free trial
                              </Badge>
                            )}
                          </div>

                          {plan.features && plan.features.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold">Features:</p>
                              <ul className="text-sm space-y-1">
                                {plan.features.slice(0, 4).map((feature, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="mr-2">✓</span>
                                    {feature}
                                  </li>
                                ))}
                                {plan.features.length > 4 && (
                                  <li className="text-muted-foreground">
                                    + {plan.features.length - 4} more features
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          <Button
                            className="w-full"
                            onClick={() => router.push(`/subscriptions/subscribe?plan=${plan.id}`)}
                          >
                            Subscribe Customer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Active Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Customer Subscriptions</h2>
                    <p className="text-muted-foreground">
                      View and manage all customer subscriptions
                    </p>
                  </div>
                  <Button onClick={() => router.push("/subscriptions/subscribe")}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Subscription
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Billing Cycle</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Next Billing</TableHead>
                          <TableHead>Last Payment</TableHead>
                          <TableHead>Auto Renew</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                              Loading subscriptions...
                            </TableCell>
                          </TableRow>
                        ) : subscriptions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                              No subscriptions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          subscriptions.map((sub) => {
                            const isDue = isDueBilling(sub.next_billing_date);
                            return (
                              <TableRow key={sub.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{sub.customer?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {sub.customer?.email}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>{sub.plan?.name}</TableCell>
                                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                <TableCell>{getBillingCycleBadge(sub.plan?.billing_cycle)}</TableCell>
                                <TableCell>
                                  SAR {sub.price.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {sub.next_billing_date ? (
                                      <>
                                        {new Date(sub.next_billing_date).toLocaleDateString()}
                                        {isDue && sub.auto_renew && (
                                          <Badge variant="destructive" className="text-xs">
                                            Due
                                          </Badge>
                                        )}
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {sub.last_invoice_date ? (
                                    <div>
                                      <p className="text-sm">
                                        {new Date(sub.last_invoice_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={sub.auto_renew ? "default" : "outline"}>
                                    {sub.auto_renew ? "Yes" : "No"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewInvoices(sub)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {(sub.status === "active" || sub.status === "trial") && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleGenerateInvoice(sub.id)}
                                        disabled={generatingInvoice === sub.id}
                                      >
                                        {generatingInvoice === sub.id ? (
                                          "Generating..."
                                        ) : (
                                          <>
                                            <FileText className="h-4 w-4 mr-1" />
                                            Invoice
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Server Information Tab */}
              <TabsContent value="servers" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Server Information</h2>
                    <p className="text-muted-foreground">
                      Manage server details for customer subscriptions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search servers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button onClick={handleAddServer}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Server
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Server IP</TableHead>
                          <TableHead>Software Version</TableHead>
                          <TableHead>Subscription Date</TableHead>
                          <TableHead>Port</TableHead>
                          <TableHead>RDP Port</TableHead>
                          <TableHead>Backup</TableHead>
                          <TableHead>Backup Option</TableHead>
                          <TableHead>Contact Domain</TableHead>
                          <TableHead>PC Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center text-muted-foreground">
                              Loading servers...
                            </TableCell>
                          </TableRow>
                        ) : filteredServers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center text-muted-foreground">
                              {searchTerm ? "No servers found matching your search" : "No servers configured. Add your first server to get started."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredServers.map((server) => (
                            <TableRow key={server.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{server.customer?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {server.customer?.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Plan: {server.subscription?.plan?.name}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">{server.server_ip}</TableCell>
                              <TableCell>{server.software_version}</TableCell>
                              <TableCell>
                                {new Date(server.subscription_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{server.port}</TableCell>
                              <TableCell>{server.rdp_port}</TableCell>
                              <TableCell>
                                <Badge variant={server.backup ? "default" : "outline"}>
                                  {server.backup ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>{server.backup_option || "—"}</TableCell>
                              <TableCell>{server.contact_domain || "—"}</TableCell>
                              <TableCell>{server.pc_name || "—"}</TableCell>
                              <TableCell>{getStatusBadge(server.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditServer(server)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteServer(server.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DashboardLayout>
      </AuthGuard>

      {/* Invoice History Dialog */}
      <Dialog open={showInvoiceHistory} onOpenChange={setShowInvoiceHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice History</DialogTitle>
            <DialogDescription>
              {selectedSubscription?.customer?.name} - {selectedSubscription?.plan?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {invoiceHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No invoices generated yet for this subscription
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceHistory.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        SAR {invoice.total_amount.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.payment_status === "paid" ? "default" : "outline"}>
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/sales/invoice/${invoice.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Server Dialog */}
      <Dialog open={showServerDialog} onOpenChange={setShowServerDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingServer ? "Edit Server Information" : "Add Server Information"}</DialogTitle>
            <DialogDescription>
              Configure server details for customer subscription
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Customer & Subscription Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer *</Label>
                <select
                  id="customer_id"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={serverForm.customer_id}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    setServerForm({ ...serverForm, customer_id: customerId });
                    // Auto-select first subscription for this customer if exists
                    const customerSubs = subscriptions.filter(s => s.customer_id === customerId);
                    if (customerSubs.length > 0) {
                      setServerForm({ ...serverForm, customer_id: customerId, subscription_id: customerSubs[0].id });
                    }
                  }}
                  required
                >
                  <option value="">Select Customer</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.customer_id} value={sub.customer_id}>
                      {sub.customer?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_id">Subscription *</Label>
                <select
                  id="subscription_id"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={serverForm.subscription_id}
                  onChange={(e) => setServerForm({ ...serverForm, subscription_id: e.target.value })}
                  required
                  disabled={!serverForm.customer_id}
                >
                  <option value="">Select Subscription</option>
                  {subscriptions
                    .filter(s => s.customer_id === serverForm.customer_id)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.plan?.name} - {sub.status}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Server Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="server_ip">Server IP *</Label>
                <Input
                  id="server_ip"
                  placeholder="192.168.1.100"
                  value={serverForm.server_ip}
                  onChange={(e) => setServerForm({ ...serverForm, server_ip: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="software_version">Software Version</Label>
                <Input
                  id="software_version"
                  placeholder="Windows Server 2022"
                  value={serverForm.software_version}
                  onChange={(e) => setServerForm({ ...serverForm, software_version: e.target.value })}
                />
              </div>
            </div>

            {/* Subscription Date & Ports */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscription_date">Subscription Date *</Label>
                <Input
                  id="subscription_date"
                  type="date"
                  value={serverForm.subscription_date}
                  onChange={(e) => setServerForm({ ...serverForm, subscription_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="80"
                  value={serverForm.port}
                  onChange={(e) => setServerForm({ ...serverForm, port: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rdp_port">RDP Port</Label>
                <Input
                  id="rdp_port"
                  type="number"
                  placeholder="3389"
                  value={serverForm.rdp_port}
                  onChange={(e) => setServerForm({ ...serverForm, rdp_port: parseInt(e.target.value) || 3389 })}
                />
              </div>
            </div>

            {/* Backup Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backup"
                    checked={serverForm.backup}
                    onCheckedChange={(checked) => setServerForm({ ...serverForm, backup: checked })}
                  />
                  <Label htmlFor="backup">Enable Backup</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup_option">Backup Option</Label>
                <select
                  id="backup_option"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={serverForm.backup_option}
                  onChange={(e) => setServerForm({ ...serverForm, backup_option: e.target.value })}
                  disabled={!serverForm.backup}
                >
                  <option value="">Select Option</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            {/* Domain & PC Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_domain">Contact Domain</Label>
                <Input
                  id="contact_domain"
                  placeholder="example.com"
                  value={serverForm.contact_domain}
                  onChange={(e) => setServerForm({ ...serverForm, contact_domain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pc_name">PC Name</Label>
                <Input
                  id="pc_name"
                  placeholder="SERVER-01"
                  value={serverForm.pc_name}
                  onChange={(e) => setServerForm({ ...serverForm, pc_name: e.target.value })}
                />
              </div>
            </div>

            {/* Additional Server Specs */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="os_type">OS Type</Label>
                <Input
                  id="os_type"
                  placeholder="Windows/Linux"
                  value={serverForm.os_type}
                  onChange={(e) => setServerForm({ ...serverForm, os_type: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpu_cores">CPU Cores</Label>
                <Input
                  id="cpu_cores"
                  type="number"
                  placeholder="4"
                  value={serverForm.cpu_cores}
                  onChange={(e) => setServerForm({ ...serverForm, cpu_cores: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ram_gb">RAM (GB)</Label>
                <Input
                  id="ram_gb"
                  type="number"
                  placeholder="8"
                  value={serverForm.ram_gb}
                  onChange={(e) => setServerForm({ ...serverForm, ram_gb: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disk_gb">Disk (GB)</Label>
                <Input
                  id="disk_gb"
                  type="number"
                  placeholder="100"
                  value={serverForm.disk_gb}
                  onChange={(e) => setServerForm({ ...serverForm, disk_gb: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={serverForm.status}
                onChange={(e) => setServerForm({ ...serverForm, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this server..."
                value={serverForm.notes}
                onChange={(e) => setServerForm({ ...serverForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveServer}>
              {editingServer ? "Update Server" : "Add Server"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}