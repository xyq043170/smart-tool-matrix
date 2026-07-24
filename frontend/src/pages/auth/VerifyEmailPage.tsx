import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export default function VerifyEmailPage() {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const started = useRef(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!token) {
      setStatus('error')
      return
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/auth/verify/${encodeURIComponent(token)}`
        )
        setStatus(response.ok ? 'success' : 'error')
      } catch {
        setStatus('error')
      }
    }

    verify()
  }, [token])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full border border-border bg-muted p-3">
              {status === 'loading' ? (
                <MailCheck className="h-8 w-8 animate-pulse text-primary" />
              ) : status === 'success' ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
          </div>
          <CardTitle>{t('auth.verifyEmail')}</CardTitle>
          <CardDescription>{t('auth.verifyEmailDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <Alert><AlertDescription>{t('auth.verifyingEmail')}</AlertDescription></Alert>
          )}
          {status === 'success' && (
            <Alert><AlertDescription>{t('auth.verifySuccess')}</AlertDescription></Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{t('auth.verifyFailed')}</AlertDescription>
            </Alert>
          )}
          {status !== 'loading' && (
            <Button asChild className="w-full">
              <Link to="/auth/login">{t('auth.backToLogin')}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
