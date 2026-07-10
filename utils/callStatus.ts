// ─────────────────────────────────────────────
// utils/callStatus.ts
// Shared fixed status vocabulary + styling for Call Booking / Call Status.
// Statuses are still stored as a plain string on the backend (STATUS column),
// so any custom/typed-in value is also supported — these are just the
// well-known ones that get their own filter tab + color.
// ─────────────────────────────────────────────

import { COLORS } from "@/utils/theme";

export interface CallStatusOption {
  label: string;
  value: string;
}

export const FIXED_CALL_STATUSES: CallStatusOption[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Working", value: "WORKING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function normalizeStatus(status?: string | null): string {
  return (status || "PENDING").trim().toUpperCase();
}

export function isFixedStatus(status?: string | null): boolean {
  const s = normalizeStatus(status);
  return FIXED_CALL_STATUSES.some((f) => f.value === s);
}

// Friendly label for a raw status value (fixed or custom)
export function getStatusLabel(status?: string | null): string {
  const s = normalizeStatus(status);
  const fixed = FIXED_CALL_STATUSES.find((f) => f.value === s);
  if (fixed) return fixed.label;
  return status ? status : "Pending";
}

export function getCallStatusStyle(status?: string | null): { bg: string; color: string } {
  const s = normalizeStatus(status);
  switch (s) {
    case "PENDING":
      return { bg: COLORS.warningBg, color: COLORS.warning };
    case "ACCEPTED":
      return { bg: COLORS.infoBg, color: COLORS.info };
    case "WORKING":
      return { bg: "#ede9fe", color: "#7c3aed" };
    case "COMPLETED":
      return { bg: COLORS.successBg, color: COLORS.success };
    case "CANCELLED":
      return { bg: COLORS.errorBg, color: COLORS.error };
    default:
      // Unknown / custom typed-in status
      return { bg: COLORS.gray100, color: COLORS.textSecondary };
  }
}

// Deterministic color per staff/user id, so the same person always renders
// with the same accent color across Call Booking / Call Status views.
const STAFF_PALETTE: { bg: string; color: string }[] = [
  { bg: "#dbeafe", color: "#1d4ed8" }, // blue
  { bg: "#dcfce7", color: "#15803d" }, // green
  { bg: "#fef9c3", color: "#a16207" }, // amber
  { bg: "#fce7f3", color: "#be185d" }, // pink
  { bg: "#ede9fe", color: "#6d28d9" }, // violet
  { bg: "#ffedd5", color: "#c2410c" }, // orange
  { bg: "#cffafe", color: "#0e7490" }, // cyan
  { bg: "#fee2e2", color: "#b91c1c" }, // red
];

export function getStaffColor(id: string | number): { bg: string; color: string } {
  const str = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return STAFF_PALETTE[hash % STAFF_PALETTE.length];
}

// The current logged-in session's id (staff/admin userId, or client's clientId)
export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("userId");
  return id || null;
}
