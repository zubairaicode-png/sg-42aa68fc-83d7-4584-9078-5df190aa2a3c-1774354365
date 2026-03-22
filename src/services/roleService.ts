export const roleService = {
  async getAll() {
    try {
      const response = await fetch("/api/roles");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch roles");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  },

  async create(roleData: { name: string; description?: string; permissions?: Record<string, boolean> }) {
    try {
      console.log("Creating role with data:", roleData);

      const response = await fetch("/api/roles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error:", error);
        throw new Error(error.error || "Failed to create role");
      }

      const data = await response.json();
      console.log("Role created successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Error creating role:", error);
      throw error;
    }
  },

  async update(id: string, roleData: { name?: string; description?: string; permissions?: Record<string, boolean> }) {
    try {
      console.log("Updating role:", id, roleData);

      const response = await fetch(`/api/roles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error:", error);
        throw new Error(error.error || "Failed to update role");
      }

      const data = await response.json();
      console.log("Role updated successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Error updating role:", error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      console.log("Deleting role:", id);

      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error:", error);
        throw new Error(error.error || "Failed to delete role");
      }

      const data = await response.json();
      console.log("Role deleted successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Error deleting role:", error);
      throw error;
    }
  },
};