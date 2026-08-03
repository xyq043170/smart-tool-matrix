# Launch Pricing Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add honest launch-pricing and calculated savings labels to the four existing access-pass cards without changing any amount.

**Architecture:** Move the four plan amounts and comparison relationships into a small JSON configuration shared conceptually by the React pricing model and a dependency-free Node verification script. Keep rendering in `SubscriptionPage.tsx`, derive percentages from per-day rates at runtime, and store all customer-facing wording in the existing Chinese and English i18n files.

**Tech Stack:** React 18, TypeScript 5.6, react-i18next, Tailwind CSS, Node.js assertions, pnpm.

## Global Constraints

- Prices remain exactly: 1 day `$0.99`, 7 days `$4.99`, 30 days `$9.99`, and 365 days `$59.99`.
- Apply the same presentation to one-time and recurring purchase tabs.
- Use `首发优惠价` / `Launch pricing`; do not add a struck-through or historical reference price.
- Do not use `限时`, `limited-time`, countdowns, or guaranteed future-price language.
- Round computed savings to the nearest integer: 7 days `28%`, 30 days `53%`, 365 days `51%`.
- Keep the current price as the largest text in every card.
- Make the 30-day plan the restrained primary recommendation and the 365-day plan the best-value option.
- Display each savings comparison basis as visible text so it works on mobile and with assistive technology.
- Checkout remains the source of truth for final price, currency, renewal type, and duration.
- Preserve unrelated existing worktree edits, especially the current additions in both `common.json` locale files.

---

## File Structure

- Create `frontend/src/pages/subscription/plans.json`: single data source for price, duration, comparison plan, and optional recommendation badge.
- Create `frontend/src/pages/subscription/pricing.ts`: typed plan access, USD formatting, and per-day savings calculation.
- Create `frontend/scripts/verify-subscription-pricing.mjs`: dependency-free regression checks for amounts, percentages, locale parity, approved wording, and forbidden claims.
- Modify `frontend/package.json`: expose `verify:pricing` and run it during the production build.
- Modify `frontend/src/i18n/locales/zh/common.json`: approved Chinese launch, badge, savings, and basis copy.
- Modify `frontend/src/i18n/locales/en/common.json`: matching English copy.
- Modify `frontend/src/pages/subscription/SubscriptionPage.tsx`: render the launch message, recommendation badges, computed savings, and visible comparison basis.

### Task 1: Shared pricing data and savings calculation

**Files:**
- Create: `frontend/src/pages/subscription/plans.json`
- Create: `frontend/src/pages/subscription/pricing.ts`
- Create: `frontend/scripts/verify-subscription-pricing.mjs`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `PLANS: readonly PricingPlan[]`
- Produces: `formatUsd(price: number): string`
- Produces: `getSavingsPercent(plan: PricingPlan): number | null`
- Produces: `pnpm verify:pricing`
- Consumes: no application interface; the initial verification script reads `plans.json` directly.

- [ ] **Step 1: Write a failing price-and-percentage verification script**

Create `frontend/scripts/verify-subscription-pricing.mjs`:

```js
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
```

- [ ] **Step 2: Run the script and confirm the missing configuration fails**

Run: `cd frontend && node scripts/verify-subscription-pricing.mjs`

Expected: FAIL with `ENOENT` for `src/pages/subscription/plans.json`.

- [ ] **Step 3: Add the minimal shared plan configuration**

Create `frontend/src/pages/subscription/plans.json`:

```json
[
  {
    "id": "daily",
    "price": 0.99,
    "durationDays": 1,
    "period": "day",
    "badgeKey": "flexible",
    "comparisonId": null
  },
  {
    "id": "weekly",
    "price": 4.99,
    "durationDays": 7,
    "period": "week",
    "badgeKey": null,
    "comparisonId": "daily"
  },
  {
    "id": "monthly",
    "price": 9.99,
    "durationDays": 30,
    "period": "month",
    "badgeKey": "popular",
    "comparisonId": "weekly"
  },
  {
    "id": "yearly",
    "price": 59.99,
    "durationDays": 365,
    "period": "year",
    "badgeKey": "bestValue",
    "comparisonId": "monthly"
  }
]
```

Create `frontend/src/pages/subscription/pricing.ts`:

```ts
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
```

- [ ] **Step 4: Expose the check through pnpm and the production build**

