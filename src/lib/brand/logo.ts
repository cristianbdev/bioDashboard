export const ATLAS_LOGO = {
  light: "/atlas_biosecurity_logo.svg",
  dark: "/atlas_biosecurity_logo_dark.svg",
} as const;

/** Favicon / PWA icons with OS theme preference */
export const ATLAS_LOGO_ICONS = [
  { url: ATLAS_LOGO.light, type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
  { url: ATLAS_LOGO.dark, type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
] as const;
