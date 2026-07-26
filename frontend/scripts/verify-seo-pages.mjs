import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const pages = [
  ['/', 'dist/index.html'],
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

for (const [route, file] of pages) {
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
  if (hashes.has(hash)) {
    failed = true
    console.error(`FAIL ${route}: duplicate raw HTML with ${hashes.get(hash)} (${hash})`)
  }
  hashes.set(hash, route)
  console.log(`PASS ${route} bytes=${Buffer.byteLength(html)} sha256=${hash} jsonld=${jsonLdBlocks.length}`)
}

if (failed) process.exit(1)