In `frontend/package.json`, change the scripts to:

```json
{
  "build": "tsc && vite build --mode prod && node scripts/verify-seo-pages.mjs && node scripts/verify-subscription-pricing.mjs",
  "verify:pricing": "node scripts/verify-subscription-pricing.mjs"
}
```

Keep every other existing script unchanged.

- [ ] **Step 5: Verify the pricing model**

Run: `cd frontend && pnpm verify:pricing && pnpm exec tsc --noEmit`

Expected: the pricing verification prints `Subscription pricing verification passed.` and TypeScript exits successfully.

- [ ] **Step 6: Commit the pricing model**

```bash
git add frontend/package.json frontend/scripts/verify-subscription-pricing.mjs frontend/src/pages/subscription/plans.json frontend/src/pages/subscription/pricing.ts
git commit -m "feat: add verifiable access-pass pricing model"
```

### Task 2: Bilingual launch-pricing copy and claim guardrails

**Files:**
- Modify: `frontend/scripts/verify-subscription-pricing.mjs`
- Modify: `frontend/src/i18n/locales/zh/common.json`
- Modify: `frontend/src/i18n/locales/en/common.json`

**Interfaces:**
- Consumes: `pnpm verify:pricing` from Task 1.
- Produces i18n keys: `subscription.launchBadge`, `subscription.launchDescription`, `subscription.labels.*`, `subscription.savings`, and `subscription.savingsBasis.*`.

- [ ] **Step 1: Extend the verifier with failing locale and claim checks**

Insert after the percentage assertions in `frontend/scripts/verify-subscription-pricing.mjs`:

```js
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
```

- [ ] **Step 2: Run the verifier and confirm missing translation keys fail**

Run: `cd frontend && pnpm verify:pricing`

Expected: FAIL because `subscription.launchBadge` is `undefined`.

- [ ] **Step 3: Add the approved Chinese strings**

Add these keys inside the existing `subscription` object in `frontend/src/i18n/locales/zh/common.json`, preserving all unrelated edits:

```json
"launchBadge": "首发优惠价",
"launchDescription": "当前为产品上线阶段优惠价格，未来可能调整；结账前会显示最终金额。",
"labels": {
  "flexible": "灵活体验",
  "popular": "最受欢迎",
  "bestValue": "最划算"
},
"savings": "省约 {{percent}}%",
"savingsBasis": {
  "daily": "相较 1 天通行证的单日价格",
  "weekly": "相较 7 天通行证的单日价格",
  "monthly": "相较 30 天通行证的单日价格"
},
```

- [ ] **Step 4: Add the matching English strings**

Add these keys inside the existing `subscription` object in `frontend/src/i18n/locales/en/common.json`, preserving all unrelated edits:

```json
"launchBadge": "Launch pricing",
"launchDescription": "Current prices are introductory launch prices and may change in the future. The final amount is shown before checkout.",
"labels": {
  "flexible": "Flexible",
  "popular": "Most popular",
  "bestValue": "Best value"
},
"savings": "Save about {{percent}}%",
"savingsBasis": {
  "daily": "Compared with the daily rate of the 1-day pass",
  "weekly": "Compared with the daily rate of the 7-day pass",
  "monthly": "Compared with the daily rate of the 30-day pass"
},
```

- [ ] **Step 5: Verify locale parity and approved claims**

Run: `cd frontend && pnpm verify:pricing`

Expected: PASS and print `Subscription pricing verification passed.`

- [ ] **Step 6: Commit the copy and guardrails**

```bash
git add frontend/scripts/verify-subscription-pricing.mjs frontend/src/i18n/locales/zh/common.json frontend/src/i18n/locales/en/common.json
git commit -m "feat: add bilingual launch pricing copy"
```

### Task 3: Render launch messaging and savings on the pricing cards

**Files:**
- Modify: `frontend/src/pages/subscription/SubscriptionPage.tsx:1-16`
- Modify: `frontend/src/pages/subscription/SubscriptionPage.tsx:299-369`

**Interfaces:**
- Consumes: `PLANS`, `formatUsd`, and `getSavingsPercent` from `./pricing`.
- Consumes: all i18n keys created by Task 2.
- Produces: responsive, visible launch and savings presentation for both billing tabs.

- [ ] **Step 1: Replace the duplicated inline plan array with the pricing model**

