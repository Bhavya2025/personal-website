# bhavyakumar.ca

Bhavya Kumar's personal website: Taskly, engineering experience, education, and contact details.

## Development

React 19, TypeScript, React Router, and Vite. IBM Plex Sans and Mono are self-hosted. Layout and scrolling use native CSS/browser behavior. The current site displays Taskly as its only project and does not load a personal photograph.

```bash
npm ci
npm run dev -- --port 5181
npm run build
npm run lint
npm run preview -- --port 5182
```

## Content and routes

- `src/portfolio/Portfolio.tsx`: shared identity rail, homepage, project index, individual project pages, contact, and not-found handling.
- `src/portfolio/data.ts`: Taskly’s slug, scope, descriptions, and implementation notes.
- `src/portfolio/portfolio.css`: responsive layout and visual system.
- `src/lib/missions.ts`: project records, images, source/demo links, and featured selection.
- `src/lib/resume.ts`: resume-backed experience, education, and skills.
- `public/resume.pdf`: public resume supplied October 1, 2026.

Routes: `/`, `/projects`, `/projects/:slug`, `/contact`. Existing `/projects?focus=BK-...` links still scroll to the corresponding project. Unknown paths and slugs show a recovery page. `public/_redirects` supplies the existing Cloudflare SPA fallback.

Older interface source remains for reference and is not imported by the current app. Do not reintroduce its background previews, transition effects, or terminal into the current portfolio by accident.

## Research and QA

[Research synthesis](docs/design-research-2026-10-16.md) records the actual references and resulting design decisions. [Design contract](docs/design-contract.md) defines the viewports, interactions, and content states. Detailed source inspection and visual-reference notes are in `docs/research/`.

Rendered QA evidence, contrast calculations, and the verification record are under `docs/qa/portfolio-overhaul-2026-10-16/`. Local testing covers desktop, tablet, mobile, keyboard operation, routes and image failure recovery. Earlier QA records describe the prior multi-project revision; current Taskly-only checks are recorded separately. It does not establish field Core Web Vitals or complete WCAG conformance.

## Preserved versions

| Version | Git branch | Annotated tag |
| --- | --- | --- |
| Original space-themed site (`394254c`) | `backup/pre-redesign-2026-10-01` | `v2-pre-redesign-2026-10-01` |
| October 1 redesign (`d2bb449`) | `backup/pre-overhaul-2026-10-16` | `v3-pre-overhaul-2026-10-16` |

Local source archives and the earlier Git bundle are in `.website-backups/` (gitignored).

Inspect a preserved version in another checkout:

```bash
git worktree add ../personal-website-october-1 v3-pre-overhaul-2026-10-16
```

The current overhaul continues on `codex/professional-portfolio`, with a draft pull request. Cloudflare Pages watches `main`; merging into `main` publishes the change. Review before merging.
