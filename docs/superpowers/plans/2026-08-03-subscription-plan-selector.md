# Subscription Plan Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace four stacked or uneven subscription cards with four equal-width plan buttons in one row and one consistent selected-plan detail card.

**Architecture:** Keep `plans.json` and `pricing.ts` as the single source of pricing truth. Add a focused `PlanSelector` component for the four-option single-choice control, while `SubscriptionPage` owns the selected plan ID and renders one shared detail card. Existing billing type, checkout, PayPal, authentication, and pricing-verification behavior remain unchanged.

**Tech Stack:** React 18, TypeScript 5.6, react-i18next, Tailwind CSS, Vite, Node.js pricing assertions, Playwright browser verification through the local verification runtime.

## Global Constraints

- All four plan buttons remain in one equal-width row at 390px, tablet, and desktop widths.
- Monthly is selected by default.
- Prices remain exactly `$0.99`, `$4.99`, `$9.99`, and `$59.99`.
- Savings remain approximately 28%, 53%, and 51% using the existing pricing model.
- Billing-type changes preserve the selected plan; plan changes preserve the billing type.
- The detail card contains the only purchase button.
- No horizontal carousel, horizontal page overflow, struck-through price, countdown, or fabricated reference price is introduced.
- Savings comparison text remains visible without hover.
- The existing floating feedback control remains hidden on `/subscription`.
- Preserve the repository's existing ESLint configuration issue as out of scope; verify with pricing checks, TypeScript, production build, and browser assertions.

---

## File Structure

- Create `frontend/src/pages/subscription/PlanSelector.tsx`: renders the equal-width four-button plan choice group.
- Modify `frontend/src/pages/subscription/SubscriptionPage.tsx`: owns selected plan state and renders one shared plan detail card.
- Modify `frontend/src/i18n/locales/en/common.json`: adds the plan selector group label.
- Modify `frontend/src/i18n/locales/zh/common.json`: adds the matching Chinese group label.
- Modify `frontend/scripts/verify-subscription-pricing.mjs`: verifies bilingual selector-label parity while retaining existing pricing and promotional guardrails.

### Task 1: Add the accessible four-option selector

