# Bhavya portfolio: primary-source content research

Researched 16 October 2026. Confidence: high for the observations about the pages; medium for design recommendations, which are editorial judgment rather than measured hiring effects.

## Questions and method

Investigated (1) how working engineers organize a personal site, (2) how a project becomes assessable beyond a stack list, and (3) how personality can emerge through useful content. Used three targeted searches plus direct navigation, opening seven selected primary pages in full, including long implementation writeups. Firecrawl/Exa are unavailable in this session; used the available web tool. These references include durable older design decisions and a 2026 technical article. No claim about recruiter conversion or review times is supported or needed.

## Seven sources and concrete observations

1. [Julia Evans — Projects](https://jvns.ca/projects/). **Observed:** A plain project index leads to a short section per tool. Each section explains a reason for building it and offers the actual tool plus a separate development writeup. Credits are explicit for collaborative work; rbspy has documentation and GitHub links and a note about transferred maintainership. **Implication (judgment):** A portfolio entry should tell me what I can inspect and whose contribution it describes. A two-sentence motivation plus specific links can do more than an elaborate marketing card.

2. [Julia Evans — Using less memory to look up IP addresses in Mess With DNS](https://jvns.ca/blog/2024/10/27/asn-ip-address-memory/). **Observed:** This is a dated account of a real memory constraint and backup failure. A contents list exposes failed SQLite and trie approaches, profiling code, data representations, and the adopted change. Evans reports a memory reduction from about 117 MB to 46 MB, alongside slower lookups, and explicitly leaves uncertainty about eliminating every failure. **Implication (judgment):** Present one concrete decision with its constraint, alternative, and limit. Borrow the candor and specificity, never the metrics. A useful project detail can be modest and still credible.

3. [Paco Coursey — homepage](https://paco.me/). **Observed:** The opening names his current workplace and previous Vercel work. Separate Building, Projects, Writing, Now, and Connect headings have short entries; project names link directly to repositories. Work descriptions name the software’s function. Personal interests live after work evidence. **Implication (judgment):** Bhavya can use a compact identity and employment context above a real work index; no need for a slogan or an introduction animation. Personality can be one factual aside, avoiding invented interests.

4. [Paco Coursey — Redesign 2021](https://paco.me/writing/redesign-2021). **Observed:** Coursey explains his choice to reduce features and novel interactions in favor of maintainable documents and links. A colophon describes the typography and implementation; this historical version intentionally disabled JavaScript. **Implication (judgment):** A deliberately constrained visual system is a defensible design direction. This is a practitioner’s rationale, not proof that JavaScript or interaction is always harmful. Use a small interaction only when it explains Bhavya’s work.

5. [Nikita Prokopov — Work](https://tonsky.me/projects/). **Observed:** Entries expose role, period, status, stack, customer, or downstream users where relevant, and distinguish prototypes, launched projects, stable software, and ongoing work. The information schema is consistent even though project descriptions vary. Source and product links sit with the work. **Implication (judgment):** Put ownership and maturity beside every Bhavya project. A personal learning implementation, internship contribution, and team prototype should not read as identical production achievements. Do not import Prokopov’s adoption claims or star counters as decorative evidence.

6. [Maggie Appleton — homepage](https://maggieappleton.com/). **Observed:** The site explains what she makes and categorizes essays, notes, and patterns with explicit descriptions. Notes are labeled as unfinished understanding, and the garden is described as a growing collection. **Implication (judgment):** Honest labels make differing levels of completeness intelligible. For Bhavya, three finished project entries are better suited than copying this large information architecture. Only add a notes area if actual dated notes exist.

7. [Josh W. Comeau — CSS vs. JavaScript](https://www.joshwcomeau.com/animation/css-vs-javascript/). **Observed:** This 2026 article states its question and intended audience, then pairs short code samples with controlled, playable animation comparisons. It explains the tradeoffs and qualifications before offering a recommendation. **Implication (judgment):** Useful interaction should let a reader inspect a claim. For this portfolio, an object/commit visualization that exposes data relationships is more relevant than a cursor effect, decorative physics simulation, or perpetual marquee. This article demonstrates an explanation technique; it does not establish hiring outcomes.

## Recommended content direction for Bhavya

Editorial judgment grounded in the patterns above: a restrained engineering notebook/work index. Large name, short factual introduction, compact navigation, visible project evidence, one technical illustration, and a straightforward contact ending. The design can have an individual character through proportion, typography, editorial rhythm, and precise language rather than a pile of decorative UI patterns.

- Identity: use the verified University of Waterloo Applied Mathematics background and actual role interests. Avoid unsupported seniority or claims such as “building the future” and “transforming complex ideas into seamless experiences.”
- Experience: lead with ToadEx because it is actual professional context. State the scope and contribution from the supplied resume; avoid exposing private internals or implying ownership of an entire employer product.
- Projects: select two or three and show a role or project type, purpose, one implementation detail, and direct evidence. Put links at the point of evaluation: “Source”, “Live demo” only when verified, “Implementation notes” only when authored.
- Wyag: explicitly credit its tutorial origin; describe only verified implemented Git concepts. It can show careful learning without masquerading as a novel Git replacement.
- Software Factory: state its actual current status and team/solo role, and expose real links or a documented architecture. Do not manufacture adoption, performance, screenshots, repository availability, or testimonials.
- Taskly: use a plain function description and source link; keep lower in the hierarchy if there is less distinctive engineering evidence.
- Cut skill meters, invented benchmark statistics, generic three-card “values” sections, AI-written manifesto prose, stock gradient project thumbnails, a fake terminal command interface, and empty blog scaffolding. These are specific design choices for this brief, not universal prohibitions.

## One distinctive opportunity

Make the Wyag object model a real, accessible explanatory figure: working file → blob, filename mapping → tree, snapshot plus metadata → commit, reference → commit. If interaction is added, let selecting each actual object reveal a concise explanation; the default static figure must remain legible. Label it as a conceptual illustration, not live execution or a test result. Tie its text to verified repository features. This gives Waterloo mathematical structure and systems curiosity a concrete expression without inventing a new project or distracting visitors from the work.

## Proposed page order

1. Name, one factual introduction, resume and email.
2. Selected work: two or three detailed entries, individually shaped around their evidence.
3. ToadEx experience and Waterloo education in a compact factual section (the internship may also be previewed near the introduction).
4. Short real personal context if available, then contact.

The source patterns are observations; the exact order, typography, composition, and rejection of certain motifs remain design judgment. No evidence here implies that mirroring any one established practitioner’s site would suit an early-career candidate.
