import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { roleService } from "@/services/roleService";
import { Shield, Plus, Edit, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

// Define all available permissions grouped by category
const PERMISSION_CATEGORIES = {
  "Dashboard": [
    { key: "view_dashboard", label: "View Dashboard" },
    { key: "view_analytics", label: "View Analytics" },
  ],
  "Sales": [
    { key: "view_sales", label: "View Sales" },
    { key: "create_sales", label: "Create Sales" },
    { key: "edit_sales", label: "Edit Sales" },
    { key: "delete_sales", label: "Delete Sales" },
    { key: "view_quotations", label: "View Quotations" },
    { key: "create_quotations", label: "Create Quotations" },
  ],
  "Purchases": [
    { key: "view_purchases", label: "View Purchases" },
    { key: "create_purchases", label: "Create Purchases" },
    { key: "edit_purchases", label: "Edit Purchases" },
    { key: "delete_purchases", label: "Delete Purchases" },
  ],
  "Inventory": [
    { key: "view_inventory", label: "View Inventory" },
    { key: "create_products", label: "Create Products" },
    { key: "edit_products", label: "Edit Products" },
    { key: "delete_products", label: "Delete Products" },
  ],
  "Customers": [
    { key: "view_customers", label: "View Customers" },
    { key: "create_customers", label: "Create Customers" },
    { key: "edit_customers", label: "Edit Customers" },
    { key: "delete_customers", label: "Delete Customers" },
  ],
  "Suppliers": [
    { key: "view_suppliers", label: "View Suppliers" },
    { key: "create_suppliers", label: "Create Suppliers" },
    { key: "edit_suppliers", label: "Edit Suppliers" },
    { key: "delete_suppliers", label: "Delete Suppliers" },
  ],
  "Accounting": [
    { key: "view_accounting", label: "View Accounting" },
    { key: "create_journal", label: "Create Journal Entries" },
    { key: "view_chart_accounts", label: "View Chart of Accounts" },
    { key: "bank_reconciliation", label: "Bank Reconciliation" },
    { key: "fixed_assets", label: "Manage Fixed Assets" },
  ],
  "Reports": [
    { key: "view_reports", label: "View Reports" },
    { key: "export_reports", label: "Export Reports" },
    { key: "financial_reports", label: "View Financial Reports" },
    { key: "vat_reports", label: "View VAT Reports" },
  ],
  "Expenses": [
    { key: "view_expenses", label: "View Expenses" },
    { key: "create_expenses", label: "Create Expenses" },
    { key: "edit_expenses", label: "Edit Expenses" },
    { key: "delete_expenses", label: "Delete Expenses" },
  ],
  "ZATCA": [
    { key: "view_zatca", label: "View ZATCA" },
    { key: "manage_zatca", label: "Manage ZATCA Integration" },
  ],
  "Settings": [
    { key: "view_settings", label: "View Settings" },
    { key: "edit_settings", label: "Edit Settings" },
    { key: "manage_locations", label: "Manage Business Locations" },
  ],
  "User Management": [
    { key: "view_users", label: "View Users" },
    { key: "create_users", label: "Create Users" },
    { key: "edit_users", label: "Edit Users" },
    { key: "delete_users", label: "Delete Users" },
    { key: "manage_roles", label: "Manage Roles & Permissions" },
  ],
};

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, boolean>,
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

  const handleCreateNew = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: {},
    });
    setDialogOpen(true);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || {},
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (role: any) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      setDeleting(true);
      await roleService.delete(roleToDelete.id);
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      loadRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePermissionToggle = (permissionKey: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: !prev.permissions[permissionKey],
      },
    }));
  };

  const handleSelectAll = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
    const newPermissions = { ...formData.permissions };
    
    const allSelected = categoryPermissions.every(p => newPermissions[p.key]);
    
    categoryPermissions.forEach(p => {
      newPermissions[p.key] = !allSelected;
    });

    setFormData(prev => ({ ...prev, permissions: newPermissions }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      console.log("Saving role with data:", {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });

      if (editingRole) {
        console.log("Updating existing role:", editingRole.id);
        await roleService.update(editingRole.id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      } else {
        console.log("Creating new role...");
        const result = await roleService.create({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
        console.log("Role created successfully:", result);
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      }

      setDialogOpen(false);
      loadRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionCount = (role: any) => {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).filter(Boolean).length;
  };

  const isSystemRole = (roleName: string) => {
    return ["super_admin", "admin", "manager", "accountant", "sales", "inventory", "viewer"].includes(roleName);
  };

  return (
    <>
      <SEO title="Role Management - Softo ERP" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/users">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Users
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">Role Management</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage user roles with custom permissions
              </p>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          {/* Roles Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Loading roles...</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No roles yet. Create your first role!</p>
              </div>
            ) : (
              roles.map((role) => (
                <Card key={role.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {role.name}
                        </CardTitle>
                        {role.description && (
                          <CardDescription className="mt-2">
                            {role.description}
                          </CardDescription>
                        )}
                      </div>
                      {isSystemRole(role.name) && (
                        <Badge variant="outline" className="ml-2">System</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{getPermissionCount(role)} permissions assigned</span>
                      </div>

                      {!isSystemRole(role.name) && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(role)}
                            className="flex-1 text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Create/Edit Role Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription>
                Define role name, description, and assign permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sales Manager, Warehouse Staff"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose of this role..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Permissions</h3>
                
                {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{category}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAll(category)}
                        >
                          Select All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {permissions.map((permission) => (
                          <div key={permission.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.key}
                              checked={!!formData.permissions[permission.key]}
                              onCheckedChange={() => handlePermissionToggle(permission.key)}
                            />
                            <Label
                              htmlFor={permission.key}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {permission.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete role "{roleToDelete?.name}"? This action cannot be undone.
                Users with this role will lose their permissions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </>
  );
}