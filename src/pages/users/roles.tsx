import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { roleService, type UserRole } from "@/services/roleService";
import { Shield, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function UserRolesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    roleName: "",
    roleCode: "",
    description: "",
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAll();
      setRoles(data);
    } catch (error: any) {
      console.error("Error loading roles:", error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role?: UserRole) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        roleName: role.role_name,
        roleCode: role.role_code,
        description: role.description || "",
      });
    } else {
      setEditingRole(null);
      setFormData({
        roleName: "",
        roleCode: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roleName || !formData.roleCode) {
      toast({
        title: "Validation Error",
        description: "Please fill in role name and code",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRole) {
        await roleService.update(editingRole.id, {
          role_name: formData.roleName,
          description: formData.description,
          permissions: editingRole.permissions,
        });
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      } else {
        await roleService.create({
          role_name: formData.roleName,
          role_code: formData.roleCode.toLowerCase().replace(/\s+/g, "_"),
          description: formData.description,
          permissions: {},
        });
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      }

      setIsDialogOpen(false);
      loadRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (role: UserRole) => {
    if (role.is_system_role) {
      toast({
        title: "Cannot Delete",
        description: "System roles cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.role_name}"?`)) {
      return;
    }

    try {
      await roleService.delete(role.id);
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      loadRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: roles.length,
    system: roles.filter(r => r.is_system_role).length,
    custom: roles.filter(r => !r.is_system_role).length,
  };

  return (
    <>
      <SEO title="User Roles - Softo ERP" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Roles</h1>
              <p className="text-muted-foreground mt-1">
                Manage user roles and permissions
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/users">
                <Button variant="outline">
                  Back to Users
                </Button>
              </Link>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRole ? "Edit Role" : "Create New Role"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Role Name *</Label>
                      <Input
                        id="roleName"
                        value={formData.roleName}
                        onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                        placeholder="e.g., Sales Manager"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roleCode">Role Code *</Label>
                      <Input
                        id="roleCode"
                        value={formData.roleCode}
                        onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                        placeholder="e.g., sales_manager"
                        disabled={!!editingRole}
                        required
                      />
                      {editingRole && (
                        <p className="text-xs text-muted-foreground">
                          Role code cannot be changed after creation
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the role's responsibilities"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingRole ? "Update Role" : "Create Role"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Roles</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.system}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.custom}</div>
              </CardContent>
            </Card>
          </div>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Roles ({roles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading roles...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No roles found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold text-sm">Role Name</th>
                        <th className="text-left p-4 font-semibold text-sm">Code</th>
                        <th className="text-left p-4 font-semibold text-sm">Description</th>
                        <th className="text-left p-4 font-semibold text-sm">Type</th>
                        <th className="text-right p-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <span className="font-medium">{role.role_name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {role.role_code}
                            </code>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {role.description || "No description"}
                            </p>
                          </td>
                          <td className="p-4">
                            {role.is_system_role ? (
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                System
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                Custom
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(role)}
                                disabled={role.is_system_role}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(role)}
                                disabled={role.is_system_role}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">About User Roles</p>
                  <p className="text-sm text-muted-foreground">
                    • <strong>System Roles</strong> are pre-defined and cannot be deleted or modified<br />
                    • <strong>Custom Roles</strong> can be created, edited, and deleted as needed<br />
                    • Each user can be assigned one role that determines their access permissions<br />
                    • Roles can be managed separately from user assignments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}