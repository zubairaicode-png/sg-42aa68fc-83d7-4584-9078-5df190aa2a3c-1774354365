import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { salesReturnService } from "@/services/salesReturnService";

export default function SalesReturnsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesReturns();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredReturns(salesReturns);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = salesReturns.filter(
        (returnItem) =>
          returnItem.return_number?.toLowerCase().includes(query) ||
          returnItem.original_invoice_number?.toLowerCase().includes(query) ||
          returnItem.customer_name?.toLowerCase().includes(query) ||
          returnItem.status?.toLowerCase().includes(query)
      );
      setFilteredReturns(filtered);
    }
  }, [searchQuery, salesReturns]);

  const loadSalesReturns = async () => {
    try {
      setLoading(true);
      console.log("Loading sales returns...");
      const data = await salesReturnService.getAll();
      console.log("Sales returns loaded:", data);
      setSalesReturns(data);
      setFilteredReturns(data);
    } catch (error: any) {
      console.error("Error loading sales returns:", error);
      toast({
        title: "Error",
        description: "Failed to load sales returns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sales return?")) {
      return;
    }

    try {
      await salesReturnService.delete(id);
      toast({
        title: "Success",
        description: "Sales return deleted successfully",
      });
      loadSalesReturns(); // Reload list after delete
    } catch (error: any) {
      console.error("Error deleting sales return:", error);
      toast({
        title: "Error",
        description: "Failed to delete sales return",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "refunded": return "text-success bg-success/10";
      case "approved": return "text-primary bg-primary/10";
      case "pending": return "text-warning bg-warning/10";
      case "cancelled": return "text-muted-foreground bg-muted/50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const stats = {
    totalReturns: filteredReturns.length,
    pendingReturns: filteredReturns.filter(r => r.status === "pending").length,
    totalRefunded: filteredReturns.filter(r => r.status === "refunded").reduce((sum, r) => sum + (r.refund_amount || 0), 0),
    totalPendingAmount: filteredReturns.filter(r => r.status === "pending" || r.status === "approved").reduce((sum, r) => sum + (r.total_amount || 0), 0),
  };

  return (
    <>
      <SEO 
        title="Sales Returns - Saudi ERP System"
        description="Manage sales returns and credit notes"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Sales Returns</h1>
              <p className="text-muted-foreground mt-1">Manage product returns and credit notes</p>
            </div>
            <Link href="/sales/returns/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Sales Return
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{stats.totalReturns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">{stats.pendingReturns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-success">SAR {stats.totalRefunded.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-warning">SAR {stats.totalPendingAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Returns List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Sales Return History</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search returns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-table-header">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Return #</th>
                        <th className="text-left p-4 font-semibold text-sm">Original Invoice</th>
                        <th className="text-left p-4 font-semibold text-sm">Customer</th>
                        <th className="text-left p-4 font-semibold text-sm">Date</th>
                        <th className="text-left p-4 font-semibold text-sm">Reason</th>
                        <th className="text-right p-4 font-semibold text-sm">Amount</th>
                        <th className="text-right p-4 font-semibold text-sm">Refunded</th>
                        <th className="text-center p-4 font-semibold text-sm">Status</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span className="text-muted-foreground">Loading sales returns...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredReturns.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-muted-foreground">
                            {searchQuery ? "No sales returns found matching your search" : "No sales returns yet"}
                          </td>
                        </tr>
                      ) : (
                        filteredReturns.map((returnItem) => (
                          <tr key={returnItem.id} className="border-t hover:bg-table-row-hover transition-colors">
                            <td className="p-4 font-medium">{returnItem.return_number}</td>
                            <td className="p-4 text-primary">{returnItem.original_invoice_number}</td>
                            <td className="p-4">{returnItem.customer_name}</td>
                            <td className="p-4 text-sm">{new Date(returnItem.return_date).toLocaleDateString()}</td>
                            <td className="p-4 text-sm">{returnItem.reason}</td>
                            <td className="p-4 text-right font-semibold">SAR {returnItem.total_amount?.toLocaleString() || "0"}</td>
                            <td className="p-4 text-right">SAR {returnItem.refund_amount?.toLocaleString() || "0"}</td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-block px-3 py-1 rounded-full text-xs font-medium capitalize",
                                getStatusColor(returnItem.status)
                              )}>
                                {formatStatus(returnItem.status)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(returnItem.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}