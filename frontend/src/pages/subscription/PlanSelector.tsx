import { useTranslation } from 'react-i18next'
import { PLANS, formatUsd, getSavingsPercent } from './pricing'

type PlanSelectorProps = {
  selectedPlanId: string
  onSelect: (planId: string) => void
}

export function PlanSelector({ selectedPlanId, onSelect }: PlanSelectorProps) {
  const { t } = useTranslation('common')

  return (
    <div
      role="group"
      aria-label={t('subscription.planSelectorLabel')}
      className="mx-auto grid w-full max-w-4xl grid-cols-4 gap-2 sm:gap-3"
    >
      {PLANS.map((plan) => {
        const selected = plan.id === selectedPlanId
        const savingsPercent = getSavingsPercent(plan)
        const secondaryText = plan.badgeKey
          ? t(`subscription.labels.${plan.badgeKey}`)
          : savingsPercent === null
            ? ''
            : t('subscription.savings', { percent: savingsPercent })

        return (
          <button
            key={plan.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(plan.id)}
            className={`flex h-full min-h-28 min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-3 ${
              selected
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
            }`}
          >
            <span className="text-xs font-semibold sm:text-sm">
              {t(`subscription.plans.${plan.id}`, plan.id)}
            </span>
            <span className="mt-1 whitespace-nowrap text-sm font-bold sm:text-lg">
              {formatUsd(plan.price)}
            </span>
            <span className="mt-1 flex min-h-8 items-center justify-center text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">
              {secondaryText}
            </span>
          </button>
        )
      })}
    </div>
  )
}
