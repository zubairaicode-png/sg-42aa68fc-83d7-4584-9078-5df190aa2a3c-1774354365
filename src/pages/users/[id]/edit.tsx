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
import { locationService } from "@/services/locationService";
import { userService } from "@/services/userService";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface LocationAssignment {
  locationId: string;
  isPrimary: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "viewer",
  });
  const [selectedLocations, setSelectedLocations] = useState<LocationAssignment[]>([]);

  useEffect(() => {
    if (id) {
      loadUser(id as string);
    }
    loadLocations();
  }, [id]);

  const loadUser = async (userId: string) => {
    try {
      setLoading(true);
      const userData = await userService.getById(userId);
      
      setFormData({
        fullName: userData.full_name || "",
        email: userData.email || "",
        role: userData.role || "viewer",
      });

      if (userData.user_locations && userData.user_locations.length > 0) {
        setSelectedLocations(
          userData.user_locations.map((ul: any) => ({
            locationId: ul.location_id,
            isPrimary: ul.is_primary,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error loading user:", error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationService.getAll();
      setLocations(data);
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

    if (!formData.fullName || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
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

      // Update user profile
      await userService.update(id as string, {
        full_name: formData.fullName,
        role: formData.role,
      });

      // Update location assignments
      const locationIds = selectedLocations.map((sl) => sl.locationId);
      const primaryLocationId = selectedLocations.find((sl) => sl.isPrimary)?.locationId || locationIds[0];

      await userService.assignLocations(id as string, locationIds, primaryLocationId);

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      router.push("/users");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.fullName) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO title="Edit User - Softo ERP" />
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
                <h1 className="text-3xl font-bold">Edit User</h1>
                <p className="text-muted-foreground mt-1">Update user details and permissions</p>
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
                {loading ? "Updating..." : "Update User"}
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
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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