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

console.log('Subscription pricing verification passed.')
