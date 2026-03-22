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

export default function SubscriptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionsData, metricsData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getSubscriptions(),
        subscriptionService.getMetrics(),
      ]);

      setPlans(plansData);
      setSubscriptions(subscriptionsData);
      setMetrics(metricsData);
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

  const handleGenerateInvoice = async (subscriptionId: string) => {
    try {
      setGeneratingInvoice(subscriptionId);
      const invoice = await subscriptionService.generateInvoiceForSubscription(subscriptionId);
      
      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoice.invoice_number} created successfully!`,
      });

      // Reload data to show updated next billing date
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

      // Reload data
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
      cancelled: "outline",
      expired: "outline",
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
                  Manage subscription plans, customer subscriptions, and recurring billing
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
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.churn_rate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.cancelled_subscriptions} cancelled
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
                          <TableHead>Auto Renew</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        SAR {invoice.total.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.payment_status === "paid" ? "default" : "outline"}>
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/sales/invoice/${invoice.id}`)}
                        >
                          View
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
    </>
  );
}