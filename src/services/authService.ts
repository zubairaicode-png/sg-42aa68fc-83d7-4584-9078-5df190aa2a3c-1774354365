export const authService = {
  // Get current user from session
  async getCurrentUser() {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return await response.json();
  },

  // Sign out
  async signOut() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    // Redirect to login page
    window.location.href = "/auth/login";
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/me");
      return response.ok;
    } catch {
      return false;
    }
  },

  // Get user role
  async getUserRole(): Promise<string> {
    const user = await this.getCurrentUser();
    return user?.role || "viewer";
  },

  // Create new user (admin only)
  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    business_location_id: string;
  }) {
    const response = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create user");
    }

    return await response.json();
  },
};