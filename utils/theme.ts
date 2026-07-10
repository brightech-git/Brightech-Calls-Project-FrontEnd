// ============================================
// 🎨 THEME — Central design tokens
// Change values here to update the entire app
// ============================================

// ===== TEXT (slate, tinted toward the brand blue for a more
// professional/readable feel than flat neutral gray) =====
const TEXT_PRIMARY = "#1b2499";
const TEXT_SECONDARY = "#111";
const TEXT_MUTED = "#333";
const TEXT_DISABLED = "#444";
const TEXT_INVERSE = "#DEDEDE";
const TEXT_WHITE = "#FFF"

export const COLORS = {
  // ===== BRAND =====
  primary:            "#FFFFFF",
  primaryHover:       "#DDDDDD",
  primaryLight:       "#f3f4f6",
  secondary:          "#216fec",
  secondaryHover:     "#073eb6",
  secondaryLight:     "#eff6ff",

  // ===== SHELL (Sidebar + Topbar share these) =====
  shellBg:            "#03163d",
  shellBorder:        "#e5e7eb",
  contentBg:          "#f5f5f5",

  // ===== SIDEBAR =====
  sidebarLogoIconBg:      "#071638",
  sidebarLogoIconColor:   "#ffffff",
  sidebarLogoText:        TEXT_WHITE,
  sidebarLogoSub:         TEXT_INVERSE,
  sidebarSectionLabel:    TEXT_WHITE,
  sidebarNavText:         TEXT_INVERSE,
  sidebarNavHoverBg:      TEXT_WHITE,
  sidebarNavHoverText:    TEXT_PRIMARY,
  sidebarNavActiveBg:     TEXT_WHITE,
  sidebarNavActiveText:   TEXT_PRIMARY,
  sidebarChevron:         TEXT_MUTED,
  sidebarChevronActive:   TEXT_WHITE,
  sidebarChildDot:        "#d1d5db",
  sidebarChildDotActive:  TEXT_WHITE,
  sidebarScrollThumb:     TEXT_WHITE,
  sidebarUserName:        TEXT_WHITE,
  sidebarUserRole:        TEXT_INVERSE,
  sidebarUserHoverBg:      TEXT_WHITE,
  sidebarLogoutBg:        "#f3f4f6",
  sidebarLogoutColor:     TEXT_SECONDARY,
  sidebarLogoutHoverBg:   "#fee2e2",
  sidebarLogoutHoverColor:"#ef4444",

  // ===== TOPBAR =====
  topbarTitle:          TEXT_WHITE,
  topbarSubtitle:         TEXT_INVERSE,
  topbarDivider:          "#e5e7eb",
  topbarIconBg:           "#f9fafb",
  topbarIconColor: TEXT_INVERSE,
  topbarIconHoverBg:      "#f3f4f6",
  topbarIconHoverColor: TEXT_WHITE,

  // ===== TEXT =====
  textPrimary:   TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  textMuted:     TEXT_MUTED,
  textDisabled:  TEXT_DISABLED,

  // ===== GRAY SCALE =====
  gray50:  "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: TEXT_MUTED,
  gray500: TEXT_SECONDARY,
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: TEXT_PRIMARY,

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
  inputBorderFocus:  TEXT_SECONDARY,
  inputPlaceholder:  TEXT_MUTED,
  inputText:         TEXT_PRIMARY,

  // ===== BUTTON =====
  btnPrimaryBg:       "#111827",
  btnPrimaryText:     "#ffffff",
  btnPrimaryHover:    "#1f2937",
  btnSecondaryBg:     "#ffffff",
  btnSecondaryText:   TEXT_SECONDARY,
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
