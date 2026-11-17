'use client';

import { ChakraProvider, ClientOnly } from '@chakra-ui/react';
import { chakraSystem } from '@/lib/chakra-system';
import { AppQueryProvider } from '@/lib/query/provider';

import { PageHeaderProvider } from '@/context/PageHeaderContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { SidebarProvider } from '@/context/layout/SideBarContext';
import { Toaster } from '@/components/ui/toaster';
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppQueryProvider>
      <ClientOnly
        fallback={
          <div
            className="grid min-h-dvh place-items-center bg-white text-sm text-muted"
            role="status"
          >
            Opening your workspace…
          </div>
        }
      >
        <ChakraProvider value={chakraSystem}>
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
    </AppQueryProvider>
  );
}
