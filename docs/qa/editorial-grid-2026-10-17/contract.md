# Editorial grid revision — 17 October 2026

The user's newly pasted brief supersedes the previous Taskly-only / résumé-removal scope. Restore the saved résumé, add Wyag, and use the supplied 2027 availability, experience and hero copy. Keep no portrait or geographic labels outside education context.

Purpose: clear engineering introduction, inspectable work and direct professional contact. Direction: minimalist editorial, with a warm off-white canvas (#FAF9F6), dark ink (#111111), secondary #555555 and #E5E5E0 rules. Inter for text; JetBrains Mono for metadata. No new animation or UI framework.

At >=768 CSS px each major section uses 12 equal grid columns: sticky label spans 3, content spans 9. Below 768 labels return to normal document flow. Target viewports: 390x844, 768x1024, 1440x1000; extra 320px narrow check. Header keeps monogram and name, four navigation destinations and a dark Resume pill; mobile navigation wraps into a separate row. Hero actions are chips, with a green-dot 2027 availability label.

Taskly is a bordered white feature with its actual screenshot in a browser frame, a distinct challenge callout and three useful actions. Secondary systems projects are driven by a clean config array. Wyag keeps tutorial attribution. The user subsequently excluded Project Ghost entirely after clarification; only Taskly and Wyag appear. A single secondary card fills the available content width rather than leaving a blank grid cell.

Architecture must navigate to the existing Taskly command flow with a real labelled anchor. `/projects` should reach the new collection rather than repeating the Taskly overview. Legacy focus links should still reach the relevant work. Education and the supplied three-group technical stack are aligned in the same section.

Applicable states: image loading reserves intrinsic dimensions; failed screenshots keep project actions and text; unknown routes offer recovery; project cards without verified demos show source only; success includes navigation, PDF, source and screenshot links. Empty collections and permissions do not apply to this static site. No fake live project behavior, fabricated URLs or unverified usage/benchmark claims.

Finish: build, lint, diff check; render all targets; exercise header anchors, Architecture, résumé, legacy routes, image fallback and keyboard focus; inspect long titles, status, email and tag wrapping. Save screenshots and evidence JSON; document untested browser/assistive-tech conditions honestly.

## Content provenance

The hero, availability, experience summary/bullets and stack are user-supplied copy from the new brief. They supersede earlier wording, but this website work does not independently verify delivery or deployment claims. The original supplied résumé was restored byte-for-byte; no PDF content was changed.

Wyag's public source and earlier inspection support the object-store/index description; tutorial attribution is retained. Project Ghost was inspected only to clarify a mismatch with the brief, and the user then explicitly excluded it. No Ghost content or links are shipped. Font setup follows the self-hosted Fontsource packages for [Inter](https://fontsource.org/fonts/inter/use) and [JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono/use).
