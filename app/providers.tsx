"use client";

import { ui } from "@/utils/ui";
import { ChakraProvider, ClientOnly, defaultSystem } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";
import { SidebarProvider } from "@/context/layout/SideBarContext";
import { Toaster } from "@/components/ui/toaster";
export function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>
      <ClientOnly fallback={<div className={ui("session-loading")} role="status">Opening your workspace…</div>}>
      <ChakraProvider value={defaultSystem}>
        <ThemeProvider>
          <PageHeaderProvider>
            <ToastProvider>
              <SidebarProvider>
                <Toaster />
                {children}
              </SidebarProvider>
            </ToastProvider>
          </PageHeaderProvider>
        </ThemeProvider>
      </ChakraProvider>
      </ClientOnly>
    </QueryClientProvider>;
}
