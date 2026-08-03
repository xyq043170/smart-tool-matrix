import plansData from './plans.json'

export type PricingPlan = {
  id: string
  price: number
  durationDays: number
  period: string
  badgeKey: string | null
  comparisonId: string | null
}

export const PLANS: readonly PricingPlan[] = plansData

export function formatUsd(price: number): string {
  return `$${price.toFixed(2)}`
}

export function getSavingsPercent(plan: PricingPlan): number | null {
  if (!plan.comparisonId) return null

  const comparison = PLANS.find((candidate) => candidate.id === plan.comparisonId)
  if (!comparison) {
    throw new Error(`Missing comparison plan: ${plan.comparisonId}`)
  }

  const planDailyRate = plan.price / plan.durationDays
  const comparisonDailyRate = comparison.price / comparison.durationDays
  return Math.round((1 - planDailyRate / comparisonDailyRate) * 100)
}
