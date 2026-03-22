import { useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fixedAssetsService, type FixedAsset } from "@/services/fixedAssetsService";
import { ArrowLeft, Save, Calculator } from "lucide-react";

const ASSET_CATEGORIES = [
  "Buildings",
  "Land",
  "Vehicles",
  "Machinery & Equipment",
  "Furniture & Fixtures",
  "Computer Equipment",
  "Office Equipment",
  "Leasehold Improvements",
  "Software",
  "Other",
];

export default function CreateFixedAssetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<FixedAsset, "id" | "created_at" | "updated_at" | "created_by">>({
    asset_name: "",
    asset_code: "",
    category: "Machinery & Equipment",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_cost: 0,
    salvage_value: 0,
    useful_life_years: 5,
    depreciation_method: "straight_line",
    current_value: 0,
    accumulated_depreciation: 0,
    location: "",
    status: "active",
    notes: "",
  });

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate current value when purchase cost or accumulated depreciation changes
      if (field === "purchase_cost" || field === "accumulated_depreciation") {
        const purchaseCost = field === "purchase_cost" ? parseFloat(value) || 0 : prev.purchase_cost;
        const accumulatedDep = field === "accumulated_depreciation" ? parseFloat(value) || 0 : prev.accumulated_depreciation;
        updated.current_value = purchaseCost - accumulatedDep;
      }
      
      return updated;
    });
  };

  const calculateDepreciation = () => {
    const { purchase_cost, salvage_value, useful_life_years, depreciation_method } = formData;
    
    if (!purchase_cost || !useful_life_years) {
      toast({
        title: "Missing Information",
        description: "Please enter purchase cost and useful life years",
        variant: "destructive",
      });
      return;
    }

    let annualDepreciation = 0;
    
    if (depreciation_method === "straight_line") {
      annualDepreciation = (purchase_cost - salvage_value) / useful_life_years;
    } else if (depreciation_method === "declining_balance") {
      const rate = 2 / useful_life_years;
      annualDepreciation = purchase_cost * rate;
    }

    toast({
      title: "Depreciation Calculated",
      description: `Annual depreciation: SAR ${annualDepreciation.toFixed(2)}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_name || !formData.asset_code || !formData.purchase_cost) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await fixedAssetsService.create(formData);
      toast({ title: "Success", description: "Fixed asset created successfully" });
      router.push("/accounting/fixed-assets");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Create Fixed Asset" />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/accounting/fixed-assets")}
                  className="mb-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Fixed Assets
                </Button>
                <h1 className="text-3xl font-bold">Add New Fixed Asset</h1>
                <p className="text-muted-foreground">Create a new fixed asset record</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Enter the asset details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="asset_name">
                            Asset Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="asset_name"
                            placeholder="e.g., Dell Laptop XPS 15"
                            value={formData.asset_name}
                            onChange={(e) => handleChange("asset_name", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="asset_code">
                            Asset Code <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="asset_code"
                            placeholder="e.g., FA-2026-001"
                            value={formData.asset_code}
                            onChange={(e) => handleChange("asset_code", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">
                            Category <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => handleChange("category", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSET_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="e.g., Riyadh Office - 3rd Floor"
                            value={formData.location}
                            onChange={(e) => handleChange("location", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purchase_date">
                            Purchase Date <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="purchase_date"
                            type="date"
                            value={formData.purchase_date}
                            onChange={(e) => handleChange("purchase_date", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleChange("status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="disposed">Disposed</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="retired">Retired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Information</CardTitle>
                      <CardDescription>Enter purchase cost and depreciation details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="purchase_cost">
                            Purchase Cost (SAR) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="purchase_cost"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.purchase_cost || ""}
                            onChange={(e) => handleChange("purchase_cost", parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="salvage_value">Salvage Value (SAR)</Label>
                          <Input
                            id="salvage_value"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.salvage_value || ""}
                            onChange={(e) => handleChange("salvage_value", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="useful_life_years">
                            Useful Life (Years) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="useful_life_years"
                            type="number"
                            min="1"
                            placeholder="5"
                            value={formData.useful_life_years || ""}
                            onChange={(e) => handleChange("useful_life_years", parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="depreciation_method">Depreciation Method</Label>
                          <Select
                            value={formData.depreciation_method}
                            onValueChange={(value) => handleChange("depreciation_method", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="straight_line">Straight Line</SelectItem>
                              <SelectItem value="declining_balance">Declining Balance</SelectItem>
                              <SelectItem value="units_of_production">Units of Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accumulated_depreciation">Accumulated Depreciation (SAR)</Label>
                          <Input
                            id="accumulated_depreciation"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.accumulated_depreciation || ""}
                            onChange={(e) => handleChange("accumulated_depreciation", parseFloat(e.target.value) || 0)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Enter if asset was previously owned
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="current_value">Current Value (SAR)</Label>
                          <Input
                            id="current_value"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.current_value || ""}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-sm text-muted-foreground">
                            Auto-calculated: Purchase Cost - Accumulated Depreciation
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={calculateDepreciation}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculate Annual Depreciation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Notes</CardTitle>
                      <CardDescription>Add any additional information about the asset</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="e.g., Purchased from ABC Suppliers, Serial Number: XYZ123..."
                          value={formData.notes}
                          onChange={(e) => handleChange("notes", e.target.value)}
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase Cost:</span>
                          <span className="font-medium">SAR {formData.purchase_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Salvage Value:</span>
                          <span className="font-medium">SAR {formData.salvage_value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Depreciable Amount:</span>
                          <span className="font-medium">
                            SAR {(formData.purchase_cost - formData.salvage_value).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Accumulated Depreciation:</span>
                            <span className="font-medium text-destructive">
                              SAR {formData.accumulated_depreciation.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-bold mt-2">
                            <span>Current Value:</span>
                            <span className="text-primary">SAR {formData.current_value.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Useful Life:</span>
                          <span className="font-medium">{formData.useful_life_years} years</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="font-medium capitalize">
                            {formData.depreciation_method.replace("_", " ")}
                          </span>
                        </div>
                        {formData.depreciation_method === "straight_line" && formData.purchase_cost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Annual Depreciation:</span>
                            <span className="font-medium text-orange-600">
                              SAR {((formData.purchase_cost - formData.salvage_value) / formData.useful_life_years).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Depreciation Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Straight Line:</strong> Equal depreciation each year
                      </p>
                      <p>
                        <strong>Declining Balance:</strong> Higher depreciation in early years
                      </p>
                      <p>
                        <strong>Units of Production:</strong> Based on usage/output
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? "Creating..." : "Create Asset"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/accounting/fixed-assets")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}