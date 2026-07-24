import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from '@/components/ui/sonner'
import { useGlobalState } from '@/store'
import MarketPage from '@/pages/Market'
import AboutPage from '@/pages/About'
import SettingsPage from '@/pages/Settings'
import AuthLoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import PortraitPage from '@/pages/portrait/PortraitPage'
import SubscriptionPage from '@/pages/subscription/SubscriptionPage'
import AccountPage from '@/pages/account/AccountPage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles } from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const IS_TAURI = import.meta.env.VITE_IS_TAURI === 'true'

function App() {
  const {
    jwt,
    setSettings,
    settings
  } = useGlobalState()
  const { t, i18n } = useTranslation('common')

  const [loading, setLoading] = useState(false)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt || 'xxx'}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...data, fetched: true, error: null })
      } else {
        setSettings({
          fetched: true,
          error: `Failed to fetch settings: ${response.status} ${response.statusText}`,
        })
      }
    } catch (error: any) {
      console.error(error)
      setSettings({
        fetched: true,
        error: `Failed to fetch settings: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt])

  useEffect(() => {
    document.title = `${t('app.title')} - ${t('app.subtitle')}`
    document.documentElement.lang = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en'
  }, [t, i18n.language])

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              {t('app.loading')}
            </p>
          </div>
        </div>
      )}

      <MainLayout>
        {settings.fetched && !settings.error ? (
          <Routes>
            <Route path="/" element={<MarketPage />} />
            <Route path="/about" element={<AboutPage />} />
            {IS_TAURI && <Route path="/settings" element={<SettingsPage />} />}
            <Route path="/portrait" element={<PortraitPage />} />
            <Route path="/auth/login" element={<AuthLoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/verify" element={<VerifyEmailPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        ) : settings.error ? (
          <Alert variant="destructive" className="glass">
            <AlertDescription>{settings.error}</AlertDescription>
          </Alert>
        ) : null}
      </MainLayout>
      <Toaster />
    </>
  )
}

export default App
