export type Role = 'Admin' | 'User'
export type Language = 'en' | 'es'

export interface SettingsState {
  role: Role
  language: Language
  setRole: (role: Role) => void
  setLanguage: (language: Language) => void
  t: (key: string) => string
}
