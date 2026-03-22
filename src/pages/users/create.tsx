import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { locationService } from "@/services/locationService";
import { userService } from "@/services/userService";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

interface LocationAssignment {
  locationId: string;
  isPrimary: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "viewer",
  });
  const [selectedLocations, setSelectedLocations] = useState<LocationAssignment[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("business_locations")
        .select("*")
        .eq("status", "active")
        .order("location_name", { ascending: true });

      if (error) throw error;
      
      console.log("Loaded business locations:", data);
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error loading locations:", error);
      toast({
        title: "Error",
        description: "Failed to load business locations",
        variant: "destructive",
      });
    }
  };

  const handleLocationToggle = (locationId: string) => {
    const exists = selectedLocations.find((sl) => sl.locationId === locationId);
    if (exists) {
      setSelectedLocations(selectedLocations.filter((sl) => sl.locationId !== locationId));
    } else {
      setSelectedLocations([...selectedLocations, { locationId, isPrimary: false }]);
    }
  };

  const handleSetPrimary = (locationId: string) => {
    setSelectedLocations(
      selectedLocations.map((sl) => ({
        ...sl,
        isPrimary: sl.locationId === locationId,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (selectedLocations.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please assign at least one business location",
        variant: "destructive",
      });
      return;
    }

    const hasPrimary = selectedLocations.some((sl) => sl.isPrimary);
    if (!hasPrimary) {
      toast({
        title: "Validation Error",
        description: "Please set one location as primary",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Create user account
      const { data: authData, error: signUpError } = await authService.signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("User creation failed - no user returned");
      }

      // Update user role
      await userService.update(authData.user.id, {
        role: formData.role,
      });

      // Assign locations
      const locationIds = selectedLocations.map((sl) => sl.locationId);
      const primaryLocationId = selectedLocations.find((sl) => sl.isPrimary)?.locationId || locationIds[0];

      await userService.assignLocations(authData.user.id, locationIds, primaryLocationId);

      toast({
        title: "Success",
        description: "User created successfully",
      });

      router.push("/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Create User - Softo ERP" />
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/users">
                <Button type="button" variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Create New User</h1>
                <p className="text-muted-foreground mt-1">Add a new user to the system</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/users">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Location Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Business Location Access</CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No business locations found. Please create locations in Settings first.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" className="mt-4">
                      Go to Settings
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select the business locations this user can access. Set one as primary location.
                  </p>

                  <div className="space-y-3">
                    {locations.map((location) => {
                      const isSelected = selectedLocations.some((sl) => sl.locationId === location.id);
                      const isPrimary = selectedLocations.find((sl) => sl.locationId === location.id)?.isPrimary;

                      return (
                        <div
                          key={location.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleLocationToggle(location.id)}
                            />
                            <div>
                              <p className="font-medium">{location.location_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {location.city && `${location.city}, `}
                                {location.country}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <Button
                              type="button"
                              variant={isPrimary ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSetPrimary(location.id)}
                            >
                              {isPrimary ? "✓ Primary" : "Set as Primary"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </DashboardLayout>
    </>
  );
}