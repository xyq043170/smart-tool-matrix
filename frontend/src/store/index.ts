import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CustomOpenAISettings {
  enable: boolean
  baseUrl: string
  apiKey: string
  model: string
}

interface Settings {
  fetched: boolean
  error: string | null
  user_name?: string
  login_type?: string
  enable_login?: boolean
  google_client_id?: string
  enable_rate_limit?: boolean
  rate_limit?: string
  ad_client?: string
  ad_slot?: string
  default_api_base?: string
  default_model?: string
  purchase_url?: string
  subscription_status?: 'active' | 'cancelled' | 'none'
  subscription_plan?: string
  subscription_end?: string
  subscription_billing_type?: 'one_time' | 'recurring'
  subscription_auto_renew?: boolean
  subscription_scheduled_auto_renew?: boolean
  subscription_scheduled_plan?: string
  subscription_scheduled_start?: string
  daily_usage?: number
  daily_limit?: number
  daily_remaining?: number
}

interface GlobalState {
  isDark: boolean
  jwt: string
  lang: string
  settings: Settings
  customOpenAISettings: CustomOpenAISettings
  toggleDark: () => void
  setJwt: (jwt: string) => void
  setLang: (lang: string) => void
  setSettings: (settings: Partial<Settings>) => void
  setCustomOpenAISettings: (settings: Partial<CustomOpenAISettings>) => void
}

export const useGlobalState = create<GlobalState>()(
  persist(
    (set) => ({
      isDark: false,
      jwt: '',
      lang: 'en',
      settings: { fetched: false, error: null },
      customOpenAISettings: { enable: false, baseUrl: '', apiKey: '', model: '' },
      toggleDark: () => set((state) => ({ isDark: !state.isDark })),
      setJwt: (jwt) => set({ jwt }),
      setLang: (lang) => set({ lang }),
      setSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),
      setCustomOpenAISettings: (settings) =>
        set((state) => ({
          customOpenAISettings: { ...state.customOpenAISettings, ...settings },
        })),
    }),
    { name: 'global-state' }
  )
)
