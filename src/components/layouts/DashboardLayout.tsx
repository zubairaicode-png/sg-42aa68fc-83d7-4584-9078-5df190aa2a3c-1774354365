import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  Home,
  ShoppingCart,
  RotateCcw,
  Package,
  Users,
  Building2,
  Calculator,
  FileBarChart,
  Settings,
  Receipt,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FileText,
  Landmark,
  TrendingUp,
  Building,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/sales", icon: ShoppingCart, label: "Sales" },
  { href: "/sales/returns", icon: RotateCcw, label: "Sales Returns" },
  { href: "/quotations", icon: FileText, label: "Quotations" },
  { href: "/purchases", icon: Package, label: "Purchases" },
  { href: "/purchases/returns", icon: RotateCcw, label: "Purchase Returns" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/suppliers", icon: Building2, label: "Suppliers" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/subscriptions", icon: Repeat, label: "Subscriptions" },
  { href: "/accounting", icon: Calculator, label: "Accounting" },
  { href: "/accounting/bank-reconciliation", icon: Landmark, label: "Bank Reconciliation" },
  { href: "/accounting/fixed-assets", icon: Building, label: "Fixed Assets" },
  { href: "/zatca", icon: Shield, label: "ZATCA Phase 2" },
  { href: "/reports", icon: FileBarChart, label: "Reports" },
  { href: "/reports/cash-flow", icon: TrendingUp, label: "Cash Flow Statement" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/users", icon: Users, label: "User Management" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("employee");

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name || "User");
          setUserRole(profile.role || "employee");
        }
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-accent">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-heading font-bold">Saudi ERP</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-accent p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-sidebar-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full w-fit mt-1 capitalize", getRoleBadgeColor(userRole))}>
                    {userRole}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">SAR</span> - Saudi Riyal
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}