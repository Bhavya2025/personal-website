# bhavyakumar.ca

Bhavya Kumar's personal website: Taskly, Wyag, engineering experience, education, résumé, and contact details.

## Development

React 19, TypeScript, React Router, and Vite. Inter and JetBrains Mono are self-hosted. Layout and scrolling use native CSS/browser behavior. The current site features Taskly and Wyag, uses a 12-column editorial layout at desktop/tablet widths, and does not load a personal photograph. Project Ghost is excluded.

```bash
npm ci
npm run dev -- --port 5181
npm run build
npm run lint
npm run preview -- --port 5182
```

## Content and routes

- `src/portfolio/Portfolio.tsx`: compact shared header/footer, homepage, Taskly case study, contact, and not-found handling.
- `src/portfolio/data.ts`: Taskly notes, hero copy, editable secondary-project array, and technical stack.
- `src/portfolio/portfolio.css`: responsive layout and visual system.
- `src/lib/missions.ts`: project records, images, source/demo links, and featured selection.
- `src/lib/resume.ts`: resume-backed experience, education, and skills.
The updated editorial brief explicitly restores `public/resume.pdf` and résumé links. The saved PDF is copied from the original supplied document. Geographic labels and the portrait remain absent from the page.

Routes: `/`, `/projects`, `/projects/:slug`, `/contact`. `/projects` redirects to the homepage Projects section. Legacy Taskly focus links open its case study; Wyag focus and old detail links reach the Wyag card. Unknown paths and slugs show a recovery page. `public/_redirects` supplies the existing Cloudflare SPA fallback.

Older interface source remains for reference and is not imported by the current app. Do not reintroduce its background previews, transition effects, or terminal into the current portfolio by accident.

## Research and QA

The [current editorial-grid contract](docs/qa/editorial-grid-2026-10-17/contract.md) follows the user’s new pasted brief and subsequent instruction to exclude Project Ghost. It supersedes the earlier Taskly-only scope and résumé-removal decision. Current screenshots and checks are recorded in `docs/qa/editorial-grid-2026-10-17/evidence.json`. The stronger experience wording and 2027 availability were supplied by the user; this website change does not independently verify delivery claims or implement changes to the project repositories.

The [17 October review and competitive research](docs/reviews/2026-10-17/research.md) documents the preceding layout direction. Three independent AI reviewers inspected a frozen site without candidate background or other reviews; their original reports are saved alongside the synthesis. This is a simulated review, not a human hiring study. The [preceding design contract](docs/reviews/2026-10-17/design-contract.md) and `docs/qa/portfolio-review-2026-10-17/` record the current checks.

[Research synthesis](docs/design-research-2026-10-16.md) records the actual references and resulting design decisions. [Design contract](docs/design-contract.md) defines the viewports, interactions, and content states. Detailed source inspection and visual-reference notes are in `docs/research/`.

Rendered QA evidence, contrast calculations, and the verification record are under `docs/qa/portfolio-overhaul-2026-10-16/`. Local testing covers desktop, tablet, mobile, keyboard operation, routes and image failure recovery. Earlier QA records describe the prior multi-project revision; current Taskly-only checks are recorded separately. It does not establish field Core Web Vitals or complete WCAG conformance.

## Preserved versions

| Version | Git branch | Annotated tag |
| --- | --- | --- |
| Review-led single-column layout (`d7c5d8b`) | `backup/pre-editorial-grid-2026-10-17` | — |
| Taskly-only layout before review (`843a683`) | `backup/pre-review-2026-10-17` | — |
| Original space-themed site (`394254c`) | `backup/pre-redesign-2026-10-01` | `v2-pre-redesign-2026-10-01` |
| October 1 redesign (`d2bb449`) | `backup/pre-overhaul-2026-10-16` | `v3-pre-overhaul-2026-10-16` |

Local source archives and the earlier Git bundle are in `.website-backups/` (gitignored).

Inspect a preserved version in another checkout:

```bash
git worktree add ../personal-website-october-1 v3-pre-overhaul-2026-10-16
```

The current overhaul continues on `codex/professional-portfolio`, with a draft pull request. Cloudflare Pages watches `main`; merging into `main` publishes the change. Review before merging.
