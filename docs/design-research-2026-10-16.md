# Research and design decisions: Bhavya Kumar's portfolio

16 October 2026

## Goal

Make an early-career software portfolio that lets a visitor understand Bhavya's background, inspect implementation work, and find a resume or contact address. The previous iteration had a warm-white marketing-style hero, italic serif slogan, and three repeated project cards. This overhaul uses a technical work index and project notes, with the content supplying its character.

This is a design recommendation, not a claim that a particular appearance improves hiring outcomes. The research covered 14 practitioner-site pages and technical writeups, plus seven typography, accessibility, reading, performance, and Git references. Public repository inspection checked which projects have inspectable source and which links are real.

## Findings applied

| Observation and source | Decision in this site |
| --- | --- |
| [Paco Coursey](https://paco.me/) identifies his work and links to specific artifacts. His [2021 redesign rationale](https://paco.me/writing/redesign-2021) describes reducing maintenance and feature overhead. | State Waterloo and ToadEx directly. Put resume and email near the introduction. Use ordinary routes and links. |
| [Nikita Prokopov's project index](https://tonsky.me/projects/) distinguishes role, maturity, period, and stack. | Label a learning implementation, personal application, hardware exercise, and hackathon team prototype accurately. Keep source and demo links with each entry. |
| [Julia Evans's projects](https://jvns.ca/projects/) link tools and development accounts. Her [memory-usage writeup](https://jvns.ca/blog/2024/10/27/asn-ip-address-memory/) records alternatives, tradeoffs, and limits. | Project pages explain a concrete mechanism: binary staging format, coordinate transforms, mutation pipeline. No invented adoption or performance numbers. |
| [Maggie Appleton](https://maggieappleton.com/) distinguishes essays, notes, and developing understanding. | Represent the maturity of Bhavya's work honestly. Do not create an empty blog or pretend that coursework is a completed product. |
| [Josh Comeau's CSS/JavaScript comparison](https://www.joshwcomeau.com/animation/css-vs-javascript/) uses playable examples to explain an implementation choice. | Make the Git figure inspectable. Selecting a reference, commit, tree, or blob changes a concise explanation. Label it as a conceptual model. |
| [Tania Rascia](https://www.taniarascia.com/) provides a practical persistent identity/navigation rail. [Frank Chimero](https://frankchimero.com/) uses quiet typography and a compact directory. | Desktop identity rail, one reading column, vertical document flow on mobile. Borrow constraints, not either site's layout or identity. |
| [Steph Ango](https://stephango.com/) uses aligned dates and explicit links. [Emil Kowalski](https://emilkowal.ski/) keeps hierarchy compact and explains [purposeful motion](https://emilkowal.ski/ui/you-dont-need-animations). | Stable metadata columns, underlined evidence links, no entrance sequence or scroll hijacking. |
| [Brian Lovin](https://brianlovin.com/) uses a restrained identity and curated destinations. [Andy Matuschak](https://andymatuschak.org/) organizes work around inquiries. [Rauno Freiberg](https://rauno.me/) treats spatial composition as a deliberate design idea. | Use one coherent composition and content-derived figures. Keep a conventional vertical scroll for this audience instead of copying spatial navigation. |
| [Butterick's typography guidance](https://practicaltypography.com/typography-in-ten-minutes.html) prioritizes body size, line spacing, and reading measure. [Nielsen's reading study](https://www.nngroup.com/articles/how-users-read-on-the-web/) supports meaningful headings and concise text. | Use installed IBM Plex Sans for body text, Mono for metadata, moderate line lengths, and direct headings. The Nielsen study is from 1997; no recruiter time or conversion claim is extrapolated from it. |
| W3C guidance covers [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). [Web Vitals](https://web.dev/articles/vitals) defines performance measurements. | Visible keyboard focus, usable separated controls, reduced-motion rules, fixed image dimensions, lazy optional simulation, and native scrolling. Local checks do not establish field Core Web Vitals or full WCAG conformance. |
| [Pro Git's object model](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) connects references, commits, trees, and blobs. | The figure follows reference → commit → tree → blob, with filenames in trees and file bytes in blobs. It does not claim to execute the Python implementation. |

## Project selection and provenance

The supplied resume remains the source for internship contributions. Earlier resume-backed data supplies the fellowship and older projects. Public source inspection adds these distinctions:

- **Wyag:** `libwyag.py` contains object classes, tree serialization, binary index handling, and 15 command entry points. Present it as a learning implementation and credit [Write Yourself a Git](https://wyag.thb.lt/).
- **Graph Mechanics:** substantive TypeScript source connects function templates, sampled terrain, coordinate transforms, and Matter.js. Select it because it makes the mathematics background concrete. The game uses parameter sliders and local progress. No live URL was documented.
- **Taskly:** retain its actual application screenshot, repository, and live app. Describe the state and command-handling work already established in the resume-backed portfolio.
- **Software Factory:** the public `sp-hacks` repository is a ZIP archive with upstream team attribution. Use the supplied resume for personal contribution and label this a hackathon team prototype. Link the archive as an archive. Do not imply sole authorship or a verified running service.
- **NeetCode GPT:** public inspection found only a README at the inspected commit. Exclude it from the implemented-project selection.

Stable commit/source links and detailed observations are in [project evidence](research/project-evidence.md). The research did not execute any of the newly discovered repositories.

## Visual direction

A cool off-white surface with graphite type, blue interaction ink, and a small rust accent. A custom line monogram and a real portrait identify the author. Flat entries and aligned rules replace a repeated card grid. The only diagrams explain actual project mechanisms. No generic stock art, animated slogans, testimonial scaffolding, skill percentages, fake terminal, or decorative statistics are introduced.

These are editorial decisions specific to the brief. Neither reference popularity nor subjective resemblance constitutes evidence of hiring effectiveness. The full observation notes remain in [content references](research/content-references.md) and [visual references](research/visual-references.md).

## Implementation and verification contract

See [design contract](design-contract.md). The production build must render at 390×844, 768×1024, and 1440×1000, with an additional 320px check. Exercise keyboard figure selection, project filters/search/reset, project deep links, contact, resume, not-found recovery, optional simulation, and broken-image fallback. Keep the rendered evidence and observations under `docs/qa/portfolio-overhaul-2026-10-16/`.
