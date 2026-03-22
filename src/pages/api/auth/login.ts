import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("Password length:", password?.length);

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Query the users table
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    console.log("Database query result:");
    console.log("- User found:", !!user);
    console.log("- Error:", error?.message);
    
    if (user) {
      console.log("- User ID:", user.id);
      console.log("- User status:", user.status);
      console.log("- Hash starts with:", user.password_hash?.substring(0, 20));
    }

    if (error || !user) {
      console.log("User not found in database");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log("User account is inactive");
      return res.status(403).json({ error: "Account is inactive" });
    }

    console.log("Verifying password with bcrypt...");
    
    // Direct bcrypt comparison
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    console.log("Password verification result:", isValidPassword);

    if (!isValidPassword) {
      console.log("❌ Password verification FAILED");
      console.log("Expected password: admin123");
      console.log("Received password:", password);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("✅ Password verification SUCCESS");
    console.log("Updating last login...");

    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      business_location_id: user.business_location_id,
    });

    console.log("Setting auth cookie...");

    // Set HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    console.log("✅ LOGIN SUCCESSFUL");

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        business_location_id: user.business_location_id,
      },
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}