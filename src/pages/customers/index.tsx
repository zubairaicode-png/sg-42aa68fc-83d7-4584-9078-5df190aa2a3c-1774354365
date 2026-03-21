import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Mail, Phone } from "lucide-react";
import { Customer } from "@/types";
import Link from "next/link";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const customers: Customer[] = [
    {
      id: "1",
      name: "Al-Rajhi Trading Co.",
      email: "info@alrajhi-trading.sa",
      phone: "+966 11 234 5678",
      vatNumber: "300123456700003",
      address: "King Fahd Road",
      city: "Riyadh",
      country: "Saudi Arabia",
      creditLimit: 50000,
      balance: 12500,
      createdAt: "2026-01-15T10:00:00Z",
    },
    {
      id: "2",
      name: "Najd Commercial Est.",
      email: "contact@najd-com.sa",
      phone: "+966 11 987 6543",
      vatNumber: "300987654300003",
      address: "Olaya Street",
      city: "Riyadh",
      country: "Saudi Arabia",
      creditLimit: 30000,
      balance: 8750,
      createdAt: "2026-02-01T14:30:00Z",
    },
    {
      id: "3",
      name: "Riyadh Supplies Ltd.",
      email: "sales@riyadh-supplies.sa",
      phone: "+966 11 555 1234",
      vatNumber: "300555123400003",
      address: "Exit 10, Northern Ring",
      city: "Riyadh",
      country: "Saudi Arabia",
      creditLimit: 75000,
      balance: 23400,
      createdAt: "2026-01-20T09:15:00Z",
    },
  ];

  const stats = {
    totalCustomers: customers.length,
    totalReceivables: customers.reduce((sum, c) => sum + c.balance, 0),
    activeCustomers: customers.filter(c => c.balance > 0).length,
    avgCreditLimit: customers.reduce((sum, c) => sum + c.creditLimit, 0) / customers.length,
  };

  return (
    <>
      <SEO 
        title="Customers - Saudi ERP System"
        description="Manage customer accounts and receivables"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading">Customer Management</h1>
              <p className="text-muted-foreground mt-1">Manage customer accounts and transactions</p>
            </div>
            <Link href="/customers/create">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Customer
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{stats.totalCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading text-primary">SAR {stats.totalReceivables.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{stats.activeCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Credit Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">SAR {stats.avgCreditLimit.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Customer Directory</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
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
                        <th className="text-left p-4 font-semibold text-sm">Customer Name</th>
                        <th className="text-left p-4 font-semibold text-sm">Contact</th>
                        <th className="text-left p-4 font-semibold text-sm">VAT Number</th>
                        <th className="text-left p-4 font-semibold text-sm">Location</th>
                        <th className="text-right p-4 font-semibold text-sm">Credit Limit</th>
                        <th className="text-right p-4 font-semibold text-sm">Balance</th>
                        <th className="text-center p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-t hover:bg-table-row-hover transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{customer.name}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-mono">{customer.vatNumber}</td>
                          <td className="p-4 text-sm">{customer.city}</td>
                          <td className="p-4 text-right">SAR {customer.creditLimit.toLocaleString()}</td>
                          <td className="p-4 text-right font-semibold">SAR {customer.balance.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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