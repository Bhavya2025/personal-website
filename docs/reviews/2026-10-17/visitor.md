# Independent first-time visitor review — 2026-10-17

Target: http://127.0.0.1:5184/
Perspective: Ordinary first-time visitor with no information about Bhavya Kumar beyond the visible website.

Protocol: Reviewed the homepage first screen, Projects, Taskly project notes, Contact, and the homepage Experience/Background area, including expanded contributions. Did not inspect repository files, other reviews, prior chat, or external profiles. Did not open or download a PDF. Used the existing desktop viewport. The in-app browser became unavailable, so the coordinator authorized a separate Chrome review session. Closed my Chrome review tab after completing the review. The initial connection failures were local review setup issues and do not affect the rating below.

## What I understand from the first screen

Bhavya Kumar is an applied mathematics student at the University of Waterloo, currently a software engineering intern at ToadEx, and seeking co-op/internship opportunities. His visible personal project is Taskly, a kanban board with an AI assistant. I can immediately find his résumé and a contact action. This is a clear, restrained introduction; I do not have to infer his name, school, or role from slogans.

I understand the general shape of Taskly from its board screenshot. “Kanban” and “Python middleware” will mean less to an ordinary visitor than they would to an engineer. I can infer a task organizer, but the homepage does not give a concrete example of how the AI assistant helps someone.

## What is confusing

- Projects takes me to a page whose big heading is “Taskly,” then presents another “Taskly” heading and nearly the same description/screenshot I already saw on the homepage. I initially have to work out whether I reached a project detail page or an overview. “Project notes” leads to the actual detail page. For one project, this adds a step without much new information.
- The navigation calls the page “Index,” a slightly editorial label for Home. It also calls an anchor “About,” while the destination heading says “Background.” These are understandable after clicking, but matching labels would reduce effort.
- The numbering has two different meanings. The sidebar says “03 Experience,” while the destination says “02 Experience”; “04 About” lands on “03 Background.” The numbers feel like a map, then fail to correspond.
- At the Experience anchor, both Index and Experience appear blue. That makes the current-location cue less decisive.
- The project notes explain implementation mechanisms, but I still do not know the original problem, an example command, or the practical result of the scroll-performance work. “One mutation path,” “500 ms debounced Supabase sync,” and “ref-based DOM updates” require specialist knowledge. They are useful engineering detail, but insufficient translation for an ordinary reader.

## Would I click onward?

Yes. I would click Taskly or the live app because the screenshot makes the work tangible and the short description is specific. I followed Projects and Project notes during this review. The extra overview step weakens the momentum a little. Contact is easy to understand: a large, visible email address and clearly described résumé/GitHub/LinkedIn links. I would know how to reach him without searching.

## Typography, spacing, and navigation

The large name and short role lines create a strong hierarchy. The narrow, consistent main column and ruled sections make the pages calm and easy to scan. I saw no overlapping content or obvious broken layout in this desktop viewport.

The quieter typography sometimes becomes too quiet. Dates, “Open to co-op & internship roles,” the project image caption, sidebar location, and footer text are very small and pale relative to the headings. The gray homepage/project descriptions also feel faint on the near-white background. The Taskly screenshot communicates the board layout, but individual card text is tiny; it is visual evidence of an interface rather than something I can comfortably read.

There is substantial breathing room, especially on Contact. That is pleasant rather than obstructive. The larger inefficiency is repeated content: the homepage, project overview, and detail page each spend prominent space on the same Taskly description/image. The sticky sidebar remains useful while reading lower sections. Mixed full-page links and homepage anchors work, although the label/number/current-state issues above make the system less coherent than its visual style suggests.

## Strongest element

The immediate, plain identity statement paired with a real project screenshot. Within the first screen I know who this is, what he studies, what kind of work he does, and what I can inspect next. The site feels composed and credible without needing a long introduction.

## Three highest-priority fixes

1. Simplify the single-project journey. Make Projects lead directly to useful Taskly depth, or make the overview explicitly a project index and avoid repeating the same large Taskly heading. Keep direct access to notes/demo/source obvious.
2. Improve small-text legibility and navigation consistency. Darken and, where appropriate, enlarge metadata/status/captions; match About with Background; align or remove the competing number systems; make the active location unambiguous.
3. Put a short user-facing story before the implementation notes: what problem Taskly solves, one concrete AI command and result, and what changed after the performance investigation. Let the engineering details follow that explanation. Only add measured outcomes if they actually exist.

## Subjective clarity rating

**4/5.** The identity, employment goal, primary project, and contact route are clear. The project journey repeats itself, and the deeper evidence assumes more technical background than an ordinary visitor has. This is a subjective desktop visitor assessment, not an accessibility audit or an assessment of the underlying code.
