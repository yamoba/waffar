"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/stores/auth";
import { LanguageProvider } from "@/lib/i18n";
import { CommerceProvider } from "@/stores/commerce";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const fetchUser = useAuth((s) => s.fetchUser);
  useEffect(() => { fetchUser(); }, [fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LanguageProvider>
          <CommerceProvider>{children}</CommerceProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
