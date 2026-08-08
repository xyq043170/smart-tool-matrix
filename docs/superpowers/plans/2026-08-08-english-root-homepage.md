# English Root Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `https://www.gotoolmatrix.com/` always render English and provide the Chinese homepage at the canonical `/zh/` path.

**Architecture:** Keep one React application and select the homepage language from its canonical pathname before i18next initializes. Reassign the existing English and Chinese static entry documents to `/` and `/zh/`, update Vite and Vercel routing accordingly, and turn `/en` variants into redirects to the English root. Extend the existing dependency-free SEO verifier so runtime routes, built metadata, and sitemap declarations cannot drift apart.

**Tech Stack:** React 18, TypeScript 5.6, Vite 6, react-i18next/i18next, Vercel route configuration, dependency-free Node.js verification, pnpm.

## Global Constraints

- `/` always initializes in English, regardless of browser language or `toolMatrixLanguage` in local storage.
- `/zh` and `/zh/` always initialize in Chinese, regardless of stored language.
- Homepage switching navigates between `/` and `/zh/`; other routes keep the existing explicit-language preference behavior.
- `/en` and `/en/` redirect to `/` and must not remain crawlable duplicate English pages.
- Root metadata is English; `/zh/` metadata is Chinese; both declare matching canonical, hreflang, Open Graph, and structured-data URLs.
- Reuse existing English and Chinese copy. Do not rewrite customer-facing content or application components.
- Preserve unrelated uncommitted changes. Stage and commit only the files explicitly listed in each task after reviewing `git diff -- <paths>`.
- Follow red-green order: verifier changes must demonstrably fail before production/configuration changes make them pass.

## File map

- `frontend/scripts/verify-seo-pages.mjs`: executable contract for built homepage files, canonical metadata, sitemap entries, and Vercel routes.
- `frontend/index.html`: canonical English root static entry, based on the current English document.
- `frontend/zh/index.html`: canonical Chinese static entry, based on the current root document.
- `frontend/en/index.html`: removed after its English content moves to the root entry.
- `frontend/vite.config.ts`: builds the root and Chinese HTML inputs.
- `frontend/public/sitemap.xml`: lists `/` and `/zh/`, not `/en/`.
- `vercel.json`: serves `/zh/` and redirects legacy `/en` variants to `/`.
- `frontend/src/i18n/index.ts`: maps canonical homepage pathnames to fixed languages.
- `frontend/src/App.tsx`: exposes the same market page at `/` and `/zh/`.
- `frontend/src/components/LanguageSwitcher.tsx`: navigates between canonical homepage URLs.

---

### Task 1: Define the canonical homepage contract

**Files:**
- Modify: `frontend/scripts/verify-seo-pages.mjs`
- Test: `frontend/scripts/verify-seo-pages.mjs`

**Interfaces:**
- Consumes: built files under `frontend/dist`, `frontend/public/sitemap.xml` copied to `dist/sitemap.xml`, and `vercel.json.routes` entries.
- Produces: a non-zero exit status when `/`, `/zh/`, `/en`, or `/en/` violates the approved canonical-language contract.

- [ ] **Step 1: Replace the old English-path assertions with failing root/Chinese assertions**

Update `pages` so its homepage entries are exactly:

```js
const pages = [
  ['/', 'dist/index.html'],
  ['/zh/', 'dist/zh/index.html'],
  // Keep all existing non-homepage entries unchanged.
]
```

Add a focused helper and expected signal map near `failed`:

```js
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
```

Inside the page loop, replace the `/en/` special case with:

```js
for (const [signal, expected] of homepageSignals.get(route) || []) {
  if (!html.includes(expected)) {
    failed = true
    console.error(`FAIL ${route}: missing ${signal}`)
  }
}
```

Replace sitemap and route assertions with:

```js
for (const homepageUrl of [
  'https://www.gotoolmatrix.com/',
  'https://www.gotoolmatrix.com/zh/',
]) {
  if (!sitemap.includes(`<loc>${homepageUrl}</loc>`)) {
    failed = true
    console.error(`FAIL sitemap: missing ${homepageUrl}`)
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
```

- [ ] **Step 2: Run the verifier and confirm the new contract fails for the expected reasons**

Run:

```bash
cd frontend
pnpm verify:seo
```

Expected: FAIL because `dist/zh/index.html` is missing, root metadata is still Chinese, the sitemap still contains `/en/`, and Vercel lacks the approved `/zh/` plus redirect configuration. Existing unrelated verifier failures, if any, must be recorded separately and not mistaken for the intended red state.

- [ ] **Step 3: Review and commit only the verifier contract**

