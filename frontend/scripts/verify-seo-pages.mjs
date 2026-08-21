import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const vercelConfig = JSON.parse(readFileSync('../vercel.json', 'utf8'))

const pages = [
  ['/', 'dist/index.html'],
  ['/zh/', 'dist/zh/index.html'],
  ['/compress-pdf-to-2mb', 'dist/compress-pdf-to-2mb.html'],
  ['/about', 'dist/about.html'],
  ['/website-inspection', 'dist/website-inspection.html'],
  ['/guides/', 'dist/guides/index.html'],
  ['/pdf-tools.html', 'dist/pdf-tools.html'],
  ['/guides/merge-pdf.html', 'dist/guides/merge-pdf.html'],
  ['/guides/compress-pdf.html', 'dist/guides/compress-pdf.html'],
  ['/guides/compress-image.html', 'dist/guides/compress-image.html'],
  ['/verification.html', 'dist/verification.html'],
  ['/privacy', 'dist/privacy.html'],
  ['/terms', 'dist/terms.html'],
  ['/changelog', 'dist/changelog.html'],
]

const hashes = new Map()
let failed = false

const faviconSignals = [
  '<link rel="icon" href="/icon.svg" type="image/svg+xml"',
  '<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png"',
  '<link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png"',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png"',
  '<link rel="manifest" href="/site.webmanifest"',
]

