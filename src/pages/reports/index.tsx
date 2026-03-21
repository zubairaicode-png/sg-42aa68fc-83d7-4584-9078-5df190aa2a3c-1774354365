import { useState } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Calendar } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-21");

  const reportCategories = [
    {
      title: "Sales Reports",
      reports: [
        { name: "Sales Summary", description: "Overview of sales by period", icon: FileText, href: "/reports" },
        { name: "Sales by Customer", description: "Customer-wise sales analysis", icon: FileText, href: "/reports/customer-ledger" },
        { name: "Sales by Product", description: "Product-wise sales breakdown", icon: FileText, href: "/reports" },
        { name: "VAT Report (Sales)", description: "VAT collected on sales", icon: FileText, href: "/reports/vat-report" },
      ],
    },
    {
      title: "Purchase Reports",
      reports: [
        { name: "Purchase Summary", description: "Overview of purchases by period", icon: FileText, href: "/reports" },
        { name: "Purchase by Supplier", description: "Supplier-wise purchase analysis", icon: FileText, href: "/reports/supplier-ledger" },
        { name: "VAT Report (Purchases)", description: "VAT paid on purchases", icon: FileText, href: "/reports/vat-report" },
      ],
    },
    {
      title: "Inventory Reports",
      reports: [
        { name: "Stock Summary", description: "Current inventory levels", icon: FileText, href: "/reports/stock-report" },
        { name: "Stock Valuation", description: "Inventory value report", icon: FileText, href: "/reports/stock-report" },
        { name: "Low Stock Alert", description: "Products below minimum level", icon: FileText, href: "/reports/stock-report" },
        { name: "Stock Movement", description: "Inventory transactions history", icon: FileText, href: "/reports/stock-report" },
      ],
    },
    {
      title: "Financial Reports",
      reports: [
        { name: "General Ledger", description: "Account transaction history", icon: FileText, href: "/reports/general-ledger" },
        { name: "Trial Balance", description: "Account balances verification", icon: FileText, href: "/reports/trial-balance" },
        { name: "Customer Ledger", description: "Customer account statements", icon: FileText, href: "/reports/customer-ledger" },
        { name: "Supplier Ledger", description: "Supplier account statements", icon: FileText, href: "/reports/supplier-ledger" },
      ],
    },
    {
      title: "Tax Reports",
      reports: [
        { name: "VAT Return", description: "Saudi Arabia VAT filing report", icon: FileText, href: "/reports/vat-report" },
        { name: "Sales Tax Report", description: "Tax collected on sales", icon: FileText, href: "/reports/vat-report" },
        { name: "Purchase Tax Report", description: "Tax paid on purchases", icon: FileText, href: "/reports/vat-report" },
      ],
    },
  ];

  return (
    <>
      <SEO 
        title="Reports - Saudi ERP System"
        description="Generate business and financial reports"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-heading">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">Generate comprehensive business reports</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full">Apply Filter</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="tax">Tax</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {reportCategories.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.reports.map((report, reportIdx) => (
                        <Link key={reportIdx} href={report.href}>
                          <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between mb-2">
                              <report.icon className="h-8 w-8 text-primary" />
                              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <h3 className="font-semibold mb-1">{report.name}</h3>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reportCategories[3].reports.map((report, idx) => (
                      <Link key={idx} href={report.href}>
                        <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between mb-2">
                            <report.icon className="h-8 w-8 text-primary" />
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reportCategories[0].reports.map((report, idx) => (
                      <Link key={idx} href={report.href}>
                        <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between mb-2">
                            <report.icon className="h-8 w-8 text-primary" />
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reportCategories[1].reports.map((report, idx) => (
                      <Link key={idx} href={report.href}>
                        <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between mb-2">
                            <report.icon className="h-8 w-8 text-primary" />
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reportCategories[2].reports.map((report, idx) => (
                      <Link key={idx} href={report.href}>
                        <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between mb-2">
                            <report.icon className="h-8 w-8 text-primary" />
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tax">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Reports (Saudi Arabia)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reportCategories[4].reports.map((report, idx) => (
                      <Link key={idx} href={report.href}>
                        <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between mb-2">
                            <report.icon className="h-8 w-8 text-primary" />
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}