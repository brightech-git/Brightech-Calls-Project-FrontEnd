const token = (name: string) => `var(--${name})`;
export const COLORS = {
  primary: token('primary'), primaryHover: token('primary-hover'), primaryLight: token('primary-light'),
  secondary: token('secondary'), secondaryHover: token('secondary'), secondaryLight: token('primary-light'),
  shellBg: token('sidebar'), shellBorder: token('border'), contentBg: token('bg'),
  sidebarLogoIconBg: token('primary'), sidebarLogoIconColor: '#fff', sidebarLogoText: '#fff', sidebarLogoSub: '#aebcda',
  sidebarSectionLabel: '#91a1c3', sidebarNavText: '#c5cfe4', sidebarNavHoverBg: 'rgba(255,255,255,.08)', sidebarNavHoverText: '#fff',
  sidebarNavActiveBg: token('primary'), sidebarNavActiveText: '#fff', sidebarChevron: '#aebcda', sidebarChevronActive: '#fff',
  sidebarChildDot: '#91a1c3', sidebarChildDotActive: '#fff', sidebarScrollThumb: '#485875',
  sidebarUserName: '#fff', sidebarUserRole: '#aebcda', sidebarUserHoverBg: 'rgba(255,255,255,.08)',
  sidebarLogoutBg: 'rgba(255,255,255,.08)', sidebarLogoutColor: '#c5cfe4', sidebarLogoutHoverBg: '#422533', sidebarLogoutHoverColor: '#fda4af',
  topbarTitle: token('text-main'), topbarSubtitle: token('text-muted'), topbarDivider: token('border'),
  topbarIconBg: token('surface'), topbarIconColor: token('text-muted'), topbarIconHoverBg: token('primary-light'), topbarIconHoverColor: token('primary'),
  textPrimary: token('text-main'), textSecondary: '#34445d', textMuted: token('text-muted'), textDisabled: '#94a3b8',
  gray50: '#f8fafc', gray100: '#f1f5f9', gray200: token('border'), gray300: '#cbd5e1', gray400: '#94a3b8',
  gray500: '#64748b', gray600: '#475569', gray700: '#334155', gray800: '#1e293b', gray900: '#0f172a',
  success: '#15803d', successBg: '#ecfdf3', error: '#be123c', errorBg: '#fff1f2', warning: '#a16207', warningBg: '#fffbeb', info: '#1d4ed8', infoBg: '#eff6ff',
  cardBg: token('surface'), cardBorder: token('border'), cardShadow: 'rgba(15,23,42,.05)',
  inputBg: token('surface'), inputBorder: '#cbd5e1', inputBorderFocus: token('primary'), inputPlaceholder: '#77859b', inputText: token('text-main'),
  btnPrimaryBg: token('primary'), btnPrimaryText: '#fff', btnPrimaryHover: token('primary-hover'),
  btnSecondaryBg: token('surface'), btnSecondaryText: token('text-main'), btnSecondaryBorder: token('border'), btnSecondaryHover: token('primary-light'),
  link: token('primary'), linkHover: token('primary-hover'),
};
export const FONT = {
  family: "var(--font-poppins), 'Poppins', sans-serif",
  size: { xs: 'var(--font-xs)', sm: 'var(--font-sm)', md: 'var(--font-md)', lg: 'var(--font-lg)', xl: 'var(--font-xl)', xxl: 'var(--font-xxl)' },
  weight: { regular: 400, medium: 400, semibold: 400, bold: 400 },
};
export const RADIUS = { sm: '6px', md: '10px', lg: '14px', xl: '20px', full: '9999px' };
export const THEME_PRESETS = {
  ocean: { name: 'Ocean', primary: '#2859d8', secondary: '#0e7490', sidebar: '#111e38' },
  forest: { name: 'Forest', primary: '#087f5b', secondary: '#0e7490', sidebar: '#102c29' },
  violet: { name: 'Violet', primary: '#7040c8', secondary: '#2563eb', sidebar: '#201a38' },
  ember: { name: 'Ember', primary: '#b93c60', secondary: '#b45309', sidebar: '#321d2b' },
} as const;
export type ThemePreset = keyof typeof THEME_PRESETS;
export type Appearance = { preset: ThemePreset; density: 'comfortable' | 'compact'; textSize: 'standard' | 'large' };
export const DEFAULT_APPEARANCE: Appearance = { preset: 'ocean', density: 'comfortable', textSize: 'standard' };
export const APPEARANCE_KEY = 'calls-appearance';
const theme = { COLORS, FONT, RADIUS };
export default theme;
