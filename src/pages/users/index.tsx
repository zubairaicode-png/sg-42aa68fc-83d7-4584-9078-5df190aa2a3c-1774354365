import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { Users, Search, Plus, Edit, MapPin, Shield } from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.role?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      console.log("Users loaded with locations:", data);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      super_admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      admin: "bg-red-500/10 text-red-500 border-red-500/20",
      manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      accountant: "bg-green-500/10 text-green-500 border-green-500/20",
      sales: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      inventory: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      viewer: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };

    const roleLabels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      manager: "Manager",
      accountant: "Accountant",
      sales: "Sales",
      inventory: "Inventory",
      viewer: "Viewer",
    };

    return (
      <Badge className={roleColors[role] || roleColors.viewer}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const getUserLocations = (user: any) => {
    if (!user.user_locations || user.user_locations.length === 0) {
      return <span className="text-sm text-muted-foreground">No locations assigned</span>;
    }

    const primaryLocation = user.user_locations.find((ul: any) => ul.is_primary);
    const otherLocations = user.user_locations.filter((ul: any) => !ul.is_primary);

    return (
      <div className="flex flex-col gap-1">
        {primaryLocation && primaryLocation.business_locations && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-sm font-medium">
              {primaryLocation.business_locations.location_name}
            </span>
            <span className="text-xs text-primary">(Primary)</span>
          </div>
        )}
        {otherLocations.map((ul: any, idx: number) => (
          ul.business_locations && (
            <div key={idx} className="flex items-center gap-1 ml-4">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {ul.business_locations.location_name}
              </span>
            </div>
          )
        ))}
      </div>
    );
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin" || u.role === "super_admin").length,
    managers: users.filter(u => u.role === "manager").length,
    staff: users.filter(u => !["admin", "super_admin", "manager"].includes(u.role)).length,
  };

  return (
    <>
      <SEO title="User Management - Softo ERP" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage users, roles, and business location access
              </p>
            </div>
            <Link href="/users/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                User Roles
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                    <Shield className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.admins}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Managers</CardTitle>
                    <Shield className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.managers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Staff</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.staff}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, email, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery ? "No users found matching your search" : "No users yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-semibold text-sm">User</th>
                            <th className="text-left p-4 font-semibold text-sm">Email</th>
                            <th className="text-left p-4 font-semibold text-sm">Role</th>
                            <th className="text-left p-4 font-semibold text-sm">Locations</th>
                            <th className="text-right p-4 font-semibold text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-muted/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-primary">
                                      {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{user.full_name || "Unnamed User"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {user.id.slice(0, 8)}...
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm">{user.email || "No email"}</p>
                              </td>
                              <td className="p-4">{getRoleBadge(user.role || "viewer")}</td>
                              <td className="p-4">{getUserLocations(user)}</td>
                              <td className="p-4 text-right">
                                <Link href={`/users/${user.id}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Manage User Roles</h3>
                    <p className="text-muted-foreground mb-6">
                      Create and manage custom user roles with specific permissions
                    </p>
                    <Link href="/users/roles">
                      <Button>
                        <Shield className="h-4 w-4 mr-2" />
                        Go to Role Management
                      </Button>
                    </Link>
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