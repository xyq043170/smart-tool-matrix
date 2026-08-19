import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { describe, expect, it, vi } from 'vitest'
import MainLayout from '@/layouts/MainLayout'
import MarketPage from '@/pages/Market'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}))

const AI_TOOL_PIXEL_URL = 'https://aitoolpixel.com/'
const COOKSIFT_URL = 'https://www.cooksift.com/'

function externalLinkTags(html: string) {
  return html.match(new RegExp(`<a[^>]+href="${AI_TOOL_PIXEL_URL}"[^>]*>`, 'g')) ?? []
}

function expectSafeAiToolPixelLink(html: string) {
  const links = externalLinkTags(html)

  expect(links).toHaveLength(1)
  expect(links[0]).toContain('target="_blank"')
  expect(links[0]).toContain('rel="noopener noreferrer"')
}

function cookSiftLinkTags(html: string) {
  return html.match(new RegExp(`<a[^>]+href="${COOKSIFT_URL}"[^>]*>`, 'g')) ?? []
}

function expectSafeCookSiftLink(html: string) {
  const links = cookSiftLinkTags(html)

  expect(links).toHaveLength(1)
  expect(links[0]).toContain('target="_blank"')
  expect(links[0]).toContain('rel="noopener noreferrer"')
}

describe('AI Tool Pixel referrals', () => {
  it('renders one safe external link on the homepage', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <MarketPage />
      </StaticRouter>,
    )

    expectSafeAiToolPixelLink(html)
  })

  it('renders one safe external link in the global footer', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <MainLayout>
          <p>Page content</p>
        </MainLayout>
      </StaticRouter>,
    )

    expectSafeAiToolPixelLink(html)
  })
})

describe('CookSift referrals', () => {
  it('renders one safe external link on the homepage', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <MarketPage />
      </StaticRouter>,
    )

    expectSafeCookSiftLink(html)
  })

  it('renders one safe external link in the global footer', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <MainLayout>
          <p>Page content</p>
        </MainLayout>
      </StaticRouter>,
    )

    expectSafeCookSiftLink(html)
  })
})
