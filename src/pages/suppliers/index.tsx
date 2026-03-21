import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const suppliers = [
    {
      id: "SUP001",
      name: "Al-Rajhi Trading Co.",
      email: "info@alrajhi-trading.sa",
      phone: "+966 11 XXX XXXX",
      taxId: "3001234567890003",
      balance: 45000,
      paymentTerms: 30,
      status: "active" as const,
    },
    {
      id: "SUP002",
      name: "Saudi Electronics Supply",
      email: "sales@ses.sa",
      phone: "+966 12 XXX XXXX",
      taxId: "3009876543210003",
      balance: 0,
      paymentTerms: 15,
      status: "active" as const,
    },
    {
      id: "SUP003",
      name: "Jeddah Furniture Import",
      email: "orders@jfi.sa",
      phone: "+966 50 XXX XXXX",
      taxId: "3005555555550003",
      balance: 12500,
      paymentTerms: 45,
      status: "active" as const,
    },
  ];

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPayable = suppliers.reduce((sum, s) => sum + s.balance, 0);

  return (
    <>
      <SEO
        title="Suppliers | Saudi ERP"
        description="Manage your suppliers and vendor relationships"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Suppliers</h1>
              <p className="text-muted-foreground mt-1">Manage your vendors and suppliers</p>
            </div>
            <Link href="/suppliers/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active vendors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">SAR {totalPayable.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">0</div>
                <p className="text-xs text-muted-foreground mt-1">No overdue invoices</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Supplier List</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>VAT Number</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell className="font-mono text-sm">{supplier.taxId}</TableCell>
                      <TableCell className="text-right">
                        <span className={supplier.balance > 0 ? "text-destructive font-medium" : ""}>
                          SAR {supplier.balance.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{supplier.paymentTerms} days</TableCell>
                      <TableCell>
                        <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}