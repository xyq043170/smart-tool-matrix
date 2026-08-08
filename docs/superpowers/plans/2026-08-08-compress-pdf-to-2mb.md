# Compress PDF to 2MB Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a crawlable English `/compress-pdf-to-2mb` page that embeds the existing PDF compressor above the fold and gives honest, use-case-specific guidance without promising an exact 2 MB result.

**Architecture:** Add one static HTML artifact under `frontend/public`, expose it through an explicit Vercel route, and extend the existing dependency-free SEO verifier before creating the page. Keep the compressor in the existing `/pdf/` proxy and embed it through a same-origin iframe; add crawlable internal links from the English homepage and current PDF compression guide.

**Tech Stack:** Static HTML/CSS, JSON-LD, Vite 6 public assets, Vercel routes, dependency-free Node.js verification, pnpm.

## Global Constraints

- Canonical URL is exactly `https://www.gotoolmatrix.com/compress-pdf-to-2mb` with no trailing slash.
- The page is English and targets `compress pdf to 2mb` without creating keyword-substitution variants.
- The first viewport contains the H1, an explicit non-guarantee, and `/pdf/compress-pdf.html?embedded=1&lang=en` in an iframe.
- Recommend Balanced, then Aggressive, then Extreme; mention Photon only for scanned or photo-heavy PDFs and warn that it removes text selectability and links.
- Do not invent upload-size, file-count, exact-output, compression-rate, privacy, or payment guarantees.
- Do not modify BentoPDF, quota, authentication, payment, or analytics behavior.
- Preserve the existing English-root, Chinese `/zh/`, image canonical, proxy, pricing, and SEO verification behavior.
- Stage and commit only files listed in each task.

## File map

- `frontend/scripts/verify-seo-pages.mjs`: build-time contract for the page, route, sitemap, metadata, JSON-LD, embed, and internal links.
- `frontend/public/compress-pdf-to-2mb.html`: new crawlable English landing page and embedded compressor shell.
- `vercel.json`: extensionless canonical route to the built static file.
- `frontend/public/sitemap.xml`: canonical URL discovery.
- `frontend/index.html`: raw English homepage crawlable link.
- `frontend/public/guides/compress-pdf.html`: contextual reciprocal link from the detailed PDF compression guide.
- `frontend/src/pages/Market.tsx`: interactive homepage link after React hydration.
- `frontend/src/i18n/locales/en/common.json`: English card title and description.
- `frontend/src/i18n/locales/zh/common.json`: Chinese UI translation for the same internal-link card, while the destination remains the English page.

---

### Task 1: Define the landing-page SEO contract

**Files:**
- Modify: `frontend/scripts/verify-seo-pages.mjs`
- Test: `frontend/scripts/verify-seo-pages.mjs`

**Interfaces:**
- Consumes: built `dist/compress-pdf-to-2mb.html`, `dist/sitemap.xml`, `vercel.json`, `dist/index.html`, and `dist/guides/compress-pdf.html`.
- Produces: non-zero verification exit when the page, canonical route, structured data, embed, sitemap, or internal links drift.

- [ ] **Step 1: Add the page to the built-page uniqueness loop**

Add this entry to `pages` immediately after the homepage entries:

```js
['/compress-pdf-to-2mb', 'dist/compress-pdf-to-2mb.html'],
```

- [ ] **Step 2: Add focused landing-page assertions**

After the page loop, add:

```js
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
```

Parse the new page's existing JSON-LD through the shared page loop, then assert the required node types:

```js
const targetPdfJsonLdSource = targetPdfHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
const targetPdfJsonLd = targetPdfJsonLdSource ? JSON.parse(targetPdfJsonLdSource) : undefined
const targetPdfTypes = new Set((targetPdfJsonLd?.['@graph'] || []).map(node => node['@type']))
for (const type of ['HowTo', 'FAQPage']) {
  if (!targetPdfTypes.has(type)) {
    failed = true
    console.error(`FAIL ${targetPdfRoute}: missing ${type} JSON-LD node`)
  }
}
```

Add these assertions after reading `sitemap`:

```js
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
```

- [ ] **Step 3: Run the verifier and observe the intended red state**

Run:

```bash
cd frontend
pnpm verify:seo
```

Expected: FAIL because `dist/compress-pdf-to-2mb.html`, its Vercel route, sitemap entry, and both internal links do not exist. Existing `/`, `/zh/`, `/image`, proxy, pricing, and old static-page checks must remain PASS.

- [ ] **Step 4: Commit the failing contract**

```bash
git diff -- frontend/scripts/verify-seo-pages.mjs
git add frontend/scripts/verify-seo-pages.mjs
git commit -m "test: define 2MB PDF landing-page contract"
```

