import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword } from "@/lib/auth";
import { verifyToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the admin user making the request
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const adminUser = await verifyToken(token);
    if (!adminUser || !["admin", "super_admin"].includes(adminUser.role)) {
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }

    const { email, password, full_name, role, business_location_id } = req.body;

    // Validation
    if (!email || !password || !full_name || !role || !business_location_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        role,
        business_location_id,
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      console.error("User creation error:", createError);
      return res.status(500).json({ error: "Failed to create user" });
    }

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        business_location_id: newUser.business_location_id,
      },
    });
  } catch (error) {
    console.error("User creation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}