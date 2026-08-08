import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const vercelConfig = JSON.parse(readFileSync('../vercel.json', 'utf8'))

const pages = [
  ['/', 'dist/index.html'],
  ['/en/', 'dist/en/index.html'],
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

const routeMap = new Map(vercelConfig.routes.map(({ src, dest }) => [src, dest]))
const imageRootRoute = vercelConfig.routes.find(({ src }) => src === '/image')
if (imageRootRoute?.status !== 308 || imageRootRoute?.headers?.Location !== '/image/') {
  failed = true
  console.error('FAIL /image: expected permanent redirect to /image/')
} else {
  console.log('PASS /image: permanent redirect to canonical trailing-slash URL')
}

const seoOrigin = 'https://seo-tools-project-production.up.railway.app'
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
  if (route === '/en/') {
    const expectedEnglishSignals = [
      ['document language', '<html lang="en">'],
      ['self canonical', '<link rel="canonical" href="https://www.gotoolmatrix.com/en/"'],
      ['English hreflang', 'hreflang="en" href="https://www.gotoolmatrix.com/en/"'],
      ['Chinese hreflang', 'hreflang="zh-CN" href="https://www.gotoolmatrix.com/"'],
    ]
    for (const [signal, expected] of expectedEnglishSignals) {
      if (!html.includes(expected)) {
        failed = true
        console.error(`FAIL ${route}: missing ${signal}`)
      }
    }
  }
  if (hashes.has(hash)) {
    failed = true
    console.error(`FAIL ${route}: duplicate raw HTML with ${hashes.get(hash)} (${hash})`)
  }
  hashes.set(hash, route)
  console.log(`PASS ${route} bytes=${Buffer.byteLength(html)} sha256=${hash} jsonld=${jsonLdBlocks.length}`)
}

const sitemap = readFileSync('dist/sitemap.xml', 'utf8')
if (!sitemap.includes('<loc>https://www.gotoolmatrix.com/en/</loc>')) {
  failed = true
  console.error('FAIL sitemap: missing canonical English homepage')
}

for (const route of ['/en', '/en/']) {
  if (routeMap.get(route) !== '/frontend/en/index.html') {
    failed = true
    console.error(`FAIL ${route}: missing English landing-page route`)
  }
}

if (failed) process.exit(1)
