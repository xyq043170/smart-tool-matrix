import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGlobalState } from '@/store'
import { Github, LogIn, ArrowLeft } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function LoginPage() {
  const { login_type } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { setJwt } = useGlobalState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (login_type === 'github') {
      const code = searchParams.get('code')
      if (code) {
        handleGithubCallback(code)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login_type, searchParams])

  const handleGithubCallback = async (code: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/oauth`, {
        method: 'POST',
        body: JSON.stringify({
          login_type: 'github',
          code: code,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`${response.status} ${text}`)
      }

      const token = await response.json()
      setJwt(token)
      window.location.href = '/'
    } catch (err: any) {
      console.error(err)
      setError(`${t('login.failed')}: ${err.message || t('login.failed')}`)
    } finally {
      setLoading(false)
    }
  }

  const onGithubLogin = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(
        `${API_BASE}/api/v1/login?login_type=github&redirect_url=${window.location.origin}/login/github`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`${response.status} ${text}`)
      }

      const redirectUrl = await response.json()
      window.location.href = redirectUrl
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('login.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] px-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border border-border bg-card shadow-sm">
        <CardHeader className="space-y-1 md:space-y-2 text-center p-4 md:p-6">
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="p-2 md:p-3 rounded-full border border-border bg-muted">
              <LogIn className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl">{t('login.title')}</CardTitle>
          <CardDescription className="text-xs md:text-sm">{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                <Github className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t('login.loading')}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && (
            <>
              <Button
                onClick={onGithubLogin}
                disabled={loading}
                className="w-full h-12 gap-3 text-base"
                size="lg"
              >
                <Github className="h-5 w-5" />
                {t('login.githubLogin')}
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full h-11 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('login.backHome')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
