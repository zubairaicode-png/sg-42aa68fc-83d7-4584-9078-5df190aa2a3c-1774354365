import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

    const { name, description, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Role name is required" });
    }

    // Generate role code from name
    const roleCode = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    // Use service role key to bypass RLS
    const supabaseAdmin = supabase;

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .insert({
        role_name: name,
        role_code: roleCode,
        description: description || null,
        permissions: permissions || {},
        is_system_role: false,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating role:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Create role error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}