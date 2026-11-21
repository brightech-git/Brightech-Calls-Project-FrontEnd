'use client';
import { Dialog, Drawer, Portal } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
}
export function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  busy,
}: OverlayProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="w-full max-w-[min(640px,calc(100vw-24px))] rounded-lg bg-white text-ink shadow-lg">
            <Dialog.Header className="relative block border-b border-line px-4 py-3 pr-12">
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-0.5 text-xs text-muted">{description}</Dialog.Description>}
              <Dialog.CloseTrigger asChild className="absolute top-2 right-2">
                <Button
                  disabled={busy}
                  variant="ghost"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body className="px-4 py-3">{children}</Dialog.Body>
            {footer && <Dialog.Footer className="flex justify-end gap-2 border-t border-line px-4 py-2.5">{footer}</Dialog.Footer>}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
export function AppDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  busy,
}: OverlayProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content className="w-full max-w-[min(640px,calc(100vw-24px))] rounded-lg bg-white text-ink shadow-lg">
            <Drawer.Header className="relative block border-b border-line px-4 py-3 pr-12">
              <Drawer.Title className="text-base font-semibold">{title}</Drawer.Title>
              {description && <Drawer.Description className="mt-0.5 text-xs text-muted">{description}</Drawer.Description>}
              <Drawer.CloseTrigger asChild className="absolute top-2 right-2">
                <Button
                  disabled={busy}
                  variant="ghost"
                  aria-label="Close drawer"
                >
                  <X size={16} />
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body className="px-4 py-3">{children}</Drawer.Body>
            {footer && <Drawer.Footer className="flex justify-end gap-2 border-t border-line px-4 py-2.5">{footer}</Drawer.Footer>}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
