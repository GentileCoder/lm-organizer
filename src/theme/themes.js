/**
 * The 7 selectable visual themes. Each has its own light/dark color+font tokens in
 * styles/tokens.css (data-app-theme + data-app-mode attribute pairs) — this registry is
 * what the theme store and Settings screen need to know without reading CSS.
 */
export const THEMES = [
  {
    id: 'deepwork',
    name: 'Deepwork',
    defaultMode: 'dark',
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap',
    preview: { bg: '#0A0D14', accent: '#E3A03D' },
  },
  {
    id: 'paper',
    name: 'Paper',
    defaultMode: 'light',
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;600;700&display=swap',
    preview: { bg: '#FAF6EF', accent: '#C1622D' },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    defaultMode: 'dark',
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    preview: { bg: '#08090B', accent: '#7C5CFC' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    defaultMode: 'light',
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Mulish:wght@400;500;600;700&display=swap',
    preview: { bg: '#FF9A76', accent: '#E8503A' },
  },
  {
    id: 'realmadrid',
    name: 'Real Madrid',
    defaultMode: 'light',
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap',
    preview: { bg: '#FFFFFF', accent: '#0A3D91' },
  },
  {
    id: 'cuba',
    name: 'Cuba',
    defaultMode: 'light',
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Pacifico&family=Rubik:wght@400;500;600;700&display=swap',
    preview: { bg: '#FFF7EC', accent: '#E4402E' },
  },
  {
    id: 'brazil',
    name: 'Brazil',
    defaultMode: 'light',
    fontsUrl:
      'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Poppins:wght@400;500;600;700&display=swap',
    preview: { bg: '#FFFDF5', accent: '#FFCC29' },
  },
]

export const DEFAULT_THEME_ID = 'deepwork'

export function getTheme(id) {
  return THEMES.find(t => t.id === id) || THEMES.find(t => t.id === DEFAULT_THEME_ID)
}
