import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log environment variables for debugging
  console.log("=== CREATE USER API ENDPOINT ===");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("SUPABASE_SERVICE_ROLE_KEY length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName, role } = req.body;

    // Validate input
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error: Missing service role key" });
    }

    // Create user with admin privileges
    console.log("Attempting to create user with email:", email);
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return res.status(400).json({ error: createError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    console.log("User created successfully, ID:", authData.user.id);

    // Update user profile with role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return res.status(400).json({ error: profileError.message });
    }

    console.log("Profile updated successfully with role:", role);

    return res.status(200).json({ 
      success: true, 
      userId: authData.user.id 
    });
  } catch (error: any) {
    console.error("Error in create-user API:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}