**Files:**
- Create: `frontend/src/pages/subscription/PlanSelector.tsx`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/i18n/locales/zh/common.json`
- Modify: `frontend/scripts/verify-subscription-pricing.mjs`

**Interfaces:**
- Consumes: `PLANS`, `PricingPlan`, `formatUsd`, and `getSavingsPercent` from `./pricing`.
- Produces: `PlanSelector({ selectedPlanId, onSelect }: PlanSelectorProps)`.
- Produces i18n key: `subscription.planSelectorLabel`.

- [ ] **Step 1: Add failing locale parity assertions**

Add these assertions before the verifier's promotional-copy guard:

```js
assert.equal(zh.planSelectorLabel, '选择使用有效期')
assert.equal(en.planSelectorLabel, 'Choose an access pass')
```

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `cd frontend && pnpm verify:pricing`

Expected: FAIL because `zh.planSelectorLabel` is `undefined`.

- [ ] **Step 3: Add bilingual group labels**

Add inside each locale's existing `subscription` object:

```json
"planSelectorLabel": "选择使用有效期"
```

```json
"planSelectorLabel": "Choose an access pass"
```

- [ ] **Step 4: Create the focused selector component**

Create `PlanSelector.tsx` with this public contract and layout:

```tsx
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
            className={`flex min-h-28 min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-3 ${
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
```

- [ ] **Step 5: Verify the selector unit compiles**

Run: `cd frontend && pnpm verify:pricing && pnpm exec tsc --noEmit`

Expected: pricing verifier prints `Subscription pricing verification passed.` and TypeScript exits 0.

- [ ] **Step 6: Commit the selector component**

```bash
git add frontend/scripts/verify-subscription-pricing.mjs frontend/src/i18n/locales/en/common.json frontend/src/i18n/locales/zh/common.json frontend/src/pages/subscription/PlanSelector.tsx
git commit -m "feat: add aligned subscription plan selector"
```

### Task 2: Replace four detail cards with one selected-plan card

**Files:**
- Modify: `frontend/src/pages/subscription/SubscriptionPage.tsx`

**Interfaces:**
- Consumes: `PlanSelector` from `./PlanSelector`.
- Consumes: `PLANS`, `formatUsd`, and `getSavingsPercent` from `./pricing`.
- Produces state: `selectedPlanId`, initialized to `'monthly'`.
- Sends the selected plan ID through the unchanged `handlePurchase(planId)` boundary.

- [ ] **Step 1: Reproduce the current browser failure**

Start the current page and assert at a 390px viewport that no element with group label `选择使用有效期` exists and that four full purchase buttons are rendered.

Expected RED evidence:

```json
{
  "selectorGroupCount": 0,
  "purchaseButtonCount": 4
}
```

- [ ] **Step 2: Add selected-plan state and derivation**

Update imports and state:

```tsx
import { PlanSelector } from './PlanSelector'

const [selectedPlanId, setSelectedPlanId] = useState('monthly')
const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId) ?? PLANS[2]
const selectedSavingsPercent = getSavingsPercent(selectedPlan)
```

Keep this derivation inside `SubscriptionPage`; do not copy pricing fields into state.

- [ ] **Step 3: Render the selector and one consistent detail card**

Replace the existing `PLANS.map` grid with:

```tsx
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
        <span className="text-muted-foreground">
          /{t(`subscription.period.${selectedPlan.period}`, selectedPlan.period)}
        </span>
        {selectedSavingsPercent !== null && selectedPlan.comparisonId && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {t('subscription.savings', { percent: selectedSavingsPercent })}
            <span className="block font-normal text-muted-foreground">
              {t(`subscription.savingsBasis.${selectedPlan.comparisonId}`)}
            </span>
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {billingType === 'recurring'
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
        disabled={loading !== null}
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
```

- [ ] **Step 4: Verify TypeScript and pricing behavior**

Run: `cd frontend && pnpm verify:pricing && pnpm exec tsc --noEmit`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the selected-plan detail presentation**

```bash
git add frontend/src/pages/subscription/SubscriptionPage.tsx
git commit -m "feat: unify subscription plan details"
```

### Task 3: Production and browser verification

**Files:**
- No production files expected unless verification exposes a defect.

**Interfaces:**
- Verifies the complete `SubscriptionPage` behavior and the contract established by Tasks 1 and 2.

- [ ] **Step 1: Run automated project verification**

Run: `cd frontend && pnpm verify:pricing && pnpm exec tsc --noEmit && pnpm build`

Expected: pricing verification, TypeScript, Vite build, SEO verification, and post-build pricing verification all exit 0.

- [ ] **Step 2: Verify desktop English behavior**

At 1440px width, intercept `/api/v1/settings` with a valid non-subscriber response and verify:

- One group labelled `Choose an access pass` exists.
- It contains exactly four buttons on the same top coordinate with equal computed widths and heights.
- Monthly has `aria-pressed="true"` initially.
- The detail card initially shows `$9.99`, `Most popular`, `Save about 53%`, and the 7-day comparison basis.
- Selecting yearly changes the detail to `$59.99`, `Best value`, `Save about 51%`, and the 30-day comparison basis.
- Exactly one purchase button exists.
- No console error or Vite error overlay appears.

- [ ] **Step 3: Verify mobile Chinese behavior**

At 390px width, verify:

- The four buttons remain on one row with equal widths and heights.
- `document.body.scrollWidth === window.innerWidth`.
- Selecting daily shows `$0.99`, `灵活体验`, and no savings comparison.
- Selecting weekly shows `$4.99`, `省约 28%`, and the 1-day comparison basis.
- Switching to `自动续费` preserves weekly selection and changes the payment copy and CTA.
- Tab, Enter, and Space operate the plan buttons; focus-visible state exists.
- The floating feedback button is absent and cannot overlap the purchase CTA.

- [ ] **Step 4: Run final repository checks**

Run:

```bash
git diff --check
git status --short --branch
git log -3 --oneline
```

Expected: no whitespace errors, a clean feature worktree, and the selector/detail commits at branch tip.

## Final Verification

- [ ] Compare the implementation line by line with `docs/superpowers/specs/2026-08-03-subscription-plan-selector-design.md`.
- [ ] Confirm all selector buttons are equal in computed width, height, and top position at 390px and 1440px.
- [ ] Confirm the remote publish scope contains only the design, plan, selector, locale verifier, and subscription presentation changes.
