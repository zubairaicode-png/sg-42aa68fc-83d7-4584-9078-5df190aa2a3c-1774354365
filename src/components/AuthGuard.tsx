import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const publicPaths = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password"];
      const isPublicPath = publicPaths.includes(router.pathname);

      if (!session && !isPublicPath) {
        router.push("/auth/login");
      } else if (session && isPublicPath) {
        router.push("/");
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const publicPaths = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password"];
      const isPublicPath = publicPaths.includes(router.pathname);

      if (event === "SIGNED_OUT" && !isPublicPath) {
        router.push("/auth/login");
      } else if (event === "SIGNED_IN" && isPublicPath) {
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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