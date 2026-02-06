import { createApp } from 'vue'
import App from './App.vue'
import { i18n, getStoredLocale } from '@/i18n'
import './newtab.css'

const app = createApp(App).use(i18n)
getStoredLocale().then((locale) => {
  i18n.global.locale.value = locale
  app.mount('#app')
})
