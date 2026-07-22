import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import uz from './locales/uz.json'
import ru from './locales/ru.json'
import en from './locales/en.json'

const defaultLanguage = 'uz'





export const defaultNamespace = 'default'

export const resources = {
  'uz': {
    [defaultNamespace]: uz,
  },
  'ru': {
    [defaultNamespace]: ru,
  },
  'en': {
    [defaultNamespace]: en,
  },
}

i18n.use(initReactI18next).init({
  defaultNS: defaultNamespace,
  ns: [defaultNamespace],
  resources,
  lng: localStorage.getItem("I18N_LANGUAGE") ||  defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
})