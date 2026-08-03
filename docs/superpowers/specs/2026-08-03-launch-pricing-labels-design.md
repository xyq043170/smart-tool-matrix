# Launch Pricing Labels Design

## Goal

Increase the perceived value of the existing access-pass prices without changing the amounts or implying a fabricated sales history.

Current prices remain:

- 1 day: $0.99
- 7 days: $4.99
- 30 days: $9.99
- 365 days: $59.99

The same presentation applies to both one-time and recurring purchase tabs.

## Pricing message

Show a page-level badge above the plans:

- Chinese: `首发优惠价`
- English: `Launch pricing`

Show supporting copy immediately below it:

- Chinese: `当前为产品上线阶段优惠价格，未来可能调整；结账前会显示最终金额。`
- English: `Current prices are introductory launch prices and may change in the future. The final amount is shown before checkout.`

Do not describe the offer as limited-time unless a real end date is selected and enforced.

## Plan labels

Use comparisons derived from the prices currently displayed on the same page:

| Plan | Label | Comparison basis |
| --- | --- | --- |
| 1 day | `灵活体验` / `Flexible` | No savings claim |
| 7 days | `省约 28%` / `Save about 28%` | Daily rate compared with seven 1-day passes: `1 - 4.99 / (7 × 0.99)` |
| 30 days | `最受欢迎` / `Most popular`, plus `省约 53%` / `Save about 53%` | Daily rate compared with the 7-day pass: `1 - (9.99 / 30) / (4.99 / 7)` |
| 365 days | `最划算` / `Best value`, plus `省约 51%` / `Save about 51%` | Daily rate compared with the 30-day pass: `1 - (59.99 / 365) / (9.99 / 30)` |

Every percentage must be accompanied by, or have an accessible tooltip containing, its comparison basis. The wording must say `about` because displayed percentages are rounded.

## Visual hierarchy

- Keep the current price as the largest text in each plan card.
- Place the plan label near the plan name, not over the purchase button.
- Give the 30-day card a restrained `Most popular` emphasis.
- Give the 365-day card the `Best value` label, but do not visually overpower the 30-day recommendation.
- Do not add a struck-through price.

## Guardrails

- Do not use `原价`, `was`, `regular price`, or a crossed-out amount until that amount has a genuine, supportable pricing basis.
- Do not claim a historical discount or use countdown timers.
- Do not imply that a future price increase is guaranteed.
- Recalculate or remove savings labels whenever any plan price or duration changes.
- Checkout remains the source of truth for the final price, currency, renewal type, and duration.

## Acceptance criteria

- All four existing amounts are unchanged.
- Chinese and English pages communicate launch pricing consistently.
- The 7-day, 30-day, and 365-day savings figures match the formulas above after rounding.
- One-time and recurring tabs do not make conflicting claims.
- No fabricated reference price, historical discount, or artificial deadline appears.
- Savings explanations remain understandable on mobile and available to assistive technology.
