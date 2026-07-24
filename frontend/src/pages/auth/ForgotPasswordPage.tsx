import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function ForgotPasswordPage() {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`${response.status} ${text}`)
      }
      setSuccess(true)
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
              <KeyRound className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl">{t('auth.forgotPassword')}</CardTitle>
          <CardDescription className="text-xs md:text-sm">{t('auth.email')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success ? (
            <Alert className="animate-in slide-in-from-top duration-300">
              <AlertDescription>{t('auth.resetEmailSent')}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-base" size="lg">
                {loading ? t('login.loading') : t('auth.resetPassword')}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth/login" className="text-primary hover:underline">
              {t('auth.hasAccount')} {t('auth.login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}