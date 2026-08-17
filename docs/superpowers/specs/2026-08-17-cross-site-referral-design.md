# GoToolMatrix and AI Tool Pixel Cross-Site Referral Design

## Goal

Create a reciprocal, low-distraction path between GoToolMatrix and AI Tool Pixel so users can discover complementary tools without weakening either site's primary workflow.

## Approved approach

Use two placements on each site:

1. A lightweight recommendation card on the homepage after the primary product content.
2. A persistent external link in the site-wide footer.

Do not add the reciprocal site to the primary header navigation. Both links open a new tab and use `rel="noopener noreferrer"`. Use the canonical destinations without campaign parameters:

- GoToolMatrix to `https://aitoolpixel.com/`
- AI Tool Pixel to `https://www.gotoolmatrix.com/`

## GoToolMatrix changes

- Add an AI Tool Pixel recommendation section near the end of `frontend/src/pages/Market.tsx`, before the footer and after GoToolMatrix's core tool and trust content.
- Describe AI Tool Pixel as the focused destination for AI-assisted ID photos and background removal.
- Add an AI Tool Pixel link to the footer's secondary-links group in `frontend/src/layouts/MainLayout.tsx`.
- Add English and Chinese strings to the existing `common.json` dictionaries.
- Match the existing card, spacing, typography, and link treatments. The card is informational and must not resemble a subscription or payment call to action.

## AI Tool Pixel changes

- Add a small client-side recommendation component to the homepage after the workbench and crawlable home content.
- Describe GoToolMatrix as the destination for PDF, image, developer, and website-inspection tools.
- Add a GoToolMatrix link to a new footer group for related tools in `apps/web/components/site-shell.tsx`.
- Add English and Chinese strings to the typed dictionary in `apps/web/lib/i18n.tsx`.
- Match AI Tool Pixel's existing content-section and footer styles; preserve the workbench as the dominant homepage action.

## Accessibility and behavior

- Use a descriptive heading and link name that includes the destination brand.
- External-link icons, if present, are decorative.
- Links remain keyboard accessible and show the site's existing focus treatment.
- Opening a new tab is consistent across homepage and footer placements.

## Verification

- Add a build-time or component-level assertion before implementation for each site that fails while the reciprocal link is absent.
- Verify canonical URL, `target="_blank"`, and `rel="noopener noreferrer"` in homepage and footer placements.
- Verify English and Chinese labels where the existing test setup supports locale switching.
- Run the focused tests/checks, then each site's full frontend build and existing SEO verification.
- Inspect the final diff carefully because the GoToolMatrix worktree already contains unrelated user changes.

## Scope boundaries

- No header navigation changes.
- No UTM parameters, analytics events, popups, banners, or automatic redirects.
- No deployment, push, or edits to unrelated existing worktree changes.
