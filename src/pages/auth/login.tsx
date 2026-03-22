import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowNewCompanyRegistration, setAllowNewCompanyRegistration] = useState(true);

  useEffect(() => {
    // Check if new company registration is allowed
    const savedSystemSettings = localStorage.getItem("systemSettings");
    if (savedSystemSettings) {
      const settings = JSON.parse(savedSystemSettings);
      setAllowNewCompanyRegistration(settings.allowNewCompanyRegistration ?? true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login - ERP System" description="Login to your ERP account" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              {allowNewCompanyRegistration && (
                <div className="text-center pt-4 border-t">
                  <Link 
                    href="/auth/register-company" 
                    className="text-sm text-primary hover:underline inline-flex items-center gap-2"
                  >
                    <Building2 className="h-3 w-3" />
                    Register New Company
                  </Link>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}