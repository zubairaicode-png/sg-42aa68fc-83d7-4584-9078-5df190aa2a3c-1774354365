import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Try using the service role key, but with fallback to regular client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use service role if available, otherwise use anon key
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
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
  console.log("=== CREATE USER API ENDPOINT ===");
  console.log("Method:", req.method);
  console.log("Supabase URL:", supabaseUrl);
  console.log("Has Service Role Key:", !!supabaseServiceKey);
  console.log("Service Role Key length:", supabaseServiceKey?.length || 0);
  console.log("Using Admin API:", !!supabaseServiceKey);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName, role } = req.body;

    console.log("Request body:", { email, fullName, role, hasPassword: !!password });

    // Validate input
    if (!email || !password || !fullName || !role) {
      console.error("Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    let userId: string;

    // Try admin API if service role key is available
    if (supabaseServiceKey && supabaseServiceKey.length > 100) {
      console.log("Attempting admin user creation...");
      
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        }
      });

      if (createError) {
        console.error("Admin creation error:", createError);
        
        // If admin API fails, fall back to regular signup
        console.log("Admin API failed, trying regular signup...");
        const { data: signupData, error: signupError } = await supabaseAdmin.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (signupError) {
          console.error("Signup error:", signupError);
          return res.status(400).json({ error: signupError.message });
        }

        if (!signupData.user) {
          return res.status(400).json({ error: "User creation failed" });
        }

        userId = signupData.user.id;
        console.log("User created via signup, ID:", userId);
      } else {
        if (!authData.user) {
          return res.status(400).json({ error: "User creation failed" });
        }
        userId = authData.user.id;
        console.log("User created via admin API, ID:", userId);
      }
    } else {
      // No service role key, use regular signup
      console.log("No service role key, using regular signup...");
      
      const { data: signupData, error: signupError } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (signupError) {
        console.error("Signup error:", signupError);
        return res.status(400).json({ error: signupError.message });
      }

      if (!signupData.user) {
        return res.status(400).json({ error: "User creation failed" });
      }

      userId = signupData.user.id;
      console.log("User created via signup, ID:", userId);
    }

    // Update user profile with role
    console.log("Updating profile with role:", role);
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the request if profile update fails
      console.warn("Profile update failed, but user was created");
    } else {
      console.log("Profile updated successfully");
    }

    console.log("=== USER CREATION SUCCESS ===");
    return res.status(200).json({ 
      success: true, 
      userId: userId 
    });
  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR ===");
    console.error("Error in create-user API:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}