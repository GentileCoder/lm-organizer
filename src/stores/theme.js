import { defineStore } from 'pinia'
import { ref } from 'vue'
import { THEMES, DEFAULT_THEME_ID, getTheme } from '../theme/themes.js'

const THEME_KEY = 'app_theme'
const MODE_KEY = 'app_theme_mode'
const FONT_LINK_ID = 'app-theme-fonts'

function fontLinkEl() {
  let el = document.getElementById(FONT_LINK_ID)
  if (!el) {
    el = document.createElement('link')
    el.id = FONT_LINK_ID
    el.rel = 'stylesheet'
    document.head.appendChild(el)
  }
  return el
}

export const useThemeStore = defineStore('theme', () => {
  const themeId = ref(localStorage.getItem(THEME_KEY) || DEFAULT_THEME_ID)
  const mode = ref(localStorage.getItem(MODE_KEY) || getTheme(themeId.value).defaultMode)

  function apply() {
    const theme = getTheme(themeId.value)
    document.documentElement.dataset.appTheme = theme.id
    document.documentElement.dataset.appMode = mode.value
    fontLinkEl().href = theme.fontsUrl
  }

  /** Idempotent — call once from main.js before mounting, so the real theme is in place
   * for first paint instead of flashing the default and then swapping. */
  function init() {
    apply()
  }

  /** Switching themes keeps the current light/dark preference — every theme supports both,
   * so "I like dark mode" should carry over rather than resetting on every switch. */
  function setTheme(id) {
    themeId.value = id
    localStorage.setItem(THEME_KEY, themeId.value)
    apply()
  }

  function setMode(newMode) {
    mode.value = newMode
    localStorage.setItem(MODE_KEY, mode.value)
    apply()
  }

  return { themeId, mode, themes: THEMES, init, setTheme, setMode }
})