function readPngSize(file) {
  const png = readFileSync(file)
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

for (const [file, expectedSize] of [
  ['dist/favicon-16x16.png', 16],
  ['dist/favicon-32x32.png', 32],
  ['dist/apple-touch-icon.png', 180],
  ['dist/android-chrome-192x192.png', 192],
  ['dist/android-chrome-512x512.png', 512],
]) {
  if (!existsSync(file) || readPngSize(file).some(size => size !== expectedSize)) {
    failed = true
    console.error(`FAIL ${file}: expected ${expectedSize}x${expectedSize} PNG`)
  } else {
    console.log(`PASS ${file}: ${expectedSize}x${expectedSize} PNG`)
  }
}

for (const file of ['dist/icon.svg', 'dist/favicon.ico', 'dist/site.webmanifest']) {
  if (!existsSync(file)) {
    failed = true
    console.error(`FAIL ${file}: missing favicon asset`)
  } else {
    console.log(`PASS ${file}: favicon asset exists`)
  }
}

const homepageSignals = new Map([
  ['/', [
    ['document language', '<html lang="en">'],
    ['self canonical', '<link rel="canonical" href="https://www.gotoolmatrix.com/"'],
    ['English hreflang', 'hreflang="en" href="https://www.gotoolmatrix.com/"'],
    ['Chinese hreflang', 'hreflang="zh-CN" href="https://www.gotoolmatrix.com/zh/"'],
    ['English Open Graph locale', '<meta property="og:locale" content="en_US"'],
  ]],
  ['/zh/', [
    ['document language', '<html lang="zh-CN">'],
    ['self canonical', '<link rel="canonical" href="https://www.gotoolmatrix.com/zh/"'],
    ['English hreflang', 'hreflang="en" href="https://www.gotoolmatrix.com/"'],
    ['Chinese hreflang', 'hreflang="zh-CN" href="https://www.gotoolmatrix.com/zh/"'],
    ['Chinese Open Graph locale', '<meta property="og:locale" content="zh_CN"'],
  ]],
])

const routeMap = new Map(vercelConfig.routes.map(({ src, dest }) => [src, dest]))
const imageRootRoute = vercelConfig.routes.find(({ src }) => src === '/image')
if (imageRootRoute?.status !== 308 || imageRootRoute?.headers?.Location !== '/image/') {
  failed = true
  console.error('FAIL /image: expected permanent redirect to /image/')
} else {
  console.log('PASS /image: permanent redirect to canonical trailing-slash URL')
}

for (const [route, canonicalRoute] of [['/pdf', '/pdf/'], ['/developer', '/developer/']]) {
  const rootRoute = vercelConfig.routes.find(({ src }) => src === route)
  if (rootRoute?.status !== 308 || rootRoute?.headers?.Location !== canonicalRoute) {
    failed = true
    console.error(`FAIL ${route}: expected permanent redirect to ${canonicalRoute}`)
  } else {
    console.log(`PASS ${route}: permanent redirect to ${canonicalRoute}`)
  }
}

const seoOrigin = 'https://seo-tools-project.905501891.workers.dev'
const expectedSeoRoutes = [
  ['/seo', `${seoOrigin}/check`],
  ['/seo/', `${seoOrigin}/check`],
  ['/seo/(.*)', `${seoOrigin}/check/$1`],
  ['/seo-api/(.*)', `${seoOrigin}/api/$1`],
  ['/_astro/(.*)', `${seoOrigin}/_astro/$1`],
  ['/fonts/(.*)', `${seoOrigin}/fonts/$1`],
]
for (const [route, expectedDestination] of expectedSeoRoutes) {
  if (routeMap.get(route) !== expectedDestination) {
    failed = true
    console.error(`FAIL ${route}: expected ${expectedDestination}, got ${routeMap.get(route) || 'missing'}`)
  } else {
    console.log(`PASS ${route}: explicit website-inspection proxy route`)
  }
}

for (const [route, file] of pages) {
  if (!existsSync(file)) {
    failed = true
    console.error(`FAIL ${route}: expected built page ${file}`)
    continue
  }
  const html = readFileSync(file, 'utf8')
  const hash = createHash('sha256').update(html).digest('hex').slice(0, 12)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1]?.replace(/<[^>]+>/g, '').trim()
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]

  for (const block of jsonLdBlocks) JSON.parse(block[1])
  if (!title || !h1 || !canonical || !canonical.startsWith('https://www.gotoolmatrix.com/')) {
    failed = true
    console.error(`FAIL ${route}: title=${Boolean(title)} h1=${Boolean(h1)} canonical=${canonical || 'missing'}`)
  }
  const isChinese = html.includes('<html lang="zh-CN">')
  const hasStandardTitle = route === '/'
    ? title === 'Smart Tool Matrix | Practical Online Tools'
    : route === '/zh/'
      ? title === '智能工具矩阵｜实用在线工具'
      : isChinese
        ? title?.endsWith('｜智能工具矩阵')
        : title?.endsWith(' | Smart Tool Matrix')
  if (!hasStandardTitle) {
    failed = true
    console.error(`FAIL ${route}: non-standard browser title "${title || 'missing'}"`)
  }
  for (const signal of faviconSignals) {
    if (!html.includes(signal)) {
      failed = true
      console.error(`FAIL ${route}: missing favicon declaration ${signal}`)
    }
  }
  for (const [signal, expected] of homepageSignals.get(route) || []) {
    if (!html.includes(expected)) {
      failed = true
      console.error(`FAIL ${route}: missing ${signal}`)
    }
  }
  if (hashes.has(hash)) {
    failed = true
    console.error(`FAIL ${route}: duplicate raw HTML with ${hashes.get(hash)} (${hash})`)
  }
  hashes.set(hash, route)
  console.log(`PASS ${route} bytes=${Buffer.byteLength(html)} sha256=${hash} jsonld=${jsonLdBlocks.length}`)
}

const targetPdfRoute = '/compress-pdf-to-2mb'
const targetPdfUrl = `https://www.gotoolmatrix.com${targetPdfRoute}`
const targetPdfHtml = existsSync('dist/compress-pdf-to-2mb.html')
  ? readFileSync('dist/compress-pdf-to-2mb.html', 'utf8')
  : ''

