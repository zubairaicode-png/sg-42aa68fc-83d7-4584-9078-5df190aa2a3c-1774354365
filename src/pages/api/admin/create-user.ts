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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName, role } = req.body;

    // Validate input
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create user with admin privileges
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

    // Update user profile with role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return res.status(400).json({ error: profileError.message });
    }

    return res.status(200).json({ 
      success: true, 
      userId: authData.user.id 
    });
  } catch (error: any) {
    console.error("Error in create-user API:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}