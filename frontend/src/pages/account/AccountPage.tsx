import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CreditCard, Mail, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGlobalState } from '@/store'

export default function AccountPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { jwt, settings } = useGlobalState()

  if (!jwt || !settings.user_name) {
    return <Navigate to="/auth/login" replace />
  }

  const isActive = settings.subscription_status === 'active'
  const dailyLimit = settings.daily_limit ?? 5
  const dailyUsed = settings.daily_usage ?? 0
  const dailyRemaining = settings.daily_remaining ?? Math.max(0, dailyLimit - dailyUsed)
  const planName = isActive
    ? settings.subscription_plan || t('subscription.pro')
    : t('subscription.free')

  return (
    <div className="shell py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{t('account.title')}</h1>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">{t('account.description')}</p>

      <div className="grid gap-px border border-foreground md:grid-cols-3">
        <div className="border-b border-r border-foreground bg-card p-5 md:border-b-0">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('account.email')}</h3>
          <p className="mt-1 break-all text-sm font-bold">{settings.user_name}</p>
        </div>

        <div className="border-b border-r border-foreground bg-card p-5 md:border-b-0">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('account.subscription')}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isActive ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {planName}
            </span>
          </div>
          {settings.subscription_end && (
            <p className="mt-1 text-xs text-muted-foreground">
              {settings.subscription_auto_renew ? t('subscription.nextRenewal') : t('subscription.expires')}: {settings.subscription_end}
            </p>
          )}
        </div>

        <div className="border-b border-foreground bg-card p-5 md:border-b-0">
          {isActive ? <Sparkles className="h-5 w-5 text-green-500" /> : <Zap className="h-5 w-5 text-amber-500" />}
          <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('account.usage')}</h3>
          <p className="mt-1 text-sm font-bold">
            {isActive
              ? t('account.unlimited')
              : t('account.usageDetail', { used: dailyUsed, remaining: dailyRemaining, limit: dailyLimit })}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild className="gap-2">
          <Link to="/subscription">
            <CreditCard className="h-4 w-4" />
            {isActive ? t('account.manage') : t('account.upgrade')}
          </Link>
        </Button>
      </div>
    </div>
  )
}