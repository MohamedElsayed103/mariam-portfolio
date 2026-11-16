# Mariam Ahmed — portfolio

Personal portfolio of Mariam Ahmed, backend Java developer (Spring Boot, microservices), Cairo.

The idea behind the design: backend work is invisible, so the site draws it. Every diagram on the page is a working model of real behaviour — packets moving between services, a career rendered as a state machine, and the actual Spring StateMachine from the Hospital Management System that you can drive event by event.

## Stack

- [Astro](https://astro.build) — static output, no framework runtime
- [GSAP](https://gsap.com) + ScrollTrigger and [Lenis](https://lenis.darkroom.engineering) for motion and smooth scrolling
- Archivo Variable and JetBrains Mono, self-hosted via Fontsource
- Plain CSS with OKLCH design tokens (`src/styles/global.css`)

## Structure

```
src/data/cv.ts          every word on the site (single source of truth)
src/styles/global.css   tokens and shared primitives
src/scripts/motion.ts   shared motion runtime (GSAP, Lenis, reduced motion)
src/components/         one component per section
src/pages/index.astro   the page
DESIGN.md               the design contract the sections were built against
```

To update content, edit `src/data/cv.ts`. To replace the CV, overwrite `public/Mariam-Ahmed-CV.pdf`.

## Develop

```
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
```

`node scripts/og.mjs` regenerates the social preview image (`public/og.png`) from `src/pages/og.astro` while the dev server is running.
