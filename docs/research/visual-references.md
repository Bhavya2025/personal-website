# Portfolio visual research — 16 October 2026

Read-only study of seven live primary personal sites. Each homepage was opened through web retrieval, then directly rendered and visually inspected in a temporary, hidden browser tab at approximately 1280 × 720. Findings below describe observed pages, not awards-gallery summaries. Existing user preview tab was untouched. No source code, artwork, wording, or brand identity should be copied.

## 1. Emil Kowalski — https://emilkowal.ski/

Observed: a narrow central reading column, roughly 650px wide, offset from the top by about 120px. Name and profession occupy two ordinary text lines. A considerable interval precedes a small “Today” label, then a short professional introduction. Projects are plain vertical linked entries, each with a muted one-line description; writing follows the same grammar. White surface, charcoal text, gray secondary text, unornamented sans serif. The title is close to body size rather than a billboard. There are no enclosing project cards. Static page is immediately readable; this inspection did not reveal a decorative entrance sequence.

Useful for Bhavya: give each project an exact technical description, then an explicit source/demo link. Density is good, but this homepage’s large inter-section gaps would underserve a job applicant who needs experience and selected work visible quickly.

His own reasoning on motion is a primary source: https://emilkowal.ski/ui/you-dont-need-animations . Animations should have a purpose, acknowledge interaction, preserve spatial consistency, and remain fast. Use this to justify quiet feedback, not reveal-on-scroll delays.

## 2. Brian Lovin — https://brianlovin.com/

Observed in dark appearance: black canvas, light gray text, a modest portrait, compact name, and a short two-line professional statement. The main column is approximately 640px wide with generous outer margins. Writing appears as a simple linked list. Projects follow as named destinations plus descriptions. A small menu control is at the far top-left; social links sit after the introduction. There is no sequence of colorful marketing blocks. Headings establish hierarchy by weight rather than extreme size. Page personality comes from portrait, subject matter, and curation.

Useful for Bhavya: a restrained identity block and strong content ordering. Avoid copying the single-column blog emphasis because Bhavya’s strongest evidence is internship work and working software, not a large essay archive.

## 3. Steph Ango — https://stephango.com/

Observed in dark appearance: a near-black canvas and roughly 660px reading measure. Name sits at top-left; About, Now, and a tiny theme control align right. The homepage leads with the latest essay, then topics, then chronological writing. Thin low-contrast rules separate sections. Topic links are underlined inline text rather than pills. Dates occupy a consistent left column in the archive. Text is calm sans serif with modest scale differences.

Useful for Bhavya: tabular dates, genuine link affordances, and repeated alignment create rigor without decorative UI. Use metadata columns for role/date/language rather than many floating tags. No need to adopt the essay-driven structure.

## 4. Frank Chimero — https://frankchimero.com/

Observed: a small typographic directory on a dark desaturated green-gray field. Left column holds identity and a muted descriptor; a second column holds a handful of links, each with a muted second line. Typography resembles a small typewriter/mono face. Almost the whole viewport remains empty. No hero, card boxes, images, gradients, or mass of controls. The sparse two-column alignment is the visual idea.

Useful for Bhavya: identity can be a navigational anchor rather than a giant slogan. A left rail can carry name, degree, location, resume, and contact while the right side shows useful evidence. Do not take the extreme blankness: Bhavya needs more information than an already-established designer’s directory.

## 5. Tania Rascia — https://www.taniarascia.com/

Observed in dark appearance: a persistent left rail around 255px wide with site name, short bio, four primary destinations, then a bottom resume/source/social area. The content region begins with a clear greeting, role statement, and dated career timeline. The timeline uses narrow date and wider text columns. There is playful RAM artwork and a small mascot, but the structural backbone is pragmatic and scannable. Main content uses broad sans serif; metadata uses smaller mono text. Yellow links, cool charcoal background, faint borders.

Useful for Bhavya: persistent identity rail and a brief timeline can make a portfolio usable as a living resume. Resume and source links are immediate. Exclude emoji navigation, mascot, and archive taxonomy unless Bhavya supplies a personal reason; their personality belongs to Tania.

## 6. Andy Matuschak — https://andymatuschak.org/

