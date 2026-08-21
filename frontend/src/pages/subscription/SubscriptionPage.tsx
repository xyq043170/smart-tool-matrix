import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/store'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, ArrowLeft, RefreshCw, ShieldCheck, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, formatUsd, getSavingsPercent } from './pricing'
import { PlanSelector } from './PlanSelector'

export default function SubscriptionPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const dailyLimitReached = Boolean(
    (location.state as { dailyLimitReached?: boolean } | null)?.dailyLimitReached
  )
  const token = useGlobalState((state) => state.jwt)
  const settings = useGlobalState((state) => state.settings)
  const [loading, setLoading] = useState<string | null>(null)
  const [billingType, setBillingType] = useState<'one_time' | 'recurring'>('one_time')
  const [selectedPlanId, setSelectedPlanId] = useState('monthly')
  const captureStarted = useRef(false)
  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId) ?? PLANS[2]
  const selectedSavingsPercent = getSavingsPercent(selectedPlan)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get('checkout')
    const payment = params.get('payment')
    const orderId = params.get('token')
    const subscriptionId = params.get('subscription_id')

    if (payment === 'subscription_success') {
      toast.success(t('subscription.subscriptionSuccess'))
      window.history.replaceState({}, '', '/subscription')
      return
    }
    if (payment === 'subscription_cancelled') {
      toast.success(t('subscription.cancelSuccess'))
      window.history.replaceState({}, '', '/subscription')
      return
    }

    if (payment === 'success') {
      toast.success(t('subscription.paymentSuccess'))
      window.history.replaceState({}, '', '/subscription')
      return
    }
    if (checkout === 'cancel') {
      toast.info(t('subscription.paymentCancelled'))
      window.history.replaceState({}, '', '/subscription')
      return
    }
    if (checkout === 'subscription_cancel') {
      toast.info(t('subscription.subscriptionCheckoutCancelled'))
      window.history.replaceState({}, '', '/subscription')
      return
    }
    if (
      checkout === 'subscription_return' &&
      token &&
      !captureStarted.current
    ) {
      captureStarted.current = true
      setLoading('confirm')
      fetch('/api/v1/subscription/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionId ? { subscription_id: subscriptionId } : {}),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => null)
          if (!response.ok) {
            throw new Error(data?.detail?.message || data?.detail || t('subscription.confirmFailed'))
          }
          if (data?.success) {
            window.location.replace('/subscription?payment=subscription_success')
          } else {
            toast.info(t('subscription.activationPending'))
            window.history.replaceState({}, '', '/subscription')
            setLoading(null)
          }
        })
        .catch((error) => {
          console.error('Subscription confirmation error:', error)
          toast.error(error instanceof Error ? error.message : t('subscription.confirmFailed'))
          window.history.replaceState({}, '', '/subscription')
          setLoading(null)
        })
      return
    }
    if (checkout !== 'return' || !orderId || !token || captureStarted.current) {
      return
    }

    captureStarted.current = true
    setLoading('capture')
    fetch('/api/v1/subscription/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(
            data?.detail?.message ||
              data?.detail ||
              t('subscription.captureFailed')
          )
        }
        window.location.replace('/subscription?payment=success')
      })
      .catch((error) => {
        console.error('Payment capture error:', error)
        toast.error(
          error instanceof Error ? error.message : t('subscription.captureFailed')
        )
        window.history.replaceState({}, '', '/subscription')
        setLoading(null)
      })
  }, [t, token])

  const handlePurchase = async (planId: string) => {
    if (!token) {
      navigate('/auth/login')
      return
    }
    const loadingKey = `${billingType}:${planId}`
    setLoading(loadingKey)
    try {
      const response = await fetch('/api/v1/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_id: planId, billing_type: billingType }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const code = data?.detail?.code
        const message =
          code === 'paypal_not_configured' || code === 'paypal_plan_not_configured'
            ? t('subscription.notConfigured')
            : code === 'subscription_exists'
              ? t('subscription.alreadyExists')
            : code === 'paypal_unavailable'
              ? t('subscription.paymentUnavailable')
              : data?.detail?.message ||
                data?.detail ||
                t('subscription.createFailed')
        toast.error(message)
        return
      }
      if (data?.approve_url) {
        window.location.href = data.approve_url
      } else {
        toast.error(t('subscription.createFailed'))
      }
    } catch (error) {
      console.error('Payment order error:', error)
      toast.error(t('subscription.createFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!token || !window.confirm(t('subscription.cancelConfirm'))) return
    setLoading('cancel')
    try {
      const response = await fetch('/api/v1/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.detail?.message || data?.detail || t('subscription.cancelFailed'))
      }
      window.location.replace('/subscription?payment=subscription_cancelled')
    } catch (error) {
      console.error('Subscription cancellation error:', error)
      toast.error(error instanceof Error ? error.message : t('subscription.cancelFailed'))
      setLoading(null)
    }
  }

  return (
    <div className="shell py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{t('subscription.title')}</h1>
      </div>

      {dailyLimitReached && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4 md:p-5">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                {t('subscription.limitReached')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('subscription.limitDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(loading === 'capture' || loading === 'confirm') && (
        <Card className="border border-border bg-muted">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            {loading === 'confirm' ? t('subscription.confirming') : t('subscription.capturing')}
          </CardContent>
        </Card>
      )}

      {settings.subscription_status === 'active' && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-primary">
                  {t('subscription.active')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('subscription.plan')}: {settings.subscription_plan}
                </p>
                {settings.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    {settings.subscription_auto_renew
                      ? t('subscription.nextRenewal')
                      : t('subscription.expires')}: {settings.subscription_end}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-500">
                  {settings.subscription_auto_renew
                    ? t('subscription.autoRenewOn')
                    : t('subscription.noAutoRenew')}
                </span>
                {settings.subscription_auto_renew && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={loading !== null}
                  >
                    {loading === 'cancel' ? t('subscription.cancelling') : t('subscription.cancel')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {settings.subscription_scheduled_auto_renew && (
        <Card className="border-blue-500/40 bg-blue-500/10">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                {t('subscription.scheduledRenewal')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('subscription.plan')}: {settings.subscription_scheduled_plan}
                {settings.subscription_scheduled_start
                  ? ` · ${t('subscription.starts')}: ${settings.subscription_scheduled_start}`
                  : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelSubscription}
              disabled={loading !== null}
            >
              {loading === 'cancel' ? t('subscription.cancelling') : t('subscription.cancel')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {t('subscription.launchBadge')}
        </span>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('subscription.launchDescription')}
        </p>
      </div>

      <Tabs
        value={billingType}
        onValueChange={(value) => {
          const nextBillingType = value as 'one_time' | 'recurring'
          setBillingType(nextBillingType)
          if (nextBillingType === 'recurring' && selectedPlanId === 'lifetime') {
            setSelectedPlanId('monthly')
          }
        }}
        className="mx-auto w-full max-w-md"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
          <TabsTrigger value="one_time" className="gap-2 rounded-lg py-2.5">
            <ShieldCheck className="h-4 w-4" />
            {t('subscription.oneTimeTab')}
          </TabsTrigger>
          <TabsTrigger value="recurring" className="gap-2 rounded-lg py-2.5">
            <RefreshCw className="h-4 w-4" />
            {t('subscription.recurringTab')}
          </TabsTrigger>
        </TabsList>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {billingType === 'recurring'
            ? t('subscription.recurringDescription')
            : selectedPlan.id === 'lifetime'
              ? t('subscription.lifetimeDescription')
              : t('subscription.oneTimeDescription')}
        </p>
      </Tabs>

      <div className="space-y-4">
        <PlanSelector selectedPlanId={selectedPlan.id} onSelect={setSelectedPlanId} />

        <Card className="mx-auto w-full max-w-4xl border-primary/30 bg-card shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-xl">
              {t(`subscription.plans.${selectedPlan.id}`, selectedPlan.id)}
            </CardTitle>
            {selectedPlan.badgeKey && (
              <span className="mx-auto inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {t(`subscription.labels.${selectedPlan.badgeKey}`)}
              </span>
            )}
          </CardHeader>
          <CardContent className="mx-auto max-w-xl space-y-5 text-center">
            <div>
              <span className="text-4xl font-bold">{formatUsd(selectedPlan.price)}</span>
              {selectedPlan.durationDays !== null && (
                <span className="text-muted-foreground">
                  /{t(`subscription.period.${selectedPlan.period}`, selectedPlan.period)}
                </span>
              )}
              {selectedSavingsPercent !== null && selectedPlan.comparisonId && (
                <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {t('subscription.savings', { percent: selectedSavingsPercent })}
                  <span className="block font-normal text-muted-foreground">
                    {t(`subscription.savingsBasis.${selectedPlan.comparisonId}`)}
                  </span>
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedPlan.id === 'lifetime'
                  ? t('subscription.lifetimePayment')
                  : billingType === 'recurring'
                  ? t('subscription.recurringPayment')
                  : t('subscription.oneTimePayment')}
              </p>
            </div>

            <ul className="grid gap-2 text-left text-sm sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-green-500" />
                {t('subscription.feature.unlimited')}
              </li>
              <li className="flex items-center gap-2">
                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-green-500" />
                {t('subscription.feature.allTools')}
              </li>
              <li className="flex items-center gap-2">
                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-green-500" />
                {t('subscription.feature.noAds')}
              </li>
            </ul>

            <Button
              className="w-full"
              onClick={() => handlePurchase(selectedPlan.id)}
              disabled={loading !== null || (billingType === 'recurring' && selectedPlan.id === 'lifetime')}
            >
              {loading === `${billingType}:${selectedPlan.id}`
                ? '...'
                : billingType === 'recurring'
                  ? t('subscription.startSubscription')
                  : t('subscription.subscribe')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
