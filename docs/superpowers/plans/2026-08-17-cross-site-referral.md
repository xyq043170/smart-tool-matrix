# GoToolMatrix Cross-Site Referral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI Tool Pixel recommendation card to the GoToolMatrix homepage and an AI Tool Pixel link to the global footer.

**Architecture:** Keep the feature inside the existing `MarketPage` and `MainLayout` surfaces. Store all visible copy in the existing English and Chinese `common` dictionaries, and render the real React surfaces in Vitest's Node environment so the reciprocal URL and external-link safety attributes are tested as user-visible HTML.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, react-i18next, Tailwind CSS

## Global Constraints

- Canonical destination is exactly `https://aitoolpixel.com/` with no UTM parameters.
- Both placements use `target="_blank"` and `rel="noopener noreferrer"`.
- Do not add the link to the header navigation.
- Preserve all unrelated existing worktree changes; stage only files named in this plan.
- Do not deploy or push.

---

### Task 1: Add the reciprocal-link contract and UI

**Files:**
- Create: `frontend/src/cross-site-links.test.tsx`
- Modify: `frontend/package.json`
- Modify: `frontend/pnpm-lock.yaml`
- Modify: `frontend/src/pages/Market.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/i18n/locales/zh/common.json`

**Interfaces:**
- Consumes: `useTranslation('common')`, existing Tailwind design tokens, and the existing `ExternalLink` icon in `Market.tsx`.
- Produces: four `market.crossSite*` translation keys, two safe external anchors pointing to `https://aitoolpixel.com/`, and an SSR component test that exercises both placements.

- [ ] **Step 1: Install and configure the existing-stack test runner**

Run `cd frontend && pnpm add -D vitest@^3.0.7` and add `"test": "vitest run"` to package scripts. This changes only `package.json` and `pnpm-lock.yaml` before the test is written.

- [ ] **Step 2: Write the failing component test**

Create `frontend/src/cross-site-links.test.tsx`. Import the real `MarketPage` and `MainLayout`, render each with `renderToStaticMarkup` inside `MemoryRouter`, and parse each rendered anchor with a small literal regular expression. Assert exactly one `https://aitoolpixel.com/` anchor per surface and assert its rendered `target` is `_blank` and `rel` is `noopener noreferrer`. Import the existing i18n initialization so real English labels render.

- [ ] **Step 3: Run the focused test and confirm RED**

Run: `cd frontend && pnpm test -- src/cross-site-links.test.tsx`

Expected: two assertion failures because neither rendered homepage nor rendered footer contains `https://aitoolpixel.com/`.

- [ ] **Step 4: Add localized copy**

Add these keys below `market` in both dictionaries:

```json
// English values
"crossSiteLabel": "More focused photo tools",
"crossSiteTitle": "Need an ID photo or clean background?",
"crossSiteDescription": "Visit AI Tool Pixel for AI-assisted ID photos and fast background removal.",
"crossSiteCta": "Open AI Tool Pixel"
```

```json
// Chinese values
"crossSiteLabel": "更多专注型图片工具",
"crossSiteTitle": "需要制作证件照或移除背景？",
"crossSiteDescription": "前往 AI Tool Pixel，使用智能证件照制作和快速背景移除工具。",
"crossSiteCta": "打开 AI Tool Pixel"
```

- [ ] **Step 5: Add the homepage card and footer link**

In `Market.tsx`, append a `shell` section after the trust section with a bordered card, localized label/title/description, and this anchor contract:

```tsx
<a
  href="https://aitoolpixel.com/"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
>
  {tc('market.crossSiteCta')}
  <ExternalLink className="h-4 w-4" aria-hidden="true" />
</a>
```

In `MainLayout.tsx`, add the same safe external anchor in the footer's “More” column using `t('market.crossSiteCta')`.

- [ ] **Step 6: Run the focused test and confirm GREEN**

Run: `cd frontend && pnpm test -- src/cross-site-links.test.tsx`

Expected: PASS for the rendered homepage and footer external-link contracts.

- [ ] **Step 7: Run full frontend verification**

Run: `cd frontend && pnpm test && pnpm build`

Expected: all Vitest tests, TypeScript, Vite build, and the existing SEO verifier pass.

- [ ] **Step 8: Review and commit only scoped implementation files**

Run `git diff --check` on the seven implementation files, inspect the exact diff, stage only those files, and commit:

```bash
git commit -m "feat: link GoToolMatrix to AI Tool Pixel"
```
