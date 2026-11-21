'use client';

import { ChakraProvider, ClientOnly } from '@chakra-ui/react';
import { chakraSystem } from '@/lib/chakra-system';
import { AppQueryProvider } from '@/lib/query/provider';

import { PageHeaderProvider } from '@/src/context/PageHeaderContext';
import { ThemeProvider, ThemeStudioProvider } from '@/src/theme';
import { ToastProvider } from '@/src/components/Toast';
import { EnterNavigation } from '@/src/components/form';
import { SidebarProvider } from '@/src/context/layout/SideBarContext';
import { Toaster } from '@/src/components/ui/toaster';
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
            <ThemeStudioProvider>
              <PageHeaderProvider>
                <ToastProvider>
                  <SidebarProvider>
                    <Toaster />
                    <EnterNavigation />
                    {children}
                  </SidebarProvider>
                </ToastProvider>
              </PageHeaderProvider>
            </ThemeStudioProvider>
          </ThemeProvider>
        </ChakraProvider>
      </ClientOnly>
    </AppQueryProvider>
  );
}
