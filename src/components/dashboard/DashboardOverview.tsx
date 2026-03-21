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

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  trend?: "up" | "down";
}

function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
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

export function DashboardOverview() {
  // Mock data - will be replaced with real data
  const stats = {
    totalSales: 284750,
    totalPurchases: 142350,
    netProfit: 142400,
    lowStockItems: 8,
    pendingInvoices: 12,
    activeCustomers: 156,
  };

  const recentInvoices = [
    { id: "INV-2026-00123", customer: "Al-Rajhi Trading", amount: 12500, status: "paid", date: "2026-03-20" },
    { id: "INV-2026-00122", customer: "Najd Commercial", amount: 8750, status: "pending", date: "2026-03-19" },
    { id: "INV-2026-00121", customer: "Riyadh Supplies", amount: 15200, status: "overdue", date: "2026-03-15" },
    { id: "INV-2026-00120", customer: "Gulf Electronics", amount: 9800, status: "paid", date: "2026-03-18" },
  ];

  const lowStockProducts = [
    { name: "HP LaserJet Printer", sku: "PRN-001", stock: 3, minStock: 10 },
    { name: "Office Chair Executive", sku: "FUR-045", stock: 5, minStock: 15 },
    { name: "Whiteboard Markers", sku: "STA-012", stock: 12, minStock: 50 },
    { name: "A4 Paper Ream", sku: "STA-001", stock: 8, minStock: 30 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-success bg-success/10";
      case "pending": return "text-warning bg-warning/10";
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
          value={`SAR ${stats.totalSales.toLocaleString()}`}
          change={12.5}
          trend="up"
          icon={DollarSign}
        />
        <StatCard
          title="Total Purchases"
          value={`SAR ${stats.totalPurchases.toLocaleString()}`}
          change={8.2}
          trend="up"
          icon={ShoppingCart}
        />
        <StatCard
          title="Net Profit"
          value={`SAR ${stats.netProfit.toLocaleString()}`}
          change={15.3}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices.toString()}
          icon={FileText}
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers.toString()}
          icon={Users}
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
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{invoice.id}</div>
                    <div className="text-sm text-muted-foreground">{invoice.customer}</div>
                    <div className="text-xs text-muted-foreground mt-1">{invoice.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">SAR {invoice.amount.toLocaleString()}</div>
                    <span className={cn(
                      "inline-block px-2 py-1 rounded text-xs font-medium mt-1",
                      getStatusColor(invoice.status)
                    )}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.sku} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="font-semibold text-destructive">{product.stock}</span>
                      <span className="text-muted-foreground"> / {product.minStock}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}