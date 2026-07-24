import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useGlobalState } from '@/store'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const GOOGLE_SCRIPT_ID = 'google-identity-services'

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleAccountsId {
  initialize: (options: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number
      locale?: string
    }
  ) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
      }
    }
  }
}

let googleScriptPromise: Promise<void> | null = null

function loadGoogleIdentityServices() {
  if (window.google?.accounts.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript || document.createElement('script')

    const handleLoad = () => resolve()
    const handleError = () => {
      googleScriptPromise = null
      reject(new Error('Google Identity Services failed to load'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return googleScriptPromise
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

interface GoogleSignInButtonProps {
  onError: (message: string) => void
}

export default function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const { settings, setJwt } = useGlobalState()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const clientId = settings.google_client_id
    const button = buttonRef.current
    if (!clientId || !button) return

    let cancelled = false

    const handleCredential = async (credentialResponse: GoogleCredentialResponse) => {
      if (!credentialResponse.credential) {
        onError(t('auth.googleLoginFailed'))
        return
      }

      onError('')
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE}/api/v1/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: credentialResponse.credential }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.detail?.message || data?.detail || t('auth.googleLoginFailed'))
        }
        const { token } = await response.json()
        setJwt(token)
        navigate('/')
      } catch (error: unknown) {
        onError(error instanceof Error ? error.message : t('auth.googleLoginFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          ux_mode: 'popup',
        })
        buttonRef.current.replaceChildren()
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(buttonRef.current.clientWidth || 400, 400),
          locale: i18n.resolvedLanguage?.startsWith('zh') ? 'zh_CN' : 'en',
        })
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) onError(t('auth.googleUnavailable'))
      })

    return () => {
      cancelled = true
    }
  }, [i18n.resolvedLanguage, navigate, onError, setJwt, settings.google_client_id, t])

  if (!settings.google_client_id) {
    return (
      <Button type="button" variant="outline" className="h-11 w-full gap-2"
        onClick={() => onError(t('auth.googleNotConfigured'))}>
        <GoogleIcon />
        {t('auth.googleLogin')}
      </Button>
    )
  }

  return (
    <div className="relative flex min-h-11 w-full justify-center">
      {(!ready || loading) && (
        <Button type="button" variant="outline" className="absolute inset-0 z-10 h-11 w-full gap-2" disabled>
          <GoogleIcon />
          {t(loading ? 'auth.googleSigningIn' : 'auth.googleLoading')}
        </Button>
      )}
      <div ref={buttonRef}
        className={`flex min-h-11 w-full justify-center overflow-hidden ${loading ? 'invisible' : ''}`} />
    </div>
  )
}
