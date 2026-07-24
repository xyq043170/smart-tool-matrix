import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function ResetPasswordPage() {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
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
              <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl">{t('auth.resetPassword')}</CardTitle>
          <CardDescription className="text-xs md:text-sm">{t('auth.newPassword')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success ? (
            <Alert className="animate-in slide-in-from-top duration-300">
              <AlertDescription>{t('auth.resetSuccess')}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                <Input id="newPassword" type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
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
