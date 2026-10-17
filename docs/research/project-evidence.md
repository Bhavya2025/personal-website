# Public project evidence — 16 October 2026

Read-only GitHub API inspection. No repository code executed; the Software Factory ZIP was decoded and inspected in memory. Assessments are about publicly inspectable evidence, not private work or the user's ability.

## neetcode-gpt

- Repository: https://github.com/Bhavya2025/neetcode-gpt
- Inspected commit: https://github.com/Bhavya2025/neetcode-gpt/tree/ca675f6011cd55986d648548aaf23e901334545e
- The recursive tree contains only `README.md` (91 bytes). No model implementation, notebook, training script, weights, dependencies, or results are present.
- README: https://github.com/Bhavya2025/neetcode-gpt/blob/ca675f6011cd55986d648548aaf23e901334545e/README.md
- README describes a GPT implementation assembled from NeetCode ML course submissions. This is a repository description, not verified source implementation.
- Metadata homepage is null; no live/demo URL is documented.
- Recommendation: do not feature as an implemented GPT project yet. If included at all, put under learning with wording such as “NeetCode ML coursework — repository prepared for a GPT implementation.” Better to omit until the submissions and runnable instructions are public. Do not claim training, parameter counts, architecture details, or successful generation.

## sp-hacks / Software Factory

- Repository: https://github.com/Bhavya2025/sp-hacks
- Inspected commit: https://github.com/Bhavya2025/sp-hacks/tree/350d58f0aca461a5877fa828276fdf5fdeffe9ce
- Tree contains a single ZIP: https://github.com/Bhavya2025/sp-hacks/blob/350d58f0aca461a5877fa828276fdf5fdeffe9ce/superplane-render-nyc-hack-main.zip
- No root README is present. Inside the archive, `superplane-render-nyc-hack-main/README.md` identifies the project as **Software Factory**, a SuperPlane/Render hackathon project from NYC on June 27, 2026.
- Package is named `software-factory`, version `0.2.4`, Node.js >=18, with a `factory` CLI and stdio JSON-RPC MCP server. Code includes GitHub request helpers, SuperPlane REST client/pipeline triggering, Render preview deployment, status polling, and PR creation functions. This corroborates the integration concept, not actual successful end-to-end runs.
- Archived `src/mcp/server.js` defines ten tools including `fetch_github_spec`, `trigger_autonomous_pipeline`, `get_pipeline_status`, `deploy_preview`, and `create_pr`; `src/commands/build.js` has a pipeline follower. The archived `poc` is a Markdown/Mermaid viewing proof of concept, rather than an independently verified deployed Software Factory interface.
- **Provenance gap:** embedded README and package repository point to https://github.com/hongchengw/superplane-render-nyc-hack ; package author is “SuperPlane Hackathon Team.” The README copyright credits Roshan Sharma, Hong Cheng Wang, and Berton Yeh. This archive does not establish Bhavya's contribution, and the repository has no line-by-line source history for it.
- README links npm package https://www.npmjs.com/package/software-factory but this link was not independently verified as an active published package. Do not call it Bhavya's package without contribution evidence.
- README example preview URLs (`factory-myapp.onrender.com`, `factory-xyz.onrender.com`) and canvas links are placeholders; they are **not verified live demos**. Render YAML names a service but provides no confirmed deployment URL. Repository homepage null.
- Recommendation: this **is** the Software Factory archive. Existing resume can establish that Bhavya reports participating; however the public source does not establish solo authorship or exact scope. Use “Hackathon team prototype” and resume-supported personal work only. Link label “Project archive” is more accurate for the user's sp-hacks repo than “Source code” implying a browsable implementation. Avoid “production”, successful automatic deployment counts, timings, benchmarks, adoption, or claiming the upstream team's entire implementation.

## Graph Mechanics

- Repository: https://github.com/Bhavya2025/graph-mechanics
- Inspected commit: https://github.com/Bhavya2025/graph-mechanics/tree/bf4fa1ef79e3c34bd18921b10ef4103858659c95
- No README. Substantive TypeScript/React source is present. Package uses React 18, TypeScript, Vite, Matter.js, mathjs, Zustand, React Router and GSAP; no need to list every dependency on portfolio.
- Package: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/package.json
- **Actual current gameplay:** player adjusts sliders for authored function templates, then launches a ball toward a target. Do not repeat the metadata's “type an equation” description as current functionality.
- Three levels are authored: line/slope, quadratic arch around a wall, and a quadratic valley with a pursuing enemy. Each level defines start, target, obstacles or enemy, launch speed, and adjustable variables.
- Level evidence: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/src/levels/levelData.ts
- Math implementation compiles templates through mathjs, caches compiled functions, samples at `0.12` graph units, rejects non-finite/extreme values, and returns a fallback line when parsing or evaluation fails. It produces sampled points for terrain, not a symbolic algebra engine.
- Math evidence: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/src/math/mathEvaluator.ts
- Coordinate layer consistently maps graph-space `+y` up to canvas-space `+y` down, with a uniform view scale.
- Coordinate evidence: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/src/math/coordinates.ts
- Physics controller converts curve segments into overlapping static Matter.js rectangles; uses a canvas render loop; supports target, out-of-bounds, enemy and stall outcomes. The selectable “derivative ramp” uses neighboring sampled points to estimate a tangent angle; do not describe it as a symbolic derivative.
- Physics evidence: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/src/hooks/usePhysics.ts#L196 ; tangent ramp starts line231.
- Zustand stores editing/running/won/lost state and persists best times/solved flags in localStorage. Leaderboard is explicitly `MockLeaderboardService`, also localStorage-backed. Do not claim multiplayer, accounts, cloud persistence, Supabase integration, or an online/global leaderboard.
- State evidence: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/src/store/gameStore.ts
- Leaderboard evidence: https://github.com/Bhavya2025/graph-mechanics/blob/bf4fa1ef79e3c34bd18921b10ef4103858659c95/src/services/leaderboard.ts
- Metadata homepage null; no documented verified live URL. No tests appear in tree, and no test script appears in package.json. Build/typecheck scripts exist but were not run in this inspection.
- Recommendation: appropriate as an “Interactive experiment” or secondary project. Safe concise copy: “A browser puzzle where you shape a curve and guide a ball to a target. Function samples become collision terrain; a shared coordinate transform keeps the graph, canvas, and Matter.js simulation aligned.” Link to source only. This connects naturally to Applied Mathematics and has more assessable public substance than the README-only ML repo.

## Portfolio priority judgment

ToadEx remains resume-backed experience. Among these new finds, Graph Mechanics is the strongest candidate for a secondary project because its source exposes a concrete math-to-physics pipeline. Software Factory should be described narrowly as a team prototype with an archive, retaining only resume-backed personal contributions. NeetCode GPT should stay off the selected-work section pending actual source.