```bash
git diff -- frontend/scripts/verify-seo-pages.mjs
git add frontend/scripts/verify-seo-pages.mjs
git commit -m "test: define canonical homepage languages"
```

---

### Task 2: Reassign static entry documents and deployment routes

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/zh/index.html`
- Delete: `frontend/en/index.html`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/public/sitemap.xml`
- Modify: `vercel.json`
- Test: `frontend/scripts/verify-seo-pages.mjs`

**Interfaces:**
- Consumes: the existing English markup in `frontend/en/index.html` and Chinese markup in `frontend/index.html` before this task starts.
- Produces: `dist/index.html` as English, `dist/zh/index.html` as Chinese, permanent legacy English redirects, and matching sitemap/canonical metadata.

- [ ] **Step 1: Move existing documents to their canonical inputs without rewriting their content**

Before editing, preserve both current documents. Make `frontend/index.html` contain the current English document from `frontend/en/index.html`, and create `frontend/zh/index.html` from the current Chinese `frontend/index.html`. Then remove `frontend/en/index.html`.

In the new root English document, replace all homepage identity URLs:

```html
<link rel="canonical" href="https://www.gotoolmatrix.com/" />
<link rel="alternate" hreflang="zh-CN" href="https://www.gotoolmatrix.com/zh/" />
<link rel="alternate" hreflang="en" href="https://www.gotoolmatrix.com/" />
<link rel="alternate" hreflang="x-default" href="https://www.gotoolmatrix.com/" />
<meta property="og:url" content="https://www.gotoolmatrix.com/" />
```

Also change the English JSON-LD `@id` and `url` values from `/en/` to `/`, the English nav homepage link to `/`, and its footer Chinese link to `/zh/`. Do not change English tool links that use `?lang=en`.

In `frontend/zh/index.html`, replace homepage identity URLs:

```html
<link rel="canonical" href="https://www.gotoolmatrix.com/zh/" />
<link rel="alternate" hreflang="zh-CN" href="https://www.gotoolmatrix.com/zh/" />
<link rel="alternate" hreflang="en" href="https://www.gotoolmatrix.com/" />
<link rel="alternate" hreflang="x-default" href="https://www.gotoolmatrix.com/" />
<meta property="og:url" content="https://www.gotoolmatrix.com/zh/" />
```

Change the Chinese collection-page JSON-LD `@id` and `url` to `/zh/#directory` and `/zh/`, and its nav homepage link to `/zh/`. Keep site-wide organization and website identifiers rooted at `https://www.gotoolmatrix.com/#...`.

- [ ] **Step 2: Change Vite's second HTML build input from English to Chinese**

In `frontend/vite.config.ts`, set the build inputs to:

```ts
input: {
  main: path.resolve(rootDirectory, 'index.html'),
  chinese: path.resolve(rootDirectory, 'zh/index.html'),
},
```

- [ ] **Step 3: Update Vercel canonical routes and legacy redirects**

Replace the existing `/en` and `/en/` file routes in `vercel.json` with these four entries before the generic static-file route:

```json
{
  "src": "/zh",
  "dest": "/frontend/zh/index.html"
},
{
  "src": "/zh/",
  "dest": "/frontend/zh/index.html"
},
{
  "src": "/en",
  "status": 308,
  "headers": { "Location": "/" }
},
{
  "src": "/en/",
  "status": 308,
  "headers": { "Location": "/" }
}
```

Preserve route ordering and every unrelated proxy/header change already in `vercel.json`.

- [ ] **Step 4: Replace the indexed English subpath with the Chinese canonical URL**

In `frontend/public/sitemap.xml`, keep the root entry and replace the `/en/` entry with:

```xml
<url>
  <loc>https://www.gotoolmatrix.com/zh/</loc>
  <lastmod>2026-08-08</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>
```

Update the root entry's `<lastmod>` to `2026-08-08`. Do not change unrelated sitemap entries.

- [ ] **Step 5: Build and verify the static/deployment contract turns green**

Run:

```bash
cd frontend
pnpm build
```

Expected: TypeScript and Vite succeed; `dist/index.html` and `dist/zh/index.html` exist; the SEO verifier prints PASS for both homepage paths, sitemap assertions, and Vercel routes; exit status is 0.

- [ ] **Step 6: Review and commit only static entry and routing changes**

```bash
git diff -- frontend/index.html frontend/zh/index.html frontend/en/index.html frontend/vite.config.ts frontend/public/sitemap.xml vercel.json
git add frontend/index.html frontend/zh/index.html frontend/en/index.html frontend/vite.config.ts frontend/public/sitemap.xml vercel.json
git commit -m "feat: make English the canonical homepage"
```

