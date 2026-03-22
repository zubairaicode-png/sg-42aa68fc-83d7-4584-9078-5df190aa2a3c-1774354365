import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      // Company Information
      companyName,
      companyNameArabic,
      email,
      phone,
      address,
      city,
      country,
      postalCode,
      
      // Tax Information
      vatNumber,
      taxRegistrationNumber,
      commercialRegistration,
      
      // Admin User
      adminFullName,
      adminEmail,
      adminPassword,
    } = req.body;

    // Validate required fields
    if (!companyName || !email || !phone || !vatNumber || !commercialRegistration || !adminFullName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if location already exists (by email)
    const { data: existingCompany } = await supabase
      .from("business_locations")
      .select("id")
      .eq("email", email)
      .single();

    if (existingCompany) {
      return res.status(400).json({ error: "Company with this email already exists" });
    }

    // Check if admin email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "A user with this email already exists" });
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create company record as a business location
    // Generate a unique location code
    const locationCode = `HQ-${Math.floor(Math.random() * 10000)}`;

    const { data: company, error: companyError } = await supabase
      .from("business_locations")
      .insert({
        location_code: locationCode,
        location_name: companyName,
        location_name_ar: companyNameArabic,
        email: email,
        phone: phone,
        address: address,
        city: city,
        country: country || "Saudi Arabia",
        postal_code: postalCode,
        is_default: true,
        status: 'active',
      })
      .select()
      .single();

    if (companyError) {
      console.error("Error creating company:", companyError);
      return res.status(500).json({ error: "Failed to create company" });
    }

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        business_location_id: company.id,
        email: adminEmail,
        password_hash: hashedPassword,
        full_name: adminFullName,
        role: "admin",
        status: "active",
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating admin user:", userError);
      // Rollback: Delete the company if user creation fails
      await supabase.from("business_locations").delete().eq("id", company.id);
      return res.status(500).json({ error: "Failed to create admin user" });
    }

    return res.status(201).json({
      message: "Company registered successfully",
      company: {
        id: company.id,
        name: company.location_name,
      },
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}