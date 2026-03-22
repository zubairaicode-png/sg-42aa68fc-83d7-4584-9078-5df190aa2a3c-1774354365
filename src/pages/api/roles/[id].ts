import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid role ID" });
  }

  try {
    // Verify user is authenticated
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      // Update role
      const { name, description, permissions } = req.body;

      const updateData: any = {};
      if (name) {
        updateData.role_name = name;
        updateData.role_code = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "");
      }
      if (description !== undefined) updateData.description = description;
      if (permissions !== undefined) updateData.permissions = permissions;

      const { data, error } = await supabase
        .from("user_roles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating role:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } else if (req.method === "DELETE") {
      // Delete role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", id)
        .eq("is_system_role", false); // Prevent deleting system roles

      if (error) {
        console.error("Error deleting role:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Role operation error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}