---

### Task 3: Make React runtime language follow the canonical homepage path

**Files:**
- Modify: `frontend/src/i18n/index.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/LanguageSwitcher.tsx`
- Test: `frontend/scripts/verify-seo-pages.mjs`

**Interfaces:**
- Consumes: `window.location.pathname`, i18next's `toolMatrixLanguage` local-storage detector, React Router, and the canonical `/` plus `/zh/` routes created in Task 2.
- Produces: deterministic `en` for `/`, deterministic `zh` for `/zh` variants, and canonical navigation from the homepage switcher.

- [ ] **Step 1: Reverse and narrow canonical homepage language selection**

In `frontend/src/i18n/index.ts`, replace `canonicalLanguage` with:

```ts
const canonicalLanguage = window.location.pathname === '/'
  ? 'en'
  : window.location.pathname === '/zh' || window.location.pathname.startsWith('/zh/')
    ? 'zh'
    : undefined
```

Set `fallbackLng: 'en'`. Keep the existing local-storage detector for non-homepage paths and update its comment to:

```ts
// Canonical homepage paths override stored preferences. Other routes remember
// only an explicit language switch; browser/system language is not consulted.
```

- [ ] **Step 2: Serve the market page on the Chinese canonical route**

In `frontend/src/App.tsx`, keep the root market route and replace the `/en/` route with:

```tsx
<Route path="/zh/" element={<MarketPage />} />
```

- [ ] **Step 3: Navigate the homepage switcher between canonical language URLs**

In `frontend/src/components/LanguageSwitcher.tsx`, replace the homepage branch with:

```ts
const isCanonicalHomepage = window.location.pathname === '/'
  || window.location.pathname === '/zh'
  || window.location.pathname === '/zh/'

if (isCanonicalHomepage) {
  window.location.assign(newLang === 'en' ? '/' : '/zh/')
  return
}
```

Keep `i18n.changeLanguage(newLang)` and `setLang(newLang)` unchanged for non-homepage routes.

- [ ] **Step 4: Run TypeScript, production build, and SEO verification**

Run:

```bash
cd frontend
pnpm build
pnpm verify:seo
```

Expected: both commands exit 0. The second verifier run is intentional: it confirms the generated files remain valid independently after the build-integrated verification.

- [ ] **Step 5: Perform focused runtime checks in a local preview**

Run:

```bash
cd frontend
pnpm preview --host 127.0.0.1
```

In a browser, set local storage key `toolMatrixLanguage` to `zh`, then load `/`; confirm English text and `<html lang="en">`. Set the key to `en`, then load `/zh/`; confirm Chinese text and `<html lang="zh-CN">`. Click the language switcher on both pages and confirm navigation `/` → `/zh/` → `/`.

Stop the preview server after verification. Record browser-visible results; do not claim these checks passed unless they were actually observed.

- [ ] **Step 6: Review and commit only runtime language changes**

```bash
git diff -- frontend/src/i18n/index.ts frontend/src/App.tsx frontend/src/components/LanguageSwitcher.tsx
git add frontend/src/i18n/index.ts frontend/src/App.tsx frontend/src/components/LanguageSwitcher.tsx
git commit -m "fix: enforce canonical homepage languages"
```

---

### Task 4: Final regression and scope audit

**Files:**
- Verify: all files listed in Tasks 1-3
- Verify: repository worktree state

**Interfaces:**
- Consumes: all commits and artifacts from Tasks 1-3.
- Produces: evidence that the complete language-routing flow passes without absorbing unrelated user changes.

- [ ] **Step 1: Run final build verification from a clean generated-output state**

Vite empties `frontend/dist` at the start of a normal production build. Run:

```bash
cd frontend
pnpm build
```

Expected: exit 0 with PASS output for `/`, `/zh/`, sitemap URLs, legacy redirects, and all pre-existing SEO checks.

- [ ] **Step 2: Inspect final commits and remaining user changes**

```bash
git log --oneline -4
git status --short
git diff --check
```

Expected: the feature commits contain only their declared files; unrelated pre-existing modifications remain uncommitted and intact; `git diff --check` reports no whitespace errors.

- [ ] **Step 3: Report verified and unverified outcomes separately**

The handoff must include:

```text
Verified: production build result; SEO verifier result; observed local / and /zh/ languages; observed switcher navigation.
Preserved: unrelated pre-existing worktree modifications not included in feature commits.
Not verified: live Vercel behavior unless a deployment was explicitly performed and checked.
```
