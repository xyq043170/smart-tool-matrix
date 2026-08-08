# English Root Homepage Design

**Date:** 2026-08-08

## Goal

Make the canonical root homepage (`/`) always render in English, regardless of browser language or a previously stored language preference. Preserve a stable Chinese homepage at `/zh/`.

## Routing and language behavior

- `/` is the canonical English homepage and always initializes i18next with `en`.
- `/zh` and `/zh/` serve the Chinese homepage and always initialize i18next with `zh`.
- The homepage language switcher navigates between `/` and `/zh/`.
- `/en` and `/en/` redirect to `/` so the English homepage has one canonical URL.
- Routes other than the homepage retain the existing explicit-language preference behavior.

## SEO metadata

- The root HTML document uses English title, description, visible crawlable content, `lang="en"`, canonical `/`, and English Open Graph locale.
- A Chinese static entry document is available for `/zh/`, with `lang="zh-CN"`, canonical `/zh/`, and Chinese metadata/content.
- Both documents expose matching `hreflang` links: English at `/`, Chinese at `/zh/`, and `x-default` at `/`.
- The sitemap contains both canonical homepage URLs and excludes `/en/`.

## Implementation boundaries

- Reuse the existing React market page and translation resources; do not duplicate application components.
- Update only language initialization, homepage routes/switching, static entry documents, deployment routes, sitemap data, and the existing dependency-free SEO verifier.
- Preserve all unrelated uncommitted work already present in the repository.

## Verification

- Add verifier assertions for canonical routes, document languages, canonical and hreflang URLs, sitemap entries, and redirects from `/en` variants.
- Follow red-green verification: first make the updated assertions fail against the current implementation, then update production files until they pass.
- Run the production frontend build and the SEO verification script.

## Success criteria

1. Opening or refreshing `/` displays English even when local storage contains Chinese.
2. Opening or refreshing `/zh/` displays Chinese even when local storage contains English.
3. The homepage language switcher moves between those canonical URLs.
4. `/en` and `/en/` resolve to `/` rather than creating duplicate English pages.
5. Built metadata and sitemap signals agree with the runtime behavior.
