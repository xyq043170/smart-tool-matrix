import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
import PolicyPage from '@/pages/PolicyPage'
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
  const location = useLocation()

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
    const pageMeta: Record<string, { title: string; description: string; noindex?: boolean }> = {
      '/': { title: `${t('app.title')} - ${t('app.subtitle')}`, description: t('market.categoryHint') },
      '/about': { title: `${t('nav.about')} | ${t('app.title')}`, description: t('nav.aboutDesc') },
      '/privacy': { title: `${t('legal.privacy')} | ${t('app.title')}`, description: t('legal.privacyDesc') },
      '/terms': { title: `${t('legal.terms')} | ${t('app.title')}`, description: t('legal.termsDesc') },
      '/changelog': { title: `${t('legal.changelog')} | ${t('app.title')}`, description: t('legal.changelogDesc') },
      '/subscription': { title: `${t('nav.pricing')} | ${t('app.title')}`, description: t('legal.pricingDesc') },
    }
    const meta = pageMeta[location.pathname] || {
      title: `${t('app.title')} - ${t('app.subtitle')}`,
      description: t('market.categoryHint'),
      noindex: location.pathname.startsWith('/auth/') || location.pathname === '/account',
    }
    document.title = meta.title
    document.documentElement.lang = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en'
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) {
      description.content = meta.description
    }
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = `https://www.gotoolmatrix.com${location.pathname === '/' ? '/' : location.pathname}`
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (robots) robots.content = meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'
    document.querySelectorAll<HTMLMetaElement>('meta[property="og:title"], meta[name="twitter:title"]').forEach(el => { el.content = meta.title })
    document.querySelectorAll<HTMLMetaElement>('meta[property="og:description"], meta[name="twitter:description"]').forEach(el => { el.content = meta.description })
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    if (ogUrl) ogUrl.content = `https://www.gotoolmatrix.com${location.pathname === '/' ? '/' : location.pathname}`
  }, [t, i18n.language, location.pathname])

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
        {settings.error && (
          <div className="shell pt-4">
            <Alert variant="destructive" className="glass">
              <AlertDescription>{settings.error}</AlertDescription>
            </Alert>
          </div>
        )}
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
          <Route path="/terms" element={<PolicyPage kind="terms" />} />
          <Route path="/changelog" element={<PolicyPage kind="changelog" />} />
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
      </MainLayout>
      <Toaster />
    </>
  )
}

export default App
