// ============================================
// 🎨 THEME — Central design tokens
// Change values here to update the entire app
// ============================================

// ===== TEXT (black-based scale for clear, readable body copy) =====
const TEXT_PRIMARY = "#0a0a0a";
const TEXT_SECONDARY = "#1a1a1a";
const TEXT_MUTED = "#4b5563";
const TEXT_DISABLED = "#9ca3af";
const TEXT_INVERSE = "#E5E7EB";
const TEXT_WHITE = "#FFF"

// ===== BRAND NAVY =====
const NAVY = "#0f3569";
const NAVY_HOVER = "#082347";
const NAVY_LIGHT = "#eaf0f9";

export const COLORS = {
  // ===== BRAND =====
  primary:            NAVY,
  primaryHover:       NAVY_HOVER,
  primaryLight:       NAVY_LIGHT,
  secondary:          NAVY,
  secondaryHover:     NAVY_HOVER,
  secondaryLight:     NAVY_LIGHT,

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
  sidebarNavHoverText:    TEXT_WHITE,
  sidebarNavActiveBg:     TEXT_WHITE,
  sidebarNavActiveText:   TEXT_PRIMARY,
  sidebarChevron:         TEXT_INVERSE,
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
  inputBorderFocus:  NAVY,
  inputPlaceholder:  TEXT_MUTED,
  inputText:         TEXT_PRIMARY,

  // ===== BUTTON =====
  btnPrimaryBg:       NAVY,
  btnPrimaryText:     "#ffffff",
  btnPrimaryHover:    NAVY_HOVER,
  btnSecondaryBg:     "#ffffff",
  btnSecondaryText:   NAVY,
  btnSecondaryBorder: "#d1d5db",
  btnSecondaryHover:  NAVY_LIGHT,

  // ===== LINK =====
  link:       NAVY,
  linkHover:  NAVY_HOVER,
};

// Medium, readable sizing — one notch up across the board from the old
// 10–18px scale, which read as cramped/too-small throughout the app.
export const FONT = {
  family: "'DM Sans', 'Inter', sans-serif",
  size: {
    xs:  "12px",
    sm:  "13px",
    md:  "15px",
    lg:  "16px",
    xl:  "18px",
    xxl: "22px",
  },
  weight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
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