Observed: an unusual horizontally arranged set of tall independently scrollable columns. First column is biography, the next projects, the next letters. Saturated blue type against a very light pink surface. Large bold sans headings; project entries pair a title with a short explanatory subtitle and sometimes a subtle image. This is deliberately closer to a working research wall than a sales landing page. It trades conventional scrolling for breadth.

Useful for Bhavya: organize around fields of inquiry and concrete artifacts. A single strong ink color can carry identity. Do not use the horizontal multi-scroll behavior: it creates discoverability and mobile complexity that conflicts with recruiter-oriented use.

## 7. Rauno Freiberg — https://rauno.me/

Observed: gray surrounding field, white large panels arranged horizontally, with part of the next panel visible as an affordance. The first panel has tightly arranged oversized black grotesk text and a large fluorescent yellow circle. Small navigation labels sit above panels. This site is a deliberate exhibition of interaction design and spatial composition, quite different from the familiar vertical agency pitch. The page also provides dated prior versions.

Useful for Bhavya: one clear geometric gesture is more memorable than a dozen gradient effects. Prior versions can be preserved as an archive. Do not borrow the giant typography, horizontal panel navigation, or art-direction-led homepage: backend/mathematics work needs readable content and evidence sooner.

# Recommended direction for Bhavya

A compact technical index with the precision of a university research sheet and the usability of a well-edited software README. This is an inference from the references, not a claim that they share one style.

- Cool near-white background (#f5f6f8), deep graphite ink (#20252b), a single strong blue (#1748c8), gray rules. Avoid cream paper, fashionable italic display serif, neon terminal green, purple glow, and gradient mesh.
- Desktop: around 1040–1140px content width. Fixed or sticky 220px identity rail; main column about 700px. Horizontal top datum/rule and disciplined alignment. On mobile, identity becomes a compact top header; one uninterrupted vertical scroll.
- Identity: “Bhavya Kumar”, “Applied Mathematics · University of Waterloo”, precise role interests, resume/GitHub/email. Use facts verified in the repository/resume. No “crafting digital experiences”, “where math meets code”, or “passionate problem solver”.
- Main introduction: a 30–44px sentence with a concrete role/interest, followed by 18px context. Keep the first experience/project visible near the first fold. Don’t write “I build reliable systems” as an accomplished fact unless the artifacts support it.
- Put experience first, since real internship evidence is stronger than decorative projects. Present dates and role metadata in stable columns. Preserve employer confidentiality and do not invent metrics.
- Selected work as three horizontal entries separated by hairlines. Each has a small index, title, narrow project type/date, 2–3 sentence engineering explanation, and explicit source link. A compact technical illustration can represent a real system: Git object graph for Wyag, request/state flow for Taskly, workflow for Software Factory. These should be accurate vector diagrams derived from the actual work, not fake dashboards or random code screenshots.
- One optional working demonstration, for example an inspectable Git object graph, is enough. It should explain an existing project, be keyboard accessible, and remain fully secondary to reading.
- Typography: a capable grotesk/system sans for content plus mono for dates, section numbers, and technical labels. Body 16–18px; line height around 1.55. Small labels should remain readable and satisfy contrast requirements. Avoid an entire site in monospace.
- Interactions: visibly underline real links, clear focus outlines, small color shifts, a resume link with file type, exact accessible labels. No custom cursor, magnetic button, splash loader, background particle field, hover-only information, or scroll hijacking.
- Motion: none required on load; if used, 120–180ms color/opacity feedback or short detail expansion. Honor reduced-motion. No repetitive typewriter, endless ticker, or floating blobs.
- Honest breadth: if projects are early exercises, describe implementation scope and learning precisely. Do not add fake case studies, fabricated testimonials, skill percentage bars, “years of expertise”, unverifiable users, or “production-grade” labels.

# How this avoids a superficial remix

Borrow constraints: small honest identity, aligned metadata, links that look like links, purposeful motion, and technical evidence. Do not borrow individual layouts wholesale. Bhavya’s final visual feature should come from the content itself: a precise object/flow illustration and a short record of systems work, anchored by the Waterloo mathematics background. The most distinctive material is the person’s engineering judgment, not a trendy skin.
