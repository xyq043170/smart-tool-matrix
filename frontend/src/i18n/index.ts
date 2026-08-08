import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCommon from './locales/zh/common.json'
import enCommon from './locales/en/common.json'
import zhTools from './locales/zh/tools.json'
import enTools from './locales/en/tools.json'

const canonicalLanguage = window.location.pathname === '/'
  ? 'en'
  : window.location.pathname === '/zh' || window.location.pathname.startsWith('/zh/')
    ? 'zh'
    : undefined

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { common: zhCommon, tools: zhTools },
      en: { common: enCommon, tools: enTools },
    },
    lng: canonicalLanguage,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'tools'],
    interpolation: { escapeValue: false },
    detection: {
      // Canonical homepage paths override stored preferences. Other routes remember
      // only an explicit language switch; browser/system language is not consulted.
      order: ['localStorage'],
      caches: canonicalLanguage ? [] : ['localStorage'],
      lookupLocalStorage: 'toolMatrixLanguage',
    },
  })

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.startsWith('zh') ? 'zh-CN' : 'en'
}

syncDocumentLanguage(i18n.resolvedLanguage || 'en')
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
