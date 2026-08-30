import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from '@vue/eslint-config-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettier,
  {
    languageOptions: { globals: globals.browser },
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    ignores: ['dist/**', 'legacy/**'],
  },
]
