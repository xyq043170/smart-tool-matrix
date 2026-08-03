# Subscription Plan Selector Design

## Goal

Replace the four visually inconsistent full pricing cards with one compact, four-option plan selector and one shared detail card. All four plan options must remain on one row on desktop and mobile without horizontal scrolling.

The redesign must preserve the existing prices, savings calculations, bilingual launch-pricing copy, payment behavior, and promotional-claim guardrails.

## Selected approach

Use a four-column plan selector above a single detail card:

1. The selector shows all four plans as equal-width buttons in one row.
2. Selecting a plan updates the shared detail card below it.
3. The detail card contains the selected plan's full pricing explanation, benefits, and only purchase button.
4. The monthly plan is selected by default because it is the restrained primary recommendation.

This avoids squeezing four complete cards into a mobile viewport while keeping every plan immediately visible.

## Information architecture

The existing page-level order remains:

1. Page heading and account/subscription status notices.
2. Launch-pricing badge and explanatory copy.
3. One-time versus recurring billing tabs.
4. Four-option plan selector.
5. Selected-plan detail card.

The billing tabs and plan selector represent independent choices. Changing the billing type must preserve the selected plan. Changing the plan must preserve the billing type.

## Plan selector

Render the selector as a semantic single-choice group with four equal columns:

- Daily: plan name, `$0.99`, and `Flexible` / `灵活体验`.
- Weekly: plan name, `$4.99`, and `Save about 28%` / `省约 28%`.
- Monthly: plan name, `$9.99`, and `Most popular` / `最受欢迎`.
- Yearly: plan name, `$59.99`, and `Best value` / `最划算`.

Each option is a real button with `aria-pressed` reflecting selection. Arrow-key behavior is not required because native buttons remain individually reachable; Tab and Enter/Space must work without custom keyboard code.

The selected option uses the primary border, a subtle primary background, and a restrained ring. Unselected options share the same neutral border, background, typography, height, and spacing. Hover and focus-visible states must be distinct without changing layout dimensions.

The selector defaults to the monthly plan on initial page load. It does not persist selection between visits.

## Responsive behavior

The selector always uses four columns and never becomes a vertical stack or horizontal carousel.

At mobile widths:

- Reduce horizontal padding and type size while retaining a minimum 44-pixel interactive height.
- Keep prices on one line.
- Allow the secondary label to wrap to at most two short lines within its option.
- Do not display the longer savings comparison basis inside the selector.
- Do not introduce horizontal page overflow.

At tablet and desktop widths, increase padding and spacing but keep the same four-column structure.

## Selected-plan detail card

Render one full-width card below the selector. Its visual structure is identical for every plan:

1. Plan name and recommendation/value badge where applicable.
2. Price as the largest text, followed by its billing period.
3. Savings percentage and visible comparison basis when the selected plan has a comparison.
4. Current one-time or recurring payment explanation.
5. Existing three benefit rows.
6. One full-width purchase button.

The daily plan shows `Flexible` / `灵活体验` and no savings claim or comparison basis. The weekly plan shows the 28% claim and daily comparison. The monthly plan shows `Most popular` / `最受欢迎`, the 53% claim, and weekly comparison. The yearly plan shows `Best value` / `最划算`, the 51% claim, and monthly comparison.

The detail card uses one consistent spacing, border, background, type scale, icon treatment, and button placement across all four plans. Only its content and selected-plan emphasis change.

## Data and state

Continue using `PLANS`, `formatUsd`, and `getSavingsPercent` from the existing pricing model.

Add local state in `SubscriptionPage` for the selected plan ID, initialized to `monthly`. Derive the selected plan from `PLANS`; do not duplicate prices, durations, badges, or comparison relationships in component state.

The existing purchase handler receives the selected plan ID. Payment requests, loading keys, authentication redirects, PayPal behavior, and cancellation behavior remain unchanged.

## Copy and promotional guardrails

Keep all existing Chinese and English launch-pricing strings. Do not add or change prices, struck-through prices, reference prices, countdowns, limited-time language, or guaranteed future-price claims.

The visible comparison basis remains in the detail card so savings claims are understandable on mobile and available to assistive technology without hover or a tooltip.

## Accessibility

- Use a labelled group for the four plan buttons.
- Expose selection with `aria-pressed`.
- Preserve visible focus indicators.
- Keep every selector option and purchase button keyboard operable.
- Mark decorative benefit icons as hidden from assistive technology.
- Ensure color is not the only selection indicator; selected state must include border/ring and accessible pressed state.
- Maintain readable contrast in light and dark themes.

## Error and loading behavior

No new network behavior is introduced. While a purchase is loading, disable the purchase button and preserve the selected plan and billing type. Existing toast and checkout error handling remains unchanged.

## Verification and acceptance criteria

- Four plan buttons appear in one row at 390px, tablet, and desktop widths.
- The selector does not cause horizontal overflow.
- Monthly is selected by default.
- Clicking each option updates the detail card's plan name, exact price, period, label, savings, and comparison basis.
- Daily shows no savings claim.
- Switching billing tabs preserves the selected plan and changes only the payment explanation and purchase CTA wording.
- The purchase request still uses the selected plan ID and current billing type.
- Keyboard users can reach, select, and identify every plan.
- All exact prices remain `$0.99`, `$4.99`, `$9.99`, and `$59.99`.
- Savings remain approximately 28%, 53%, and 51% using the existing formulas.
- No forbidden promotional claims or artificial urgency appear.
- The floating feedback button remains hidden on the subscription page so it cannot overlap the purchase CTA.
- Pricing verification, TypeScript, production build, and Chinese/English browser checks pass.

## Out of scope

- Changing prices, durations, comparison formulas, or PayPal configuration.
- Persisting the selected plan in a URL, account, cookie, or local storage.
- Adding annual/monthly currency conversion, taxes, coupons, or countdowns.
- Redesigning subscription status and cancellation cards.
- Repairing the repository's existing ESLint 9 configuration gap.