---

### Task 2: Build the honest target-size landing page

**Files:**
- Create: `frontend/public/compress-pdf-to-2mb.html`
- Modify: `vercel.json`
- Modify: `frontend/public/sitemap.xml`
- Test: `frontend/scripts/verify-seo-pages.mjs`

**Interfaces:**
- Consumes: the live same-origin compressor `/pdf/compress-pdf.html?embedded=1&lang=en` and existing static-page CSS conventions.
- Produces: the crawlable canonical landing page, embedded compressor, explicit route, and sitemap entry.

- [ ] **Step 1: Create the complete static page**

Create `frontend/public/compress-pdf-to-2mb.html` with:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Compress PDF to 2MB Online | Free Browser Tool</title>
  <meta name="description" content="Compress a PDF toward 2MB in your browser. Start with Balanced, compare stronger settings when needed, and verify output size and document quality.">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
  <link rel="canonical" href="https://www.gotoolmatrix.com/compress-pdf-to-2mb">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.gotoolmatrix.com/compress-pdf-to-2mb">
  <meta property="og:title" content="Compress PDF to 2MB Online">
  <meta property="og:description" content="Use the browser-based PDF compressor and follow an honest setting progression toward a 2MB upload limit.">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary">
  <style>
    :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.65}
    *{box-sizing:border-box}body{margin:0;background:#f7f8fb;color:#172033}a{color:#155eef}
    header,main,footer{max-width:1120px;margin:auto;padding:22px}.nav{display:flex;gap:18px;flex-wrap:wrap}
    .hero{padding:34px 0 18px}.eyebrow{font-weight:700;color:#155eef;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem}
    h1{font-size:clamp(2.2rem,6vw,4.4rem);line-height:1.02;letter-spacing:-.04em;margin:.4rem 0 1rem}h2{margin-top:2.4rem}
    .answer{max-width:800px;font-size:1.08rem}.warning{background:#fff4d6;border-left:4px solid #e6a700;padding:14px 16px;border-radius:8px}
    .tool-shell{margin-top:22px;background:#111827;border-radius:18px;padding:10px;box-shadow:0 20px 60px #1d29391f}
    iframe{display:block;width:100%;height:720px;border:0;border-radius:12px;background:#111827}.fallback{margin:12px 4px 2px;color:#e5e7eb}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#fff;border:1px solid #dfe3eb;border-radius:14px;padding:20px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #d7dce5;padding:11px;text-align:left;vertical-align:top}
    footer{margin-top:32px;border-top:1px solid #dfe3eb}@media(max-width:720px){header,main,footer{padding:16px}.grid{grid-template-columns:1fr}iframe{height:680px}}
  </style>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[{"@type":"HowTo","name":"How to compress a PDF toward 2MB","step":[{"@type":"HowToStep","position":1,"name":"Upload the PDF","text":"Keep the original file, then add the PDF to the browser-based compressor."},{"@type":"HowToStep","position":2,"name":"Choose a setting","text":"Start with Condense and Balanced. If the result remains above 2MB, compare Aggressive and then Extreme."},{"@type":"HowToStep","position":3,"name":"Verify the result","text":"Download the result, check its byte size, and inspect pages, text, links, images and fonts."}]},{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Can this tool guarantee a PDF below 2MB?","acceptedAnswer":{"@type":"Answer","text":"No. Output size depends on images, scans, fonts, attachments, encryption, structure and existing compression."}},{"@type":"Question","name":"Which compression setting should I try first?","acceptedAnswer":{"@type":"Answer","text":"Start with Condense and Balanced for ordinary documents, then compare Aggressive or Extreme only when a smaller file matters more than image quality."}},{"@type":"Question","name":"Should I use Photon for a scanned PDF?","acceptedAnswer":{"@type":"Answer","text":"Photon can help with photo-heavy or scanned files, but it converts pages to images, so text selection, search and links stop working."}},{"@type":"Question","name":"What if the PDF is still larger than 2MB?","acceptedAnswer":{"@type":"Answer","text":"Try a stronger setting, lower image quality or DPI where appropriate, remove unnecessary pages or assets, and verify that the receiving service permits another format or limit."}}]}]}
  </script>
</head>
<body>
  <header><nav class="nav"><a href="/">Smart Tool Matrix</a><a href="/pdf/">PDF Tools</a><a href="/guides/compress-pdf.html">Compression Guide</a><a href="/privacy?lang=en">Privacy</a></nav></header>
  <main>
    <section class="hero"><p class="eyebrow">PDF size-limit workflow</p><h1>Compress PDF to 2MB Online</h1><p class="answer">Use the compressor below, start with Balanced, and verify the downloaded file before uploading it elsewhere. <strong>An exact 2 MB result cannot be guaranteed.</strong></p></section>
    <section class="tool-shell" aria-label="PDF compressor"><iframe title="Compress PDF toward 2MB" src="/pdf/compress-pdf.html?embedded=1&amp;lang=en"></iframe><p class="fallback">Need more space? <a href="/pdf/compress-pdf.html?lang=en">Open the PDF compressor in a full page</a>.</p></section>
    <section><h2>Three steps to work toward a 2MB PDF</h2><div class="grid"><article class="card"><h3>1. Upload</h3><p>Add the PDF and keep the original as a backup.</p></article><article class="card"><h3>2. Compress</h3><p>Use Condense + Balanced first. Compare Aggressive, then Extreme if needed.</p></article><article class="card"><h3>3. Verify</h3><p>Check bytes, pages, text, links, images and fonts before submitting the file.</p></article></div></section>
    <section><h2>Which setting should you use?</h2><table><thead><tr><th>Setting</th><th>Use it when</th><th>Trade-off</th></tr></thead><tbody><tr><td>Balanced</td><td>Ordinary office PDFs; recommended starting point.</td><td>Balances image quality and size reduction.</td></tr><tr><td>Aggressive</td><td>The first result remains above 2MB.</td><td>More visible image-quality loss is possible.</td></tr><tr><td>Extreme</td><td>The upload limit matters more than appearance.</td><td>Inspect every page carefully.</td></tr><tr><td>Photon</td><td>Photo-heavy or scanned PDFs.</td><td>Pages become images; text selection, search and links are lost.</td></tr></tbody></table></section>
    <section><h2>Why is my PDF still above 2MB?</h2><p>Scanned pages, high-resolution photos, embedded fonts, attachments, complex objects, encryption and a file that is already compressed can limit further reduction. A stronger setting may help, but some files cannot reach 2MB without removing content or accepting substantial quality loss.</p><div class="warning"><strong>Privacy and safety:</strong> processing is designed to run in your browser, but this is an architecture statement rather than an independent security audit. Keep the original and inspect network behavior before using confidential or regulated files.</div></section>
    <section><h2>Frequently asked questions</h2><h3>Can this guarantee a PDF below 2MB?</h3><p>No. The result depends on the file contents and structure.</p><h3>Do I need an account?</h3><p>You can open the embedded compressor without creating an account. Current availability and site access terms may change.</p><h3>What else can I try?</h3><p>Read the <a href="/guides/compress-pdf.html">full compression guide</a>, browse all <a href="/pdf/">PDF tools</a>, or review <a href="/subscription">access-pass options</a>. Payment does not guarantee a particular output size.</p></section>
  </main>
  <footer><a href="/privacy?lang=en">Privacy</a> · <a href="/terms?lang=en">Terms</a> · Smart Tool Matrix</footer>
</body>
</html>
```

- [ ] **Step 2: Add the extensionless Vercel route**

Add before the `/about` static route in `vercel.json`:

```json
{
  "src": "/compress-pdf-to-2mb",
  "dest": "/frontend/compress-pdf-to-2mb.html"
}
```

- [ ] **Step 3: Add the page to the sitemap exactly once**

Add after the root URL in `frontend/public/sitemap.xml`:

```xml
<url>
  <loc>https://www.gotoolmatrix.com/compress-pdf-to-2mb</loc>
  <lastmod>2026-08-08</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.9</priority>
</url>
```

- [ ] **Step 4: Build and confirm page-level checks are green except internal links**

Run:

```bash
cd frontend
pnpm build
```

Expected: the new page, metadata, JSON-LD, iframe, route, and sitemap checks pass; the build still fails only because homepage and guide internal links are not yet added.

- [ ] **Step 5: Commit the page, route, and sitemap**

```bash
git diff -- frontend/public/compress-pdf-to-2mb.html frontend/public/sitemap.xml vercel.json
git add frontend/public/compress-pdf-to-2mb.html frontend/public/sitemap.xml vercel.json
git commit -m "feat: add compress PDF to 2MB landing page"
```

---

### Task 3: Add crawlable and interactive internal links

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/public/guides/compress-pdf.html`
- Modify: `frontend/src/pages/Market.tsx`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/i18n/locales/zh/common.json`
- Test: `frontend/scripts/verify-seo-pages.mjs`

**Interfaces:**
- Consumes: `/compress-pdf-to-2mb` from Task 2 and the existing homepage guide-card grid.
- Produces: crawlable static links plus a translated React card for hydrated users.

- [ ] **Step 1: Add a raw English homepage link**

In the static English `frontend/index.html`, add this section after the productivity-tool list and before access-pass content:

```html
<section>
  <h2>Popular PDF workflows</h2>
  <p><a href="/compress-pdf-to-2mb">Compress a PDF toward a 2MB upload limit</a> with an embedded browser tool, setting progression and honest result limits.</p>
</section>
```

- [ ] **Step 2: Add a contextual link to the existing compression guide**

After the direct-answer paragraph in `frontend/public/guides/compress-pdf.html`, add:

```html
<p>Need to meet a file-upload limit? Use the English <a href="/compress-pdf-to-2mb">Compress PDF to 2MB workflow</a>; it explains which settings to compare without promising an exact output size.</p>
```

- [ ] **Step 3: Add translated card copy**

Inside `market` in `frontend/src/i18n/locales/en/common.json`, add:

```json
"compressTo2MbTitle": "Compress PDF toward 2MB",
"compressTo2MbDesc": "Use the embedded compressor and compare settings for a 2MB upload limit without a guaranteed output size."
```

Add matching keys to Chinese `common.json`:

```json
"compressTo2MbTitle": "将 PDF 压缩到接近 2MB",
"compressTo2MbDesc": "使用嵌入式压缩工具比较不同档位，以满足 2MB 上传限制；结果大小不作保证。"
```

- [ ] **Step 4: Add the React homepage card**

Change the guide-card grid in `frontend/src/pages/Market.tsx` from `md:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-4`, and insert before the existing compression-guide card:

```tsx
<a href="/compress-pdf-to-2mb" className="rounded-2xl bg-muted/60 p-5 transition hover:bg-muted">
  <h3 className="font-bold">{tc('market.compressTo2MbTitle')}</h3>
  <p className="mt-2 text-sm leading-6 text-muted-foreground">{tc('market.compressTo2MbDesc')}</p>
</a>
```

- [ ] **Step 5: Run the complete production build**

Run:

```bash
cd frontend
pnpm build
pnpm verify:seo
```

Expected: TypeScript, Vite, SEO verification, pricing verification, the new page contract, the new route, sitemap uniqueness, and both static internal-link checks all exit 0.

- [ ] **Step 6: Commit the internal-link delivery**

```bash
git diff -- frontend/index.html frontend/public/guides/compress-pdf.html frontend/src/pages/Market.tsx frontend/src/i18n/locales/en/common.json frontend/src/i18n/locales/zh/common.json
git add frontend/index.html frontend/public/guides/compress-pdf.html frontend/src/pages/Market.tsx frontend/src/i18n/locales/en/common.json frontend/src/i18n/locales/zh/common.json
git commit -m "feat: link the 2MB PDF workflow"
```

---

### Task 4: Browser and final regression verification

**Files:**
- Verify: all files from Tasks 1-3
- Verify: repository worktree state

**Interfaces:**
- Consumes: the built page and all route/SEO/internal-link changes.
- Produces: evidence that the page is usable locally and the branch contains only intended commits.

- [ ] **Step 1: Start a local preview**

Run:

```bash
cd frontend
pnpm preview --host 127.0.0.1
```

- [ ] **Step 2: Verify desktop behavior in a browser**

Open `http://127.0.0.1:4173/compress-pdf-to-2mb.html` because Vite preview serves the physical built file rather than applying Vercel's extensionless route. Confirm:

- title and H1 render in English;
- the exact non-guarantee is visible above the fold;
- the iframe loads `/pdf/compress-pdf.html?embedded=1&lang=en`;
- the full-page fallback link resolves to `/pdf/compress-pdf.html?lang=en`;
- Balanced → Aggressive → Extreme and Photon trade-offs are visible;
- FAQ and privacy text render.

- [ ] **Step 3: Verify narrow viewport behavior**

At a 390 × 844 viewport, confirm there is no horizontal page overflow, the three-step grid becomes one column, and the embedded compressor remains reachable and scrollable.

- [ ] **Step 4: Stop preview and run final verification**

Run:

```bash
cd frontend
pnpm build
git diff --check
git status --short
git log --oneline -5
```

Expected: build exits 0; no whitespace errors; worktree is clean; the branch contains the design, contract, page, and link commits only.

- [ ] **Step 5: Report verification boundaries**

Report exactly:

```text
Verified: production build, SEO and pricing checks, local desktop and narrow page layout, embedded-compressor rendering, fallback link.
Not verified: live Vercel route, live iframe behavior, Google indexing, query impressions, conversions, or analytics events until the branch is pushed and deployed.
```
