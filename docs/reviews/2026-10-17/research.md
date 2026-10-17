# Portfolio review and competitive research

17 October 2026. Scope: improve this one-project portfolio for software engineering co-op/internship screening. The user asked for a serious, simple site, removal of the résumé and location, and candid independent reviews. Taskly remains the only project; there is no portrait.

## The blunt assessment

The earlier version was a credible introduction, but it spent too much space repeating an introduction to Taskly and too little space demonstrating the engineering behind it. It made readers click to see internship contributions, then click through a redundant project overview to reach a few technical paragraphs. Tiny metadata, inconsistent navigation numbers and a viewport-height sidebar made an otherwise restrained design feel fragmented. Those are presentation problems we can fix here.

The remaining project problem is substantive: a source repository, features and a screenshot do not establish reliability, adoption or measured performance. A better website can make the existing engineering easier to inspect; it cannot manufacture tests, users, shipped internship outcomes or hiring results.

## Questions and method

1. What do established personal portfolios put first, and how do they lead to evidence?
2. Which visual patterns fit an early-career software applicant with one project?
3. What confuses a first-time visitor, a recruiter and a technical interviewer independently?
4. Which findings can be fixed in the website, and which require new facts or project work?

Revisited five personal sites and one primary UX reference with web browsing. Brittany Chiang and Lee Robinson were also visually inspected in a browser. This is a purposive comparison of established reference sites, not a measured ranking of “the best” portfolios or a claim about their hiring conversion. Cassie Evans is recorded as an exclusion because the live site has changed. The preceding [October 16 research](../../design-research-2026-10-16.md) provides broader historical context; this report focuses on the current one-project scope.

Three fresh AI agents received only the frozen localhost site URL and their respective visitor/recruiter/interviewer perspective. They were told not to read prior chat, repository files, PDFs, external profiles, other reviews or candidate background. They reviewed independently before seeing this synthesis. The frozen copy omitted the PDF, and reviewers were instructed not to open résumé links. Setup connection failures were resolved before the substantive reviews; they are excluded from ratings.

These are simulated AI perspectives, not real recruiters or a representative usability sample. Fresh context reduces anchoring; it does not remove model bias. Subjective ratings describe the baseline's clarity/evidence, not the person's ability. There is no statistically meaningful average and no measured before/after hiring result.

## Competitive observations → decisions

