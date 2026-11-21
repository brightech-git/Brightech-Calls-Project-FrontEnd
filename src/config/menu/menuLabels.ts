import { menuConfig, type MenuEntryConfig } from '@/src/config/menu/menuConfig';

// Navigation modules and contents are stored by their menuConfig `id` slug.
// These helpers turn a stored name back into the label the sidebar shows.
function flattenMenu(entries: MenuEntryConfig[]): MenuEntryConfig[] {
  return entries.flatMap((e) => [e, ...flattenMenu(e.children ?? [])]);
}

const MENU_LABELS = new Map(flattenMenu(menuConfig).map((e) => [e.id, e.label]));

/** Sidebar label for a stored menu id, or the stored name when it is unknown. */
export const labelFor = (name: string) => MENU_LABELS.get(name) ?? name;
