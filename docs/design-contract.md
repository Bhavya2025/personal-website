# Portfolio overhaul: design contract

> Current work follows the [October 17 editorial-grid contract](qa/editorial-grid-2026-10-17/contract.md), including the user’s later résumé restoration, Wyag addition and Project Ghost exclusion.

> Superseded on 17 October 2026 by [the review-led contract](reviews/2026-10-17/design-contract.md). This file preserves the earlier design rationale; its résumé, layout and interactive-state requirements no longer define the current site.

> Scope update: the user subsequently requested removal of the portrait and every project except Taskly. The current site follows that request. The original research and multi-project QA below describe the preserved earlier revision (`bcd5228`). Current verification is in `docs/qa/taskly-only-2026-10-16/evidence.json`.

Date: 16 October 2026. Audience: engineering hiring teams and other developers. Job: understand Bhavya's current role, inspect a project, and reach his resume or contact details.

## Direction and evidence

A personal technical index, with a persistent identity rail on desktop and a single reading flow on mobile. This is editorial judgment informed by 14 primary personal-site references, plus typography, reading, accessibility, and performance guidance. Research and exact source links are in `research/`.

- Name, Waterloo degree, and ToadEx internship appear in the first viewport. Resume and contact require one click. Compact identity informed by Paco Coursey and Frank Chimero.
- Main reading column is at most 810px; main text is 16-18px, with moderate line length. IBM Plex Sans and Mono are already installed. Typography guidance from Butterick; real site inspections from Steph Ango and Emil Kowalski.
- Flat project entries carry exact scope, year, and source/demo links. No claim of production usage without evidence. Explicit tutorial credit for Wyag. Role/status schema informed by Nikita Prokopov; implementation candor from Julia Evans.
- An inspectable reference -> commit -> tree -> blob diagram explains Wyag. It is labeled as a conceptual example, rather than live Python execution. Git object relationships verified against Pro Git. Interaction technique informed by Josh Comeau.
- Cool off-white, graphite, blue links, and a restrained rust accent; strong alignment and thin rules. No decorative load animations. Visual decisions derive from the object being described.
- Preserve existing routes and project focus query links. Add individual project pages with factual implementation notes.
- Target viewports: 390x844, 768x1024, 1440x1000. Also check 320px and long labels. Native scroll, visible focus, keyboard-operable diagram, reduced-motion support, at least 24px separated targets, and no horizontal page overflow.

## Applicable states

- Loading: local images reserve dimensions; interactive figure has an immediately readable static default. No network content fetching is required for the portfolio.
- Empty: unmatched project search/filter shows an explicit result message and reset control.
- Error: unknown routes/project slugs show a real recovery page; failed project images fall back to a caption and direct source link.
- Partial: projects without public demos show available source/context, and no invented live button. Software Factory contribution statements come from the user's resume, with archive provenance recorded in research.
- Success: selecting a diagram object updates the associated explanation and pressed state; project navigation opens actual details.
- Permission: not applicable. No account, auth, payments, clipboard permissions, or external mutation in the portfolio UI.

## Verification

TypeScript production build, ESLint, and diff checks; rendered review at each target. Exercise project filtering, empty/reset, diagram keyboard input, route navigation/deep links, not-found recovery, image error fallback, and console errors. Save screenshots and a truthful JSON evidence record alongside this contract's QA report. A local checker validates evidence completeness; it cannot replace visual review or establish full WCAG conformance.
