"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeaderProvider } from "@/context/PageHeaderContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={defaultSystem}>
        <PageHeaderProvider>
          {children}
        </PageHeaderProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}
