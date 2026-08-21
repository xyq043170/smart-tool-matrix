import { describe, expect, it } from 'vitest'

import { buildPageTitle } from './page-meta'

describe('buildPageTitle', () => {
  it('puts the brand first on the English homepage', () => {
    expect(buildPageTitle({ language: 'en', pageName: 'Practical Online Tools', homepage: true }))
      .toBe('Smart Tool Matrix | Practical Online Tools')
  })

  it('puts the localized brand first on the Chinese homepage', () => {
    expect(buildPageTitle({ language: 'zh-CN', pageName: '实用在线工具', homepage: true }))
      .toBe('智能工具矩阵｜实用在线工具')
  })

  it('puts the page name first on English inner pages', () => {
    expect(buildPageTitle({ language: 'en', pageName: 'About' }))
      .toBe('About | Smart Tool Matrix')
  })

  it('puts the page name first on Chinese inner pages', () => {
    expect(buildPageTitle({ language: 'zh', pageName: '隐私政策' }))
      .toBe('隐私政策｜智能工具矩阵')
  })
})
