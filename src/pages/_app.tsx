import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </ThemeProvider>
  );
}