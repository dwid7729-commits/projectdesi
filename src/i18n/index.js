import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations dari file .js
import en from './locales/en'
import id from './locales/id'
import ja from './locales/ja'
import zh from './locales/zh'
import es from './locales/es'
import fr from './locales/fr'

const resources = {
  en: { translation: en },
  id: { translation: id },
  ja: { translation: ja },
  zh: { translation: zh },
  es: { translation: es },
  fr: { translation: fr },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n