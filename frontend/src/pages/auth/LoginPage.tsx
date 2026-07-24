import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn } from 'lucide-react'
import { useGlobalState } from '@/store'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function AuthLoginPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { setJwt } = useGlobalState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (data?.detail?.code === 'email_not_verified') {
          throw new Error(t('auth.emailNotVerified'))
        }
        throw new Error(data?.detail?.message || data?.detail || t('login.failed'))
      }
      const { token } = await response.json()
      setJwt(token)
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login.failed')
      setError(msg)
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
          <CardTitle className="text-xl md:text-2xl">{t('auth.login')}</CardTitle>
          <CardDescription className="text-xs md:text-sm">{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <Input id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base" size="lg">
              {loading ? t('login.loading') : t('auth.login')}
            </Button>
          </form>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
            </div>
          </div>
          <GoogleSignInButton onError={setError} />
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/auth/register" className="text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
