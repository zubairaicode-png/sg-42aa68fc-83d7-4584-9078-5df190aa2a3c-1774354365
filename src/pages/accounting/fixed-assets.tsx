import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fixedAssetsService, type FixedAsset } from "@/services/fixedAssetsService";
import { Plus, Pencil, Trash2, TrendingDown, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";

export default function FixedAssetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await fixedAssetsService.getAll();
      setAssets(data);
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await fixedAssetsService.delete(id);
        toast({ title: "Success", description: "Asset deleted successfully" });
        loadAssets();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const totalPurchaseCost = assets.reduce((sum, a) => sum + a.purchase_cost, 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalDepreciation = assets.reduce((sum, a) => sum + a.accumulated_depreciation, 0);
  const activeAssets = assets.filter(a => a.status === "active").length;

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: "default",
      disposed: "secondary",
      sold: "outline",
      retired: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
  };

  return (
    <>
      <SEO title="Fixed Assets Management" />
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Fixed Assets</h1>
                <p className="text-muted-foreground">Manage company fixed assets and depreciation</p>
              </div>
              <Button onClick={() => router.push("/accounting/fixed-assets/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchase Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">SAR {totalPurchaseCost.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">SAR {totalCurrentValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Depreciation</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">SAR {totalDepreciation.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeAssets}</div>
                </CardContent>
              </Card>
            </div>

            {/* Assets Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Fixed Assets</CardTitle>
                <CardDescription>Complete list of company fixed assets</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading assets...</div>
                ) : assets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No fixed assets found. Create your first asset to get started.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Code</TableHead>
                          <TableHead>Asset Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead className="text-right">Purchase Cost</TableHead>
                          <TableHead className="text-right">Current Value</TableHead>
                          <TableHead className="text-right">Accumulated Depreciation</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assets.map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.asset_code}</TableCell>
                            <TableCell>{asset.asset_name}</TableCell>
                            <TableCell>{asset.category}</TableCell>
                            <TableCell>{new Date(asset.purchase_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">SAR {asset.purchase_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">SAR {asset.current_value.toFixed(2)}</TableCell>
                            <TableCell className="text-right">SAR {asset.accumulated_depreciation.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(asset.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/accounting/fixed-assets/${asset.id}`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(asset.id!)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  );
}