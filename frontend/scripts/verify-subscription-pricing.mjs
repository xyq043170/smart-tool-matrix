import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readJson = (relativePath) =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'))

const plans = readJson('../src/pages/subscription/plans.json')
const byId = new Map(plans.map((plan) => [plan.id, plan]))

assert.deepEqual(
  plans.map(({ id, price, durationDays }) => ({ id, price, durationDays })),
  [
    { id: 'daily', price: 0.99, durationDays: 1 },
    { id: 'weekly', price: 4.99, durationDays: 7 },
    { id: 'monthly', price: 9.99, durationDays: 30 },
    { id: 'yearly', price: 59.99, durationDays: 365 },
  ],
)

const savingsPercent = (id) => {
  const plan = byId.get(id)
  const comparison = byId.get(plan.comparisonId)
  return Math.round(
    (1 - (plan.price / plan.durationDays) / (comparison.price / comparison.durationDays)) * 100,
  )
}

assert.equal(savingsPercent('weekly'), 28)
assert.equal(savingsPercent('monthly'), 53)
assert.equal(savingsPercent('yearly'), 51)

const zh = readJson('../src/i18n/locales/zh/common.json').subscription
const en = readJson('../src/i18n/locales/en/common.json').subscription

assert.equal(zh.launchBadge, '首发优惠价')
assert.equal(en.launchBadge, 'Launch pricing')
assert.equal(zh.launchDescription, '当前为产品上线阶段优惠价格，未来可能调整；结账前会显示最终金额。')
assert.equal(
  en.launchDescription,
  'Current prices are introductory launch prices and may change in the future. The final amount is shown before checkout.',
)
assert.deepEqual(Object.keys(zh.labels).sort(), Object.keys(en.labels).sort())
assert.deepEqual(Object.keys(zh.savingsBasis).sort(), Object.keys(en.savingsBasis).sort())
assert.deepEqual(zh.labels, {
  flexible: '灵活体验',
  popular: '最受欢迎',
  bestValue: '最划算',
})
assert.deepEqual(en.labels, {
  flexible: 'Flexible',
  popular: 'Most popular',
  bestValue: 'Best value',
})
assert.equal(zh.savings, '省约 {{percent}}%')
assert.equal(en.savings, 'Save about {{percent}}%')

const promotionalCopy = JSON.stringify({ zh, en })
assert.doesNotMatch(promotionalCopy, /原价|限时|划线价|limited[- ]time|regular price|was \$/i)

console.log('Subscription pricing verification passed.')
