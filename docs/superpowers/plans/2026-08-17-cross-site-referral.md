# GoToolMatrix Cross-Site Referral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI Tool Pixel recommendation card to the GoToolMatrix homepage and an AI Tool Pixel link to the global footer.

**Architecture:** Keep the feature inside the existing `MarketPage` and `MainLayout` surfaces. Store all visible copy in the existing English and Chinese `common` dictionaries, and add a dependency-free build-time verifier that protects the reciprocal URL and external-link safety attributes.

**Tech Stack:** React 18, TypeScript, Vite, react-i18next, Tailwind CSS, Node.js verification scripts

## Global Constraints

- Canonical destination is exactly `https://aitoolpixel.com/` with no UTM parameters.
- Both placements use `target="_blank"` and `rel="noopener noreferrer"`.
- Do not add the link to the header navigation.
- Preserve all unrelated existing worktree changes; stage only files named in this plan.
- Do not deploy or push.

---

### Task 1: Add the reciprocal-link contract and UI

**Files:**
- Create: `frontend/scripts/verify-cross-site-links.mjs`
- Modify: `frontend/package.json`
- Modify: `frontend/src/pages/Market.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/i18n/locales/zh/common.json`

**Interfaces:**
- Consumes: `useTranslation('common')`, existing Tailwind design tokens, and the existing `ExternalLink` icon in `Market.tsx`.
- Produces: four `market.crossSite*` translation keys and two safe external anchors pointing to `https://aitoolpixel.com/`.

- [ ] **Step 1: Write the failing build-time verifier**

Create `frontend/scripts/verify-cross-site-links.mjs` to read `Market.tsx`, `MainLayout.tsx`, and both locale JSON files. Assert that both TSX sources contain `https://aitoolpixel.com/`, `target="_blank"`, and `rel="noopener noreferrer"`; assert that both dictionaries define non-empty `market.crossSiteLabel`, `market.crossSiteTitle`, `market.crossSiteDescription`, and `market.crossSiteCta`. Exit with status 1 and a specific `FAIL` line for every missing contract.

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `cd frontend && node scripts/verify-cross-site-links.mjs`

Expected: FAIL because neither homepage nor footer currently contains `https://aitoolpixel.com/`, and the four locale keys are absent.

- [ ] **Step 3: Add localized copy**

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

- [ ] **Step 4: Add the homepage card and footer link**

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

- [ ] **Step 5: Wire the verifier into package scripts and confirm GREEN**

Add `"verify:cross-site": "node scripts/verify-cross-site-links.mjs"` and append `&& pnpm verify:cross-site` to `build` after the SEO verifier.

Run: `cd frontend && pnpm verify:cross-site`

Expected: PASS for homepage, footer, and both locale dictionaries.

- [ ] **Step 6: Run full frontend verification**

Run: `cd frontend && pnpm build`

Expected: TypeScript, Vite build, SEO verifier, and cross-site verifier all pass.

- [ ] **Step 7: Review and commit only scoped implementation files**

Run `git diff --check` on the six implementation files, inspect the exact diff, stage only those files, and commit:

```bash
git commit -m "feat: link GoToolMatrix to AI Tool Pixel"
```

