# bhavyakumar.ca

Bhavya Kumar's professional portfolio: selected software projects, engineering experience, education, and contact details.

## Development

React 19, TypeScript, React Router, and Vite. IBM Plex fonts are self-hosted. The portfolio uses native scrolling, CSS layouts, and inline SVG project diagrams. The Boids demonstration loads separately on the Projects page.

```bash
npm ci
npm run dev
npm run build
npm run lint
npm run preview
```

## Content

- `src/portfolio/Portfolio.tsx`: current pages and shared presentation components.
- `src/portfolio/portfolio.css`: responsive portfolio styles.
- `src/lib/missions.ts`: projects, featured selection, and professional links.
- `src/lib/resume.ts`: experience, education, and skills.
- `public/resume.pdf`: current public resume, supplied October 1, 2026.

The earlier interface's source remains in the repository for reference but is not imported by the current app. Build verification includes TypeScript, ESLint, and desktop/mobile browser review.

## Preserved version

Before the October 2026 redesign, the clean `main` revision `394254c` was saved to GitHub as:

- Branch: `backup/pre-redesign-2026-10-01`
- Annotated tag: `v2-pre-redesign-2026-10-01`

Local copies are in `.website-backups/` (gitignored): a source archive and a Git bundle. The bundle includes repository history.

Inspect the original version without replacing the redesign:

```bash
git worktree add ../personal-website-original v2-pre-redesign-2026-10-01
```

The redesign lives on `codex/professional-portfolio`. Cloudflare Pages watches `main`, so merging into `main` publishes the new site. Review the redesign before merging.
