# Forge

A small, self-contained browser demo of the core Forge idea:

> Configure a product concept, apply a real-world condition, and identify expensive or unsafe design problems before building a physical prototype.

Pick a basic object, size it, choose a material, apply a load, and instantly see an
estimated mass, cost, stress, deflection, safety factor, and a pass/warning/fail
verdict — updated live in a simple 3D view. Compare your design against one
alternative (a different material or load) to see the trade-off. A short
built-in walkthrough explains each part of the screen the first time you open it.

This is a stripped-down, standalone build for demonstration purposes. It does
not modify or depend on any other Forge project.

> **Preliminary estimate only.** This tool uses documented reference material
> properties and standard closed-form beam-bending formulas (stress = M·c/I,
> standard cantilever / simply-supported deflection formulas). It is **not**
> finite element analysis, **not** a certified engineering calculation, and
> **not** a manufacturing quote. Always validate real designs with qualified
> engineering analysis and testing.

## Quick start

Requires [Node.js](https://nodejs.org) 20+.

**Easiest — double-click to launch:**
- Windows: double-click `Start Forge.bat`
- macOS/Linux: run `./start.sh` (or `bash start.sh`) in a terminal

Either one installs dependencies on first run (if needed) and opens the app in
your browser automatically. Keep the terminal/console window open while using
the app — closing it stops the local server.

**Manual / any platform:**

```bash
npm install
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`).

Note: you can't just double-click `index.html` itself — it's Vite's source
entry point (unbundled TypeScript/JSX loaded as ES modules), which browsers
refuse to run over the `file://` protocol. It needs a real local server, which
is what the commands above (or the launcher scripts) provide.

Other useful commands:

```bash
npm run build   # type-check + production build (outputs to dist/)
npm run preview # serve the production build locally
npm test        # run the calculation unit tests (vitest)
npm run lint    # lint the source
```

## Using the app

The first time you open it, a short walkthrough explains the four parts of
the screen — reopen it anytime with the **"? Tour"** button in the header.

- **Left — Controls:** pick an object type (mounting bracket, box enclosure,
  or cylinder/shaft), set its dimensions via a size preset or the sliders/number
  inputs, choose a material (aluminum, steel, or PETG), and pick an applied
  force preset. Hover any "?" icon for a plain-language explanation.
- **Center — 3D view:** a live model of the part, colored green/amber/red to
  match the pass/warning/fail verdict, with the applied load shown as an arrow.
  Drag to rotate, scroll to zoom.
- **Right — Results:** estimated mass, material cost, peak bending stress,
  deflection, and safety factor for the current design, plus a comparison
  box against an alternative material/force — independent of your main design.

### Default example

The app opens on a deliberately instructive example: a medium aluminum
mounting bracket under a moderate (150 N) load. Its bending stress is well
within a safe margin (safety factor ≈ 2.76), but the estimated tip deflection
(≈ 2.3 mm over a 120 mm arm) is large enough to fail the stiffness guideline —
a classic case where a part could pass a naive strength check but still be too
flexible to work well in practice. Compare it against steel (heavier and
pricier, but stiffer) or try increasing the thickness slider to see the
bracket move from FAIL toward PASS.

## What it estimates, and how

Every object is reduced to a standard closed-form beam-bending problem:

| Object | Model |
|---|---|
| Mounting bracket | Cantilever beam (rectangular section), point load at the tip |
| Box enclosure | Top panel modeled as a simply-supported beam strip, point load at center span |
| Cylinder / shaft | Cantilever beam (solid round section), point load at the tip |

From the geometry and material, the app computes:

- **Mass** = part volume × material density
- **Cost** = mass × material cost per kg
- **Peak bending stress** = M·c / I (bending moment × distance to extreme fiber ÷ second moment of area)
- **Deflection** = the standard cantilever or simply-supported beam deflection formula for a point load
- **Safety factor** = material yield strength ÷ peak stress
- **Verdict**:
  - **Fail** if safety factor < 1, or deflection exceeds span/100 (clearly too flexible)
  - **Warning** if safety factor is between 1 and 2, or deflection exceeds span/250 (a common stiffness rule of thumb)
  - **Pass** otherwise

All formulas live in [`src/domain/physics.ts`](src/domain/physics.ts). Material
properties (density, elastic modulus, yield strength, approximate cost per kg)
live in [`src/domain/materials.ts`](src/domain/materials.ts) and are
representative published figures for 6061-T6 aluminum, ASTM A36 mild steel,
and PETG — not a specific supplier's certified data sheet.

These are intentionally simple, auditable formulas — they ignore stress
concentrations, buckling, shear, fatigue, and true 3D effects. That trade-off
is the point: a fast, transparent, in-browser screen to catch obviously bad
directions before investing in a real prototype, not a substitute for real
engineering analysis.

## Tech stack

- [Vite](https://vite.dev/) + React 19 + TypeScript (strict mode)
- [Three.js](https://threejs.org/) via `@react-three/fiber` + `@react-three/drei` for the 3D view, lazy-loaded as its own chunk
- [Vitest](https://vitest.dev/) for unit tests on the calculation engine
- No backend, no accounts, no AI, no plugins — everything runs client-side in one screen

## Project structure

```
Forge/
├── src/
│   ├── domain/
│   │   ├── materials.ts       material property reference data
│   │   ├── shapes.ts          per-object dimension fields and size presets
│   │   ├── forcePresets.ts    applied-force presets
│   │   ├── physics.ts         mass/cost/stress/deflection/safety-factor/verdict engine
│   │   └── physics.test.ts    unit tests for the calculation engine
│   ├── components/
│   │   ├── ControlsPanel.tsx  left panel: shape, dimensions, material, force
│   │   ├── Scene3D.tsx        center panel: react-three-fiber 3D view
│   │   ├── ResultsPanel.tsx   right panel: results + comparison
│   │   ├── InfoTip.tsx        hover "?" explanations (portal-positioned, viewport-clamped)
│   │   └── Tutorial.tsx       first-run walkthrough modal
│   ├── App.tsx                layout and state wiring
│   └── App.css / index.css    styling
├── Start Forge.bat            Windows one-click launcher
├── start.sh                   macOS/Linux one-click launcher
└── README.md                  you are here
```

## Verified

- `npm run build` completes cleanly (type-check + Vite production build).
- `npm test` passes (19 unit tests covering geometry/volume, mass/cost
  scaling, closed-form stress/deflection formulas, and pass/warning/fail
  boundary logic).
- Manually exercised in a browser: switching shape, dimensions, material, and
  force updates the 3D model and results live; the comparison panel updates
  independently of the primary design; the tutorial shows on first run, stays
  dismissed on reload, and reopens on demand; tooltips stay within the
  viewport at every position tested.
