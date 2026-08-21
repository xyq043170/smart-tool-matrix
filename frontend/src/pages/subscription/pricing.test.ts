import { describe, expect, it } from 'vitest'

import { PLANS } from './pricing'

describe('subscription plans', () => {
  it('offers a one-time lifetime plan at the approved launch price', () => {
    expect(PLANS).toContainEqual({
      id: 'lifetime',
      price: 79,
      durationDays: null,
      period: 'lifetime',
      badgeKey: 'lifetime',
      comparisonId: null,
    })
  })
})
