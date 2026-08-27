import { createApp } from 'vue'
import App from './App.vue'
import { i18n, getStoredLocale } from '@/i18n'
import { getStoredTheme, applyThemeClass } from '@/theme'
import '@/styles/ui-theme.css'
import './newtab.css'

const app = createApp(App).use(i18n)
Promise.all([getStoredLocale(), getStoredTheme()]).then(([locale, theme]) => {
  applyThemeClass(theme)
  i18n.global.locale.value = locale
  app.mount('#app')
})
