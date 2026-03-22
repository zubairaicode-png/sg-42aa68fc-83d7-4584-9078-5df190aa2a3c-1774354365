import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, FileText, Shield, User, Mail, Lock, Phone, MapPin, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);

  const [companyData, setCompanyData] = useState({
    // Company Information
    companyName: "",
    companyNameArabic: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Saudi Arabia",
    postalCode: "",
    
    // Tax Information
    vatNumber: "",
    taxRegistrationNumber: "",
    commercialRegistration: "",
    
    // Admin User
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
  });

  useEffect(() => {
    // Check if new company registration is allowed
    // Default to true (allow registration) if setting is not found
    const savedSystemSettings = localStorage.getItem("systemSettings");
    if (savedSystemSettings) {
      try {
        const settings = JSON.parse(savedSystemSettings);
        // Only disable if explicitly set to false
        setRegistrationAllowed(settings.allowNewCompanyRegistration !== false);
      } catch (error) {
        // If parsing fails, allow registration by default
        setRegistrationAllowed(true);
      }
    } else {
      // If no settings found, allow registration by default
      setRegistrationAllowed(true);
    }
  }, []);

  const validateStep1 = () => {
    if (!companyData.companyName || !companyData.email || !companyData.phone) {
      setError("Please fill in all required company fields");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!companyData.vatNumber || !companyData.commercialRegistration) {
      setError("Please fill in all required tax fields");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!companyData.adminFullName || !companyData.adminEmail || !companyData.adminPassword) {
      setError("Please fill in all required admin user fields");
      return false;
    }
    if (companyData.adminPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (companyData.adminPassword !== companyData.adminPasswordConfirm) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!validateStep3()) return;

    try {
      setLoading(true);
      
      // Call API to register new company
      const response = await fetch("/api/admin/register-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Company registration failed");
      }

      toast({
        title: "Success!",
        description: "Company registered successfully. You can now login with your admin credentials.",
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to register company");
    } finally {
      setLoading(false);
    }
  };

  if (!registrationAllowed) {
    return (
      <>
        <SEO 
          title="Company Registration - Saudi ERP System"
          description="Register your company"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Registration Disabled</CardTitle>
              <CardDescription>
                New company registration is currently disabled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  New company registration is currently disabled. Please contact your system administrator for access.
                </AlertDescription>
              </Alert>
              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Register New Company - Saudi ERP System"
        description="Register your company to start using our ERP system"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading">Register Your Company</CardTitle>
            <CardDescription>
              Complete all steps to register your company and create an admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">Company</span>
                </div>
                <div className="w-12 h-0.5 bg-border"></div>
                <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    {currentStep > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">Tax Info</span>
                </div>
                <div className="w-12 h-0.5 bg-border"></div>
                <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:inline">Admin User</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Company Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Company Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name (English) *</Label>
                      <Input
                        id="companyName"
                        value={companyData.companyName}
                        onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                        placeholder="ABC Company LLC"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyNameArabic">Company Name (Arabic)</Label>
                      <Input
                        id="companyNameArabic"
                        value={companyData.companyNameArabic}
                        onChange={(e) => setCompanyData({ ...companyData, companyNameArabic: e.target.value })}
                        placeholder="شركة ..."
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Company Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={companyData.email}
                          onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                          placeholder="info@company.com"
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={companyData.phone}
                          onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                          placeholder="+966 50 123 4567"
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        placeholder="Street address"
                        className="pl-9"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={companyData.city}
                        onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                        placeholder="Riyadh"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={companyData.country}
                        onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                        placeholder="Saudi Arabia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={companyData.postalCode}
                        onChange={(e) => setCompanyData({ ...companyData, postalCode: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Tax Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Tax & Legal Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number *</Label>
                    <Input
                      id="vatNumber"
                      value={companyData.vatNumber}
                      onChange={(e) => setCompanyData({ ...companyData, vatNumber: e.target.value })}
                      placeholder="300000000000003"
                      required
                    />
                    <p className="text-xs text-muted-foreground">15-digit VAT registration number</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRegistrationNumber">Tax Registration Number</Label>
                    <Input
                      id="taxRegistrationNumber"
                      value={companyData.taxRegistrationNumber}
                      onChange={(e) => setCompanyData({ ...companyData, taxRegistrationNumber: e.target.value })}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commercialRegistration">Commercial Registration (CR) *</Label>
                    <Input
                      id="commercialRegistration"
                      value={companyData.commercialRegistration}
                      onChange={(e) => setCompanyData({ ...companyData, commercialRegistration: e.target.value })}
                      placeholder="1010123456"
                      required
                    />
                    <p className="text-xs text-muted-foreground">10-digit commercial registration number</p>
                  </div>
                </div>
              )}

              {/* Step 3: Admin User Setup */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Admin User Account</h3>
                  </div>

                  <Alert>
                    <AlertDescription>
                      This will be your primary administrator account for managing the system.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="adminFullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminFullName"
                        value={companyData.adminFullName}
                        onChange={(e) => setCompanyData({ ...companyData, adminFullName: e.target.value })}
                        placeholder="John Doe"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminEmail"
                        type="email"
                        value={companyData.adminEmail}
                        onChange={(e) => setCompanyData({ ...companyData, adminEmail: e.target.value })}
                        placeholder="admin@company.com"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPassword"
                        type="password"
                        value={companyData.adminPassword}
                        onChange={(e) => setCompanyData({ ...companyData, adminPassword: e.target.value })}
                        placeholder="Enter password (min 6 characters)"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPasswordConfirm">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPasswordConfirm"
                        type="password"
                        value={companyData.adminPasswordConfirm}
                        onChange={(e) => setCompanyData({ ...companyData, adminPasswordConfirm: e.target.value })}
                        placeholder="Confirm your password"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <Link href="/auth/login">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                )}

                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Complete Registration"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}