| Primary reference | Observed on the current site | Applied judgment for this site |
| --- | --- | --- |
| [Brittany Chiang](https://brittanychiang.com/) | Explicit role near identity; dated experience grouped with specific contributions; project descriptions paired with actual interface images and destinations. Some role/project entries have independently inspectable related links. | Keep role obvious, surface internship details directly, and pair Taskly's claims with source links. Its larger persistent rail is not necessary for our shorter content. |
| [Lee Robinson](https://leerob.com/) | A direct engineer/writer introduction, a selectable longer biography, and simple lists linking to notes and essays. The substantial content is reachable without a project-card intermediary. | Use a compact introduction and direct route to the Taskly case study. Do not create extra navigation solely to make one project feel like a collection. |
| [Josh W. Comeau](https://www.joshwcomeau.com/) | The home page leads with descriptive articles/tutorials and explicit “read more” destinations; the content itself explains specific technical subjects. | Use headings that say what an implementation does. Translate a Taskly command into an understandable worked flow, then link to the code. No invented tutorial library or ornamental controls. |
| [Bruno Simon](https://bruno-simon.com/) | A portfolio experienced by driving through a 3D world, with keyboard/mobile controls, quality options, and a behind-the-scenes account of its implementation. | This is a useful case of the medium demonstrating the author's creative-development specialty. Copying the game would add friction to a Python/backend hiring profile. Preserve the principle of showing relevant work, not the visual treatment. |
| [Cassie Evans](https://cassie.codes/) | The current page is a short farewell with contact/community destinations rather than the older animation-rich portfolio referenced in many collections. | Exclude it as a current full-portfolio layout reference. This is why old screenshot roundups should not be treated as current evidence. |
| [NN/g: Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) | Explains hierarchy through scale, contrast and grouping/proximity. Published 17 January 2021. | Unify alignment, enlarge supporting text, and keep footer links together. This supports the design reasoning; it does not prove recruitment outcomes. |

Confidence is high in these page observations, medium in applying them to this particular hiring task. We did not independently verify the references' employment claims, usage figures, site accessibility or performance.

## Independent reviews

Original reports: [first-time visitor](visitor.md), [recruiter](recruiter.md), [technical interviewer](engineer.md).

| Finding | Visitor | Recruiter | Engineer | Website fix |
| --- | --- | --- | --- | --- |
| Repeated homepage → overview → Taskly journey | Yes | Yes | Yes | One Taskly case study; `/projects` redirects directly; one primary homepage case-study link. |
| Small/faint supporting text | Yes | Yes | Yes | Supporting text at least 13px; main text 16–18px; shared reading column and clearer link treatment. |
| Technical claims need examples, verification and results | Yes | Yes | Yes | Plain-language purpose, illustrative command flow, commit-pinned code evidence, and explicit boundaries. No invented outcomes. |
| Best internship contributions hidden | — | Yes | Yes (disclosure itself worked) | Experience placed before the large project image; contributions always visible. |
| Inconsistent numbering/labels and two active links | Yes | — | Yes | Remove navigation numbering; consistent labels and one active destination. |
| Broad skills list exceeds visible evidence | — | Yes | Yes | Remove the broad skills inventory; show the technologies actually connected to Taskly and ToadEx. |
| Missing next term/duration | — | Yes | — | User confirmed year-round availability and willingness to adjust study timing. Added that wording; no fixed term or duration fabricated. Geographic preferences were intentionally omitted to honor the explicit no-location request. |

Baseline ratings: visitor clarity 4/5; recruiter usefulness 4/5; technical evidence 3/5. Their shared criticism concerns proof and the path to it, not merely visual novelty. The screenshot supplied by the user adds direct evidence of the detached footer/sidebar problem, which was not a dominant reviewer finding.

## Taskly source audit

Read-only inspection of [commit 8138a662469b9e569f23bae83364c8ad679411a6](https://github.com/Bhavya2025/taskly/tree/8138a662469b9e569f23bae83364c8ad679411a6), using the GitHub API. Code was not executed and the deployed model service was not tested.

- [`src/App.jsx`, lines 466–568](https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/src/App.jsx#L466-L568): board local storage, 500 ms cloud-save timeout, `commitBoardChange`, and undo/redo snapshots. The code's stale “1 second” comment differs from its actual 500 ms timeout; the website follows the executable value. Snapshots are capped at 80.
- [`src/components/AIAgent.jsx`, lines 92–128](https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/src/components/AIAgent.jsx#L92-L128): command dispatch, task/column resolution, missing-task feedback, move callback. App passes the shared move handler to the interface and assistant.
- [`src/utils/aiAgent.js`](https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/src/utils/aiAgent.js#L150-L185): overlap-based matching with a threshold of 25; task mismatch returns null, but column mismatch falls back to the first column. Do not describe this as guaranteed intent validation.
- [`server/geminiHelpers.js`, lines 223–234](https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/server/geminiHelpers.js#L223-L234): strips reasoning tags, attempts JSON extraction, parses the result. Despite its filename, the current helper calls Groq with a configurable model. The site therefore uses “Groq API” rather than implying a fixed model is always deployed.
- [`package.json`](https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/package.json) and the inspected tree expose development/build/preview scripts but no test suite or benchmark artifact. This is a statement about the inspected public repository, not any private validation.

The case study's command is deliberately illustrative: no live model response or passing test is implied. Removed the earlier scroll-performance paragraph because it lacked a reproducible observation or benchmark. Removed blanket “consistent state across tabs” from the visible summary; subscriptions alone do not establish correct conflict handling.

## What changed

- Compact header, centered content and grouped footer replace the full-height sidebar. The stranded bottom tagline is gone.
- Experience precedes Taskly; contributions no longer need expansion. Role and education remain clear.
- Taskly is the only project. Direct case-study navigation removes the redundant overview. Unknown old project slugs still show recovery.
- The case study adds a concrete task-command flow, source references and a realistic next iteration. The screenshot can be opened full size.
- Résumé links, metadata promotion and the public PDF are removed. Legacy unmounted download links no longer reference the deleted file. Résumé data remains the factual source for experience; the user's original document outside this repo is untouched.
- Geographic labels are removed from the current UI and shared content data. “University of Waterloo” remains the proper school name. No photo, location preference or new project was added.
- Broad skill/recognition lists are trimmed so the work carries the introduction.

## Still worth doing beyond this website

1. Add meaningful Taskly tests for command resolution/ambiguity, undo after AI actions, failed saves and cross-tab conflicts; document the exact expected behavior. A passing suite should then be linked, not merely claimed.
2. Fix the first-column fallback before treating ambiguous AI commands as safe by default. This was observed in source, not fixed in the separate Taskly repository during this website task.
3. Document one real bug: reproduction, diagnosis, rejected approach, change and verification. A reproducible qualitative result is more credible than an unsupported percentage.
4. Availability is now confirmed as year-round with a flexible study schedule. Add duration only if confirmed. Clarify which ToadEx designs were implemented or deployed only when the user can substantiate that stage.

Current checks and screenshots: [QA evidence](../../qa/portfolio-review-2026-10-17/evidence.json). This report distinguishes research observations, AI reviewers' judgments, source inspection and actual website verification; none is a substitute for the others.
