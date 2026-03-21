import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { purchaseReturnService, type PurchaseReturnWithItems } from "@/services/purchaseReturnService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PurchaseReturnsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [returns, setReturns] = useState<PurchaseReturnWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const data = await purchaseReturnService.getAll();
      setReturns(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load returns", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter(r => 
    r.return_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.suppliers?.name && r.suppliers.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <SEO title="Purchase Returns - Saudi ERP" description="Manage returns to suppliers" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/purchases")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-heading">Purchase Returns</h1>
                <p className="text-muted-foreground">Manage returns to suppliers</p>
              </div>
            </div>
            <Button onClick={() => router.push("/purchases/returns/create")}>
              <Plus className="h-5 w-5 mr-2" /> New Return
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search returns..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Return #</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Supplier</th>
                        <th className="text-right p-4 font-medium">Total Amount</th>
                        <th className="text-center p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReturns.map((r) => (
                        <tr key={r.id} className="border-b">
                          <td className="p-4 font-medium">{r.return_number}</td>
                          <td className="p-4">{format(new Date(r.return_date), 'dd MMM yyyy')}</td>
                          <td className="p-4">{r.suppliers?.name || 'Unknown'}</td>
                          <td className="p-4 text-right font-medium">SAR {Number(r.total_amount).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {filteredReturns.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No returns found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}