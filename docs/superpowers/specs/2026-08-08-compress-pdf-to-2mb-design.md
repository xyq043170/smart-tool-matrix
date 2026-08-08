# Compress PDF to 2MB Landing Page Design

**Date:** 2026-08-08

## Goal

Publish one useful English landing page for the high-intent query `compress pdf to 2mb`. The page must let visitors start using the existing browser-based compressor above the fold while honestly explaining that an exact 2 MB result cannot be guaranteed.

## URL and search contract

- Canonical URL: `https://www.gotoolmatrix.com/compress-pdf-to-2mb`
- Primary query: `compress pdf to 2mb`
- The URL returns a crawlable static HTML document with an English title, description, H1, visible body copy, self-canonical, Open Graph URL, HowTo JSON-LD, and FAQPage JSON-LD.
- Add the canonical URL to the main sitemap and expose crawlable internal links from the English homepage and the existing PDF compression guide.
- Do not create keyword-substitution variants or add the page to legacy Chinese noindex routes.

## Tool experience

- The first viewport contains the page H1, a concise expectation statement, and an embedded same-origin iframe for `/pdf/compress-pdf.html?embedded=1&lang=en`.
- Provide a normal link to open the compressor in a full page if iframe loading is unavailable or the visitor prefers a larger workspace.
- The landing page does not modify the BentoPDF compression engine and does not claim that it can select an exact output size.
- Recommend this progression: start with Balanced; if the result remains above 2 MB, compare Aggressive and then Extreme; use Photon only for photo-heavy or scanned PDFs because it converts pages to images.
- State that smaller output can reduce visual quality and that complex PDFs may remain above 2 MB even at the strongest setting.

## Required content

The visible English body includes:

1. Supported input: PDF files; practical limits depend on browser memory, device performance, encryption, fonts, images, and the current tool implementation.
2. A three-step workflow: upload, select an appropriate algorithm/level, then download and verify the byte size plus document quality.
3. A `Why is my PDF still above 2 MB?` section covering scanned pages, high-resolution images, embedded fonts, existing compression, and encrypted or structurally complex files.
4. Privacy language: processing is designed to run in the browser, but this is an architecture statement rather than an independent security audit; visitors should keep originals and inspect network behavior before using confidential files.
5. Honest availability language: the compressor can be opened without creating an account; do not invent upload-size, file-count, or guaranteed savings limits that are not enforced by the current deployment.
6. FAQ answers for exact-size guarantees, the best first setting, scanned PDFs, text selectability under Photon, and what to do when the result is still too large.
7. Internal links to `/pdf/`, `/guides/compress-pdf.html`, `/privacy`, and `/subscription` without implying payment guarantees a 2 MB result.

## Implementation boundaries

- Create one standalone static page under `frontend/public/` and one explicit Vercel route for the extensionless canonical URL.
- Reuse the existing static-guide visual language instead of adding a new React route or component hierarchy.
- Do not change the PDF compression algorithm, quota system, payment flow, or authentication behavior.
- Analytics and conversion tracking are a separate subsystem and are not included in this page delivery.
- Preserve all unrelated repository and worktree changes.

## Verification

- Extend `frontend/scripts/verify-seo-pages.mjs` before creating the page so the new route initially fails.
- Verify the built page exists and has a unique raw HTML hash, title, H1, exact canonical, English document language, parseable JSON-LD, iframe source, fallback tool link, and required internal links.
- Verify `vercel.json` maps `/compress-pdf-to-2mb` to `/frontend/compress-pdf-to-2mb.html`.
- Verify the sitemap contains the canonical URL exactly once.
- Run the full frontend production build and existing pricing/SEO verification.
- Use a local browser preview to confirm the page renders, the iframe loads the compressor, the fallback link resolves, and the layout remains usable on a narrow viewport.

## Success criteria

1. The canonical URL provides indexable English content that directly addresses the 2 MB use case.
2. The compressor is visible and usable above the fold without claiming deterministic target-size compression.
3. Search metadata, structured data, sitemap, internal links, and deployment routing agree on one canonical URL.
4. Existing homepage, language, image canonical, guide, pricing, and proxy-route checks remain green.
