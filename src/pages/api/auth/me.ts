import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}