import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  FileText,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSAR } from "@/lib/constants";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  trend?: "up" | "down";
  loading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-5 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-heading">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend === "up" ? "text-success" : "text-destructive"
            )}>
              {Math.abs(change)}%
            </span>
            <span className="text-sm text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  lowStockItems: number;
  pendingInvoices: number;
  activeCustomers: number;
  salesChange?: number;
  purchasesChange?: number;
  profitChange?: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  payment_status: string;
  invoice_date: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  product_code: string;
  stock_quantity: number;
  reorder_level: number;
}

export function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    netProfit: 0,
    lowStockItems: 0,
    pendingInvoices: 0,
    activeCustomers: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Type cast queries to avoid deep type instantiation errors
      const currentSalesReq = supabase
        .from("sales_invoices")
        .select("total_amount")
        .gte("invoice_date", currentMonthStart)
        .eq("payment_status", "paid") as any;

      const lastMonthSalesReq = supabase
        .from("sales_invoices")
        .select("total_amount")
        .gte("invoice_date", lastMonthStart)
        .lte("invoice_date", lastMonthEnd)
        .eq("payment_status", "paid") as any;

      const currentPurchasesReq = supabase
        .from("purchase_invoices")
        .select("total_amount")
        .gte("invoice_date", currentMonthStart)
        .eq("payment_status", "paid") as any;

      const lastMonthPurchasesReq = supabase
        .from("purchase_invoices")
        .select("total_amount")
        .gte("invoice_date", lastMonthStart)
        .lte("invoice_date", lastMonthEnd)
        .eq("payment_status", "paid") as any;

      const [
        { data: currentSales, error: salesError },
        { data: lastMonthSales },
        { data: currentPurchases, error: purchasesError },
        { data: lastMonthPurchases }
      ] = await Promise.all([
        currentSalesReq,
        lastMonthSalesReq,
        currentPurchasesReq,
        lastMonthPurchasesReq
      ]);

      if (salesError) throw salesError;
      if (purchasesError) throw purchasesError;

      const totalSales = currentSales?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
      const totalPurchases = currentPurchases?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
      const lastMonthSalesTotal = lastMonthSales?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
      const lastMonthPurchasesTotal = lastMonthPurchases?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0;

      const netProfit = totalSales - totalPurchases;
      const lastMonthProfit = lastMonthSalesTotal - lastMonthPurchasesTotal;

      const salesChange = lastMonthSalesTotal > 0 ? ((totalSales - lastMonthSalesTotal) / lastMonthSalesTotal) * 100 : 0;
      const purchasesChange = lastMonthPurchasesTotal > 0 ? ((totalPurchases - lastMonthPurchasesTotal) / lastMonthPurchasesTotal) * 100 : 0;
      const profitChange = lastMonthProfit > 0 ? ((netProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0;

      const { data: lowStockData, error: lowStockError } = await (supabase
        .from("products")
        .select("id, name, product_code, stock_quantity, reorder_level")
        .order("stock_quantity", { ascending: true })
        .limit(10) as any);

      if (lowStockError) console.error("Low stock error:", lowStockError);
      
      const lowStock = (lowStockData || []).filter((p: any) => p.stock_quantity <= (p.reorder_level || 5)).slice(0, 4);

      const { count: pendingCount, error: pendingError } = await (supabase
        .from("sales_invoices")
        .select("*", { count: "exact", head: true })
        .in("payment_status", ["unpaid", "partial"]) as any);

      if (pendingError) console.error(pendingError);

      const { count: customersCount, error: customersError } = await (supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("status", "active") as any);

      if (customersError) console.error(customersError);

      const { data: invoices, error: invoicesError } = await (supabase
        .from("sales_invoices")
        .select("id, invoice_number, total_amount, payment_status, invoice_date, customer_name")
        .order("invoice_date", { ascending: false })
        .limit(4) as any);

      if (invoicesError) console.error(invoicesError);

      const formattedInvoices = invoices?.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name || "Unknown",
        total_amount: parseFloat(inv.total_amount || 0),
        payment_status: inv.payment_status || "unpaid",
        invoice_date: inv.invoice_date,
      })) || [];

      setStats({
        totalSales,
        totalPurchases,
        netProfit,
        lowStockItems: lowStock.length,
        pendingInvoices: pendingCount || 0,
        activeCustomers: customersCount || 0,
        salesChange: Math.round(salesChange * 10) / 10,
        purchasesChange: Math.round(purchasesChange * 10) / 10,
        profitChange: Math.round(profitChange * 10) / 10,
      });

      setRecentInvoices(formattedInvoices);
      setLowStockProducts(lowStock);

    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-success bg-success/10";
      case "unpaid": return "text-warning bg-warning/10";
      case "partial": return "text-blue-600 bg-blue-50";
      case "overdue": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your ERP system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Sales (This Month)"
          value={formatSAR(stats.totalSales)}
          change={stats.salesChange}
          trend={stats.salesChange && stats.salesChange >= 0 ? "up" : "down"}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Total Purchases"
          value={formatSAR(stats.totalPurchases)}
          change={stats.purchasesChange}
          trend={stats.purchasesChange && stats.purchasesChange >= 0 ? "up" : "down"}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatCard
          title="Net Profit"
          value={formatSAR(stats.netProfit)}
          change={stats.profitChange}
          trend={stats.profitChange && stats.profitChange >= 0 ? "up" : "down"}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          loading={loading}
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices.toString()}
          icon={FileText}
          loading={loading}
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers.toString()}
          icon={Users}
          loading={loading}
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent invoices found</p>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">{invoice.customer_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        <CurrencyDisplay amount={invoice.total_amount} iconSize={14} />
                      </div>
                      <span className={cn(
                        "inline-block px-2 py-1 rounded text-xs font-medium mt-1",
                        getStatusColor(invoice.payment_status)
                      )}>
                        {invoice.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All products are well stocked</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">Code: {product.product_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="font-semibold text-destructive">{product.stock_quantity}</span>
                        <span className="text-muted-foreground"> / {product.reorder_level || 0}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}