import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Role, Language, SettingsState } from '../types'
import { translations, type TranslationKey } from '../translations'

const SettingsContext = createContext<SettingsState | undefined>(undefined)

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key)
    }
  } catch {
    // ignore
  }
  return null
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, value)
    }
  } catch {
    // ignore
  }
}

function getDefaultLanguage(): Language {
  const saved = getStorageItem('deepbox_lang') as Language | null
  if (saved === 'en' || saved === 'es') return saved

  // Check browser/system language
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('es')) return 'es'
  }
  return 'es' // Default system language per challenge
}

function getDefaultRole(): Role {
  const saved = getStorageItem('deepbox_role') as Role | null
  if (saved === 'Admin' || saved === 'User') return saved
  return 'Admin'
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(getDefaultRole)
  const [language, setLanguageState] = useState<Language>(getDefaultLanguage)

  const setRole = (newRole: Role) => {
    setRoleState(newRole)
    setStorageItem('deepbox_role', newRole)
  }

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang)
    setStorageItem('deepbox_lang', newLang)
  }

  const t = (key: string): string => {
    const langDict = translations[language] as Record<string, string>
    return langDict[key] ?? translations.en[key as TranslationKey] ?? key
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  return (
    <SettingsContext.Provider value={{ role, language, setRole, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsState {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