const targetPdfSignals = [
  ['English document language', '<html lang="en">'],
  ['exact canonical', `<link rel="canonical" href="${targetPdfUrl}">`],
  ['Open Graph URL', `<meta property="og:url" content="${targetPdfUrl}">`],
  ['2 MB H1', '<h1>Compress PDF to 2MB Online</h1>'],
  ['embedded compressor', 'src="/pdf/compress-pdf.html?embedded=1&amp;lang=en"'],
  ['full-page fallback', 'href="/pdf/compress-pdf.html?lang=en"'],
  ['PDF collection link', 'href="/pdf/"'],
  ['compression guide link', 'href="/guides/compress-pdf.html"'],
  ['privacy link', 'href="/privacy?lang=en"'],
  ['subscription link', 'href="/subscription"'],
  ['non-guarantee', 'An exact 2 MB result cannot be guaranteed.'],
]

for (const [signal, expected] of targetPdfSignals) {
  if (!targetPdfHtml.includes(expected)) {
    failed = true
    console.error(`FAIL ${targetPdfRoute}: missing ${signal}`)
  }
}

if (routeMap.get(targetPdfRoute) !== '/frontend/compress-pdf-to-2mb.html') {
  failed = true
  console.error(`FAIL ${targetPdfRoute}: missing canonical static route`)
}

const targetPdfJsonLdSource = targetPdfHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
const targetPdfJsonLd = targetPdfJsonLdSource ? JSON.parse(targetPdfJsonLdSource) : undefined
const targetPdfTypes = new Set((targetPdfJsonLd?.['@graph'] || []).map(node => node['@type']))
for (const type of ['HowTo', 'FAQPage']) {
  if (!targetPdfTypes.has(type)) {
    failed = true
    console.error(`FAIL ${targetPdfRoute}: missing ${type} JSON-LD node`)
  }
}

const sitemap = readFileSync('dist/sitemap.xml', 'utf8')
const targetPdfSitemapEntry = `<loc>${targetPdfUrl}</loc>`
if (sitemap.split(targetPdfSitemapEntry).length - 1 !== 1) {
  failed = true
  console.error(`FAIL sitemap: expected exactly one ${targetPdfUrl}`)
}

for (const [file, label] of [
  ['dist/index.html', 'English homepage'],
  ['dist/guides/compress-pdf.html', 'PDF compression guide'],
]) {
  if (!readFileSync(file, 'utf8').includes('href="/compress-pdf-to-2mb"')) {
    failed = true
    console.error(`FAIL ${label}: missing target-size landing-page link`)
  }
}

for (const homepageUrl of [
  'https://www.gotoolmatrix.com/',
  'https://www.gotoolmatrix.com/zh/',
]) {
  if (!sitemap.includes(`<loc>${homepageUrl}</loc>`)) {
    failed = true
    console.error(`FAIL sitemap: missing ${homepageUrl}`)
  }
}

for (const collectionUrl of [
  'https://www.gotoolmatrix.com/pdf/',
  'https://www.gotoolmatrix.com/developer/',
]) {
  if (sitemap.split(`<loc>${collectionUrl}</loc>`).length - 1 !== 1) {
    failed = true
    console.error(`FAIL sitemap: expected exactly one ${collectionUrl}`)
  }
}

if (sitemap.includes('<loc>https://www.gotoolmatrix.com/en/</loc>')) {
  failed = true
  console.error('FAIL sitemap: legacy /en/ homepage must not be indexed')
}

for (const route of ['/zh', '/zh/']) {
  if (routeMap.get(route) !== '/frontend/zh/index.html') {
    failed = true
    console.error(`FAIL ${route}: missing Chinese homepage route`)
  }
}

for (const route of ['/en', '/en/']) {
  const config = vercelConfig.routes.find(({ src }) => src === route)
  if (config?.status !== 308 || config?.headers?.Location !== '/') {
    failed = true
    console.error(`FAIL ${route}: expected permanent redirect to /`)
  }
}

if (failed) process.exit(1)
