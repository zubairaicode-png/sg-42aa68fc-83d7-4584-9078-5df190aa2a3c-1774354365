import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { subscriptionService } from "@/services/subscriptionService";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan, CustomerSubscription } from "@/types/subscription";

export default function SubscribeCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { plan: planId } = router.query;

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    plan_id: "",
    status: "trial" as CustomerSubscription["status"],
    start_date: new Date().toISOString().split("T")[0],
    auto_renew: true,
    discount_percent: 0,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (planId && typeof planId === "string" && plans.length > 0) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setFormData(prev => ({ ...prev, plan_id: planId }));
        setSelectedPlan(plan);
      }
    }
  }, [planId, plans]);

  useEffect(() => {
    if (formData.plan_id) {
      const plan = plans.find(p => p.id === formData.plan_id);
      setSelectedPlan(plan || null);
    }
  }, [formData.plan_id, plans]);

  const loadData = async () => {
    try {
      const [plansData, customersData] = await Promise.all([
        subscriptionService.getPlans(),
        customerService.getCustomers(),
      ]);

      setPlans(plansData.filter(p => p.is_active));
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const calculateNextBillingDate = () => {
    if (!selectedPlan) return null;

    const startDate = new Date(formData.start_date);
    const trialDays = selectedPlan.trial_days || 0;

    // Add trial period
    const billingStart = new Date(startDate);
    billingStart.setDate(billingStart.getDate() + trialDays);

    // Add billing cycle
    const nextBilling = new Date(billingStart);
    if (selectedPlan.billing_cycle === "monthly") {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else if (selectedPlan.billing_cycle === "quarterly") {
      nextBilling.setMonth(nextBilling.getMonth() + 3);
    } else if (selectedPlan.billing_cycle === "annual") {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    return nextBilling.toISOString().split("T")[0];
  };

  const calculatePrice = () => {
    if (!selectedPlan) return 0;

    const basePrice = selectedPlan.price;
    const discount = formData.discount_percent || 0;
    return basePrice * (1 - discount / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.plan_id) {
      toast({
        title: "Missing Information",
        description: "Please select both customer and plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const trialDays = selectedPlan?.trial_days || 0;
      const trialEndDate = trialDays > 0 ? 
        new Date(new Date(formData.start_date).getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString() : 
        null;

      const subscriptionData = {
        ...formData,
        price: calculatePrice(),
        next_billing_date: calculateNextBillingDate(),
        trial_end_date: trialEndDate,
      };

      await subscriptionService.createSubscription(subscriptionData);

      toast({
        title: "Success",
        description: "Subscription created successfully",
      });

      router.push("/subscriptions");
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Subscribe Customer"
        description="Create a new customer subscription"
      />
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Subscribe Customer</h1>
                <p className="text-muted-foreground">
                  Create a new subscription for a customer
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Subscription Details */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Subscription Details</CardTitle>
                    <CardDescription>
                      Select customer and subscription plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer *</Label>
                      <Select
                        value={formData.customer_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, customer_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan">Subscription Plan *</Label>
                      <Select
                        value={formData.plan_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, plan_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - SAR {plan.price} ({plan.billing_cycle})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({ ...formData, start_date: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discount_percent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_percent: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto_renew">Auto-Renew</Label>
                      <Switch
                        id="auto_renew"
                        checked={formData.auto_renew}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, auto_renew: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Summary */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Subscription Summary</CardTitle>
                    <CardDescription>
                      Review subscription details before creating
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPlan ? (
                      <>
                        <div>
                          <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedPlan.description}
                          </p>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex justify-between">
                            <span className="text-sm">Base Price:</span>
                            <span className="font-medium">
                              SAR {selectedPlan.price.toLocaleString("en-SA")}
                            </span>
                          </div>

                          {formData.discount_percent > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="text-sm">Discount ({formData.discount_percent}%):</span>
                              <span className="font-medium">
                                -SAR {(selectedPlan.price * formData.discount_percent / 100).toLocaleString("en-SA")}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Final Price:</span>
                            <span>SAR {calculatePrice().toLocaleString("en-SA")}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span>Billing Cycle:</span>
                            <span className="capitalize">{selectedPlan.billing_cycle}</span>
                          </div>

                          {selectedPlan.trial_days && selectedPlan.trial_days > 0 && (
                            <div className="flex justify-between text-sm text-blue-600">
                              <span>Trial Period:</span>
                              <span>{selectedPlan.trial_days} days</span>
                            </div>
                          )}

                          <div className="flex justify-between text-sm">
                            <span>Next Billing Date:</span>
                            <span>
                              {calculateNextBillingDate() 
                                ? new Date(calculateNextBillingDate()!).toLocaleDateString()
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {selectedPlan.features && selectedPlan.features.length > 0 && (
                          <div className="pt-4 border-t">
                            <p className="font-semibold mb-2">Included Features:</p>
                            <ul className="space-y-1 text-sm">
                              {selectedPlan.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="mr-2 text-green-600">✓</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Select a plan to see details
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Subscription"}
                </Button>
              </div>
            </form>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}