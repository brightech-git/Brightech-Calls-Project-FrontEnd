// ============================================
// 🎨 THEME — Central design tokens
// Change values here to update the entire app
// ============================================

export const COLORS = {
  // ===== BRAND =====
  primary:            "#111827",
  primaryHover:       "#1f2937",
  primaryLight:       "#f3f4f6",

  // ===== SHELL (Sidebar + Topbar share these) =====
  shellBg:            "#ffffff",
  shellBorder:        "#e5e7eb",
  contentBg:          "#f5f5f5",

  // ===== SIDEBAR =====
  sidebarLogoIconBg:      "#111827",
  sidebarLogoIconColor:   "#ffffff",
  sidebarLogoText:        "#111827",
  sidebarLogoSub:         "#6b7280",
  sidebarSectionLabel:    "#9ca3af",
  sidebarNavText:         "#6b7280",
  sidebarNavHoverBg:      "#f3f4f6",
  sidebarNavHoverText:    "#111827",
  sidebarNavActiveBg:     "#f3f4f6",
  sidebarNavActiveText:   "#111827",
  sidebarChevron:         "#9ca3af",
  sidebarChevronActive:   "#111827",
  sidebarChildDot:        "#d1d5db",
  sidebarChildDotActive:  "#111827",
  sidebarScrollThumb:     "#d1d5db",
  sidebarUserName:        "#111827",
  sidebarUserRole:        "#6b7280",
  sidebarUserHoverBg:     "#f3f4f6",
  sidebarLogoutBg:        "#f3f4f6",
  sidebarLogoutColor:     "#6b7280",
  sidebarLogoutHoverBg:   "#fee2e2",
  sidebarLogoutHoverColor:"#ef4444",

  // ===== TOPBAR =====
  topbarTitle:            "#111827",
  topbarSubtitle:         "#6b7280",
  topbarDivider:          "#e5e7eb",
  topbarIconBg:           "#f9fafb",
  topbarIconColor:        "#6b7280",
  topbarIconHoverBg:      "#f3f4f6",
  topbarIconHoverColor:   "#111827",

  // ===== TEXT =====
  textPrimary:   "#111827",
  textSecondary: "#6b7280",
  textMuted:     "#9ca3af",
  textDisabled:  "#d1d5db",

  // ===== GRAY SCALE =====
  gray50:  "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",

  // ===== STATUS =====
  success:    "#16a34a",
  successBg:  "#dcfce7",
  error:      "#ef4444",
  errorBg:    "#fee2e2",
  warning:    "#b45309",
  warningBg:  "#fef9c3",
  info:       "#3b82f6",
  infoBg:     "#dbeafe",

  // ===== CARD =====
  cardBg:     "#ffffff",
  cardBorder: "#e5e7eb",
  cardShadow: "rgba(0,0,0,0.06)",

  // ===== INPUT =====
  inputBg:           "#ffffff",
  inputBorder:       "#d1d5db",
  inputBorderFocus:  "#6b7280",
  inputPlaceholder:  "#9ca3af",
  inputText:         "#111827",

  // ===== BUTTON =====
  btnPrimaryBg:       "#111827",
  btnPrimaryText:     "#ffffff",
  btnPrimaryHover:    "#1f2937",
  btnSecondaryBg:     "#ffffff",
  btnSecondaryText:   "#374151",
  btnSecondaryBorder: "#d1d5db",
  btnSecondaryHover:  "#f3f4f6",
};

export const FONT = {
  family: "'DM Sans', 'Inter', sans-serif",
  size: {
    xs:  "10px",
    sm:  "11px",
    md:  "13px",
    lg:  "14px",
    xl:  "16px",
    xxl: "18px",
  },
};

export const RADIUS = {
  sm:   "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "14px",
  full: "9999px",
};

const theme = { COLORS, FONT, RADIUS };
export default theme;
