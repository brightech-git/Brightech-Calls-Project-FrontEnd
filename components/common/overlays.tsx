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
          <Dialog.Content className="workspace-overlay">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              {description && <Dialog.Description>{description}</Dialog.Description>}
              <Dialog.CloseTrigger asChild>
                <Button
                  disabled={busy}
                  variant="ghost"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            {footer && <Dialog.Footer>{footer}</Dialog.Footer>}
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
          <Drawer.Content className="workspace-overlay">
            <Drawer.Header>
              <Drawer.Title>{title}</Drawer.Title>
              {description && <Drawer.Description>{description}</Drawer.Description>}
              <Drawer.CloseTrigger asChild>
                <Button
                  disabled={busy}
                  variant="ghost"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>{children}</Drawer.Body>
            {footer && <Drawer.Footer>{footer}</Drawer.Footer>}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
