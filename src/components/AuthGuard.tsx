import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const publicPaths = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/register-company"];
        const isPublicPath = publicPaths.includes(router.pathname);

        if (response.ok) {
          setAuthenticated(true);
          if (isPublicPath) {
            router.push("/");
          }
        } else {
          setAuthenticated(false);
          if (!isPublicPath) {
            router.push("/auth/login");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        const publicPaths = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/register-company"];
        const isPublicPath = publicPaths.includes(router.pathname);
        
        setAuthenticated(false);
        if (!isPublicPath) {
          router.push("/auth/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}