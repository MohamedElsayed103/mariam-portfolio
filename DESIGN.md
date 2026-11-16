# Design contract: Mariam Ahmed portfolio

One page. Audience: an engineering lead or technical recruiter, on a laptop in a bright office (sometimes a phone), deciding in about a minute whether to message a backend Java developer. They must leave knowing: she builds Spring Boot microservices, she has shipped real systems, and how to reach her.

## Concept: "the system is the portfolio"

Mariam's work is invisible by nature (services, queues, state). The site makes it visible. Every piece of imagery is a **working diagram of real backend behaviour**: packets moving between services, a state machine you can drive, a queue draining. Nothing decorative that does not mean something.

- Reference lane: a network operations room at dusk, railway signalling diagrams, a well-kept architecture whiteboard. Deep indigo room, violet brand, lime "healthy" signal lamps.
- NOT: a terminal/hacker costume, a typing-prompt hero, green-on-black, an editorial serif magazine, a SaaS landing page, a card grid of skills with progress bars.
- Voice: precise, load-bearing, quietly warm. First person, plain sentences, zero buzzwords. No em dashes in copy.

## Hard rules

1. **Content comes only from `src/data/cv.ts`.** Never invent a metric, employer claim, technology, date or testimonial. If you need a sentence that is not there, write connective copy that asserts no new fact. Do not edit `cv.ts`; if something is missing, say so in your report.
2. **Only edit the files you own** (listed in your task). Do not touch `global.css`, `motion.ts`, `Base.astro`, `index.astro`, `package.json` or other sections. No new dependencies.
3. **Tokens only.** Every colour is a `var(--…)` from `src/styles/global.css` (or a `color-mix(in oklch, …)` of them). No hex, no rgb. Spacing uses `--gutter`, `--section` and rem/clamp. Radii use `--r-*` (cards max 14px). z-index uses `--z-*`.
4. **Section shell.** Root element is `<section id="…" data-theme="light|dark|violet">` (themes flip `--bg --fg --fg-muted --rule --accent --lamp`). Use `.wrap` for the container and `.section-pad` for vertical rhythm unless the section is full-bleed by design. The `id` is given in your task; nav anchors depend on it.
5. **Type.** Archivo Variable (weight 100 to 900, width 62 to 125 via `font-stretch`). Display: weight 700 to 800, `font-stretch: 112%` to `125%`, letter-spacing never tighter than -0.03em, max size 6rem. Body: weight 400 to 450, `font-stretch: 100%`, measure 65ch max. JetBrains Mono (`.code`) is **only** for things that are literally code: state names, event names, queue names, service names, endpoints, HTTP statuses. Never for decoration, never for body copy.
6. **Banned** (rewrite if you catch yourself): gradient text; tiny uppercase tracked eyebrow labels above headings; `01 / 02 / 03` section numbering; side-stripe coloured borders; glass cards; identical icon+title+text card grids; 1px border + big soft shadow on the same element; radius above 16px on cards; decorative grid-line backgrounds; stripe backgrounds; sketchy SVG illustration; skill bars or percentages; emoji; lorem ipsum.
7. **Motion.** Import `gsap, ScrollTrigger, reduced, EASE, whenVisible, splitWords` from `src/scripts/motion.ts` (never from `gsap` directly). Content is fully visible and laid out in CSS with no JS; animation only enhances. Use `gsap.from(...)` inside `whenVisible(...)` or scrubbed ScrollTriggers. Exponential ease-out; no bounce. Animate transform, opacity, clip-path, stroke-dashoffset; not layout properties. **Every animation has a reduced-motion path**: when `reduced` is true, show the final state, and any looping diagram must render a meaningful static frame. Loops must pause when off-screen (IntersectionObserver) and when the tab is hidden. Each section's motion should fit what it shows; do not apply the same fade-up to everything.
8. **Accessibility.** Semantic headings (one `h1` in Hero; sections use `h2`, sub-items `h3`). Body contrast at least 4.5:1, verified against the actual background. Every interactive thing is a real `<a>` or `<button>` with a visible `:focus-visible` state, a 44px touch target and a keyboard path. Diagrams: `role="img"` with an `aria-label` that says what the diagram shows, or a visually hidden text equivalent; interactive diagrams announce changes through an `aria-live="polite"` region.
9. **Responsive.** Compose for 360, 768, 1024, 1440 and 1920. No horizontal scroll at any width. Diagrams must re-layout or simplify on narrow screens (for example horizontal becomes vertical), not just shrink until unreadable: minimum 12px rendered text inside diagrams. Long words like `UNDERTREATMENT` and `user-management-service` must not overflow.
10. **Astro notes.** Astro 7. Scoped `<style>` in the component; elements created by JS need `:global(...)` selectors. Client code goes in a plain `<script>` tag in the component (bundled as a module, TypeScript allowed) or in a `src/scripts/*.ts` file you own. Pass data to scripts through `data-*` attributes or a `<script type="application/json">` block, not `define:vars`. Wrap init so it tolerates the element being absent.

## Palette (all in `global.css`)

- Room: `--indigo-950 / 900 / 800 / 700`. Brand: `--violet-600` (primary), `500 / 400 / 300 / 200 / 100`.
- Signal: `--signal` (lime, for lamps, active states and the primary call to action on dark; dark indigo text on it). `--signal-deep` for lime-coded text on white.
- `--flare` (coral): a message in flight, a rejected event, a cancelled state. Rare.
- Light sections: `--white` background, `--ink` text, `--muted` secondary, `--surface`, `--line`.
- Strategy is **committed**: colour carries whole sections (indigo and violet drench), white sections stay truly white. Do not add tinted beige, do not add new hues.

## Shared primitives

`.wrap`, `.section-pad`, `.h-section` (section heading), `.lede`, `.code`, `.btn` with `.btn-signal | .btn-primary | .btn-ghost`, `.lamp` (status dot), `.sr-only`.

## Checking your work

A dev server is already running at `http://localhost:4321`. Each section has an isolated page: `/dev/<component-name-lowercase>` (for example `/dev/hero`, `/dev/projecthospital`). **Do not start another server and do not run `astro build`.**

Screenshot (path has NO leading slash; use `index` for the home page; run from the project root, then Read the PNG and actually look at it):

```
node scripts/shots.mjs dev/hero hero-1440                # 1440x900, reduced motion (final state)
node scripts/shots.mjs dev/hero hero-360 --w 360 --h 780 --full
node scripts/shots.mjs dev/hero hero-motion --motion --wait 2500   # with animation running
node scripts/shots.mjs dev/hero hero-768 --w 768 --h 1024 --full
```

The script prints console errors and elements that cross the viewport edge. Use a unique name prefix for your shots. Iterate until it would survive a review at a high-end studio: check spacing rhythm, alignment, contrast, overflow, the diagram's legibility, and the 360px layout. Minimum before you report: 1440 and 360 screenshots inspected, zero console errors, no horizontal scroll.