Add this import:

```ts
import { PLANS, formatUsd, getSavingsPercent } from './pricing'
```

Delete the existing inline `const PLANS = [...]` declaration. Keep all payment handlers and API behavior unchanged.

- [ ] **Step 2: Render the page-level launch message before the billing tabs**

Insert immediately before `<Tabs ...>`:

```tsx
<div className="mx-auto max-w-2xl text-center">
  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
    {t('subscription.launchBadge')}
  </span>
  <p className="mt-2 text-sm leading-6 text-muted-foreground">
    {t('subscription.launchDescription')}
  </p>
</div>
```

- [ ] **Step 3: Add labels, derived prices, savings, and comparison bases to each card**

Replace the `PLANS.map` card block with:

```tsx
{PLANS.map((plan) => {
  const savingsPercent = getSavingsPercent(plan)
  const isPopular = plan.id === 'monthly'

  return (
    <Card
      key={plan.id}
      className={`transition-colors hover:border-foreground/20 ${
        isPopular ? 'border-primary/50 ring-1 ring-primary/20' : ''
      }`}
    >
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">
          {t(`subscription.plans.${plan.id}`, plan.id)}
        </CardTitle>
        {plan.badgeKey && (
          <span className="mx-auto inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {t(`subscription.labels.${plan.badgeKey}`)}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div>
          <span className="text-3xl font-bold">{formatUsd(plan.price)}</span>
          <span className="text-muted-foreground">
            /{t(`subscription.period.${plan.period}`, plan.period)}
          </span>
          {savingsPercent !== null && plan.comparisonId && (
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t('subscription.savings', { percent: savingsPercent })}
              <span className="block font-normal text-muted-foreground">
                {t(`subscription.savingsBasis.${plan.comparisonId}`)}
              </span>
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {billingType === 'recurring'
              ? t('subscription.recurringPayment')
              : t('subscription.oneTimePayment')}
          </p>
        </div>
        <ul className="space-y-2 text-left text-sm">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            {t('subscription.feature.unlimited')}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            {t('subscription.feature.allTools')}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            {t('subscription.feature.noAds')}
          </li>
        </ul>
        <Button
          className="w-full"
          onClick={() => handlePurchase(plan.id)}
          disabled={loading !== null}
        >
          {loading === `${billingType}:${plan.id}`
            ? '...'
            : billingType === 'recurring'
              ? t('subscription.startSubscription')
              : t('subscription.subscribe')}
        </Button>
      </CardContent>
    </Card>
  )
})}
```

- [ ] **Step 4: Run automated verification**

Run: `cd frontend && pnpm verify:pricing && pnpm lint && pnpm build`

Expected: pricing verification passes, ESLint reports zero warnings, TypeScript compiles, Vite builds, and SEO verification passes.

- [ ] **Step 5: Perform responsive and interaction checks**

Run: `cd frontend && pnpm dev`

Open `/subscription` in Chinese and English, then verify:

- 1-day remains `$0.99` and shows only `灵活体验` / `Flexible`.
- 7-day remains `$4.99` and shows `28%` with the 1-day comparison basis.
- 30-day remains `$9.99`, shows `53%`, and has the restrained `最受欢迎` / `Most popular` emphasis.
- 365-day remains `$59.99` and shows `51%` with `最划算` / `Best value`.
- Switching between one-time and recurring tabs changes only renewal wording, not prices or savings.
- At mobile width, no badge, percentage, comparison basis, price, or purchase button clips or overlaps.
- The DOM contains visible comparison text; understanding the percentage does not depend on hover.
- No crossed-out price, countdown, `原价`, `限时`, `regular price`, or `limited-time` appears.

- [ ] **Step 6: Commit the pricing presentation**

```bash
git add frontend/src/pages/subscription/SubscriptionPage.tsx
git commit -m "feat: present launch savings on access passes"
```

## Final Verification

- [ ] Run `cd frontend && pnpm verify:pricing && pnpm lint && pnpm build` from a clean implementation state.
- [ ] Run `git diff --check` and confirm it reports no whitespace errors.
- [ ] Run `git status --short` and confirm only pre-existing unrelated user changes remain.
- [ ] Compare the completed UI against `docs/superpowers/specs/2026-08-03-launch-pricing-labels-design.md` and confirm every acceptance criterion is satisfied.
