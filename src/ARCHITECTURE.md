# WAEL Architecture

This document is the map. It describes what WAEL is, how it's built, and why the layers connect the way they do. It does not duplicate the layer specifications. For the contract of any layer, the layer's own document is the source of truth.

## 1. Purpose and North Star

WAEL is an architecture that reads enough about a man's current life to suggest experiences that help him feel alive again.

The man answers a structured questionnaire. The system reads the patterns the answers reveal. He sees a dashboard that names what's there in observational language. He's offered concrete experiences he might try.

North Star: *make him feel alive again.*

Not by telling him what's wrong. Not by giving him goals. Not by motivating, coaching, or facilitating. By reading what the responses indicate, presenting it plainly, and offering things he could try. The product trusts him to act, or not, on his own terms.

## 2. The audience

One specific reader.

A British professional male in his late forties to early sixties. Educated but not academic. Has built something: a career, a family, a business, a life. Successful by external measures. Quietly suspects something has narrowed without his noticing. Allergic to glib. Wry, self-deprecating. Says "mustn't grumble" when asked how things are. Has dismissed therapy not because he disrespects it but because it's not his register. Would rather read than be told.

The voice and register of every surface in the system is calibrated for this reader. If a sentence sounds like therapy speak, self-help, or coach voice, he closes the tab. If it sounds like it was written by someone who genuinely understands him and refuses to perform either earnestness or detachment, he keeps reading.

This audience choice is architectural, not stylistic. The constraints it imposes (plain register, no clichés, no hype) shape the entire system: questionnaire wording, sentence libraries, dashboard prose, experience descriptions. Voice is a system-wide property, not a per-component decision.

## 3. The architectural premise

WAEL produces an architectural reading. Not a diagnosis. Not a personality test. Not a coaching framework. A reading of the present pattern of a life.

The premise is that midlife narrowing is patterned, not random. Men who feel flat often share architectural shapes. Naming the shape doesn't cure it, but it makes it visible. Most men in this position have not named their pattern even to themselves.

The system never tells the man what's wrong with him. It reads what the responses indicate and presents it as observation. The man reads the observation and decides what to do. Recognition, not prescription.

## 4. System overview

WAEL is built as four layers plus supporting machinery. Each layer has one job. The interfaces between layers are explicit data contracts. Each layer can be tested in isolation against fixtures.

The layers, in order:

- **Engine.** Takes questionnaire input. Produces a structured architectural reading.
- **Synthesis.** Takes the architectural reading. Produces structured rendering instructions for the dashboard.
- **Render.** Takes rendering instructions. Produces the man-facing dashboard.
- **Experience.** Takes the architectural reading and the experience inventory. Recommends concrete things to try.

The supporting machinery includes:

- **State and routing.** A Pinia store holds the currently-active reading. Four routes consume it (`/assessment`, `/results`, `/laboratory`, `/inspection`).
- **Design system.** A single CSS file (`main.css`) defines tokens, base styles, and surface-specific classes.
- **Data files.** Sentence libraries, term explanations, static copy, experience inventory. Curated content the layers consume.
- **Fixtures.** A cohort of hypothetical men, each represented as a JSON input plus expected outputs. Used for testing every layer.

The layers compose without circular dependencies. The engine knows nothing about the synthesis layer. The synthesis layer knows nothing about the render layer. Each layer is a pure function over its inputs.

## 5. Data flow

The full path from input to output:

```
Questionnaire input map
        |
     Engine
        |
     EngineOutput
        |
        +---> Synthesis layer ---> RenderingInstructions ---> Render layer ---> Dashboard
        |
        +---> Experience layer (consumes EngineOutput + inventory)
                                 ---> Recommended experiences
```

The active reading is held in a Pinia store. The store carries the input map, the engine output, and the rendering instructions. Surfaces read from the store via their respective routes.

Every transformation is deterministic and pure. Same input, same output. No randomness, no LLM calls, no opaque algorithms. Each layer is heuristic; rules are visible in code; behaviour is reproducible against fixtures.

## 6. Layer 1: Engine

Specification: `src/ENGINE.md`.

The engine is the diagnostic core. It takes the questionnaire input map and produces an `EngineOutput` object containing the firing pattern across direction, domain, and constraint signals plus cross-cutting outputs.

The engine's behaviour is fully heuristic and deterministic, defined by predicates and thresholds in code. There is no machine learning. Every output is traceable to specific input combinations and named rules.

The engine has been built and validated against the cohort. The specification at `src/ENGINE.md` is the source of truth for input shape, scoring functions, and output structure.

## 7. Layer 2: Synthesis

Specification: `src/SYNTHESIS.md`.

The synthesis layer transforms the engine output into structured `RenderingInstructions`. It is the bridge between engine output (numerical, structured, machine-readable) and the render layer (visual, prose, man-facing).

The synthesis layer composes the firing pattern into a coherent read. It draws sentences from registered libraries, applies predicates in registration order, and produces the headline, paragraphs, panels, chart data, and closing lines that the render layer mounts.

The synthesis layer is heuristic. The specification at `src/SYNTHESIS.md` is the source of truth for output structure and predicate logic.

## 8. Layer 3: Render

Specification: `src/RENDER.md`.

The render layer takes `RenderingInstructions` and produces the man-facing dashboard. Built in Vue 3 with the Composition API, plain CSS, single responsive build for mobile and desktop.

The render layer applies an editorial visual register: serif typography for prose, sans for data, a single quiet teal accent, hairline borders, generous whitespace. It makes no architectural decisions. It renders what synthesis produced.

The specification at `src/RENDER.md` is the source of truth for component composition, accessibility constraints, and visual rules.

## 9. Layer 4: Experience

Specification: `src/EXPERIENCE.md`.

The experience layer takes the architectural reading and the experience inventory, and recommends concrete experiences for the man to try. The brief is *make him feel alive*: surface things that have a real chance of producing a felt response, weighted toward kinds of aliveness that have gone quiet.

The recommendation logic is heuristic, deterministic, and biased toward expansion (anti-narrowing). The experience layer does not learn preferences. Status flags from the man (saved, booked, done, not interested) are exclusion signals, not preference learning. The system does not converge on what he already does.

The experience layer is one-shot or few-shot. The system does not optimise for retention. It works when the man stops needing it.

The specification at `src/EXPERIENCE.md` is the source of truth for inventory shape, recommendation logic, and surface design.

## 10. State and routing

State machinery: a Pinia store (`useActiveReadingStore`) holds the active architectural reading. State includes the input map, the engine output, the rendering instructions, plus metadata (source, loaded-at timestamp, loading flag, error). Getters expose readiness flags.

Loaders write to the store:

- `loadFixture(fixtureId)`: development. Loads a cohort fixture, runs the engine and synthesis, populates state.
- `loadUserLatest(userId)`: production. Fetches the user's latest assessment.
- `loadUserAssessment(userId, assessmentId)`: production. Fetches a specific historical assessment.
- `loadImpersonation(userId)`: admin. Loads a target user's data with impersonation flagged.

Routes consume the store:

- `/assessment`: questionnaire (real implementation later; v1 stub is a fixture picker).
- `/results`: dashboard. Reads `renderingInstructions` from the store.
- `/laboratory`: the laboratory surface (protocol hub, per-protocol drill-down, and the combined For You view). Reads from the store.
- `/inspection`: developer-facing structured view. Reads everything from the store. Mode-gated.

Three modes determine UX:

- **Dev mode.** Local development. Fixture picker visible in app header. All routes accessible. Refresh restores the loaded fixture from local storage.
- **Admin mode.** Production user with admin role. Impersonation control replaces fixture picker. Inspection route accessible.
- **User mode.** Ordinary production user. No picker UI. Store auto-loads the user's latest assessment on boot. Inspection route hidden.

A user can take the assessment more than once. The store supports loading any historical assessment. The results route can offer a small picker for users with multiple assessments.

## 11. Design system

A single CSS file at `src/ui/styles/main.css`. Tokens are the source of truth: CSS custom properties covering colour, typography, spacing, borders, shadows, motion, opacity, layout, and form controls. Component CSS reads tokens via `var(--token-name)`. To change look-and-feel: edit token values; component code is unchanged.

The visual register is editorial: serif for prose, sans for data, monospace for code. Single accent colour: a quiet teal, lifted in dark mode for contrast. Other colour is greyscale.

Mobile responsiveness is single-breakpoint. Type scale tightens on mobile; spacing rhythm tightens; container widths go to 100%. Touch targets meet WCAG 2.5.5. Reduced motion preference is honoured at the token level.

There is no Tailwind, no CSS-in-JS, no utility framework. Plain CSS, consumed via design tokens.

## 12. Data files

Curated content the layers consume:

- **`src/synthesis/data/`**: synthesis-layer content (shape sentences, recognition sentences, term explanations, lookup tables, closing line tokens).
- **`src/ui/render/`**: render-layer content (term indicator targets, term lookup, static copy, slug helpers, term scanner).
- **Experience inventory**: curated experiences with structured metadata.
- **Fixtures (`fixtures/`)**: cohort fixtures, each with input map and expected outputs at engine and synthesis layers.

The data files are curated, not generated. Changes to content are content decisions, not code decisions. The voice and register of each file matches the surface it serves.

## 13. Voice and register

Voice is a system-wide property, not a per-component choice. The constraints apply across all layers, all surfaces, all content:

- **Plain register.** Specific. Concrete. No generalities.
- **British English.** "Realised" not "realized." "Behaviour" not "behavior."
- **No em-dashes anywhere.** Use colons, full stops, commas, semicolons.
- **No en-dashes anywhere.** Hyphens for compound modifiers.
- **Recognition not diagnosis.** The system reads what's there. It does not tell the man what's wrong.
- **No therapy speak.** No "you might be experiencing." No "your inner self." No "authenticity."
- **No self-help language.** No "transform your life." No "best self." No "find your purpose."
- **No coach voice.** No "ready to take action?" No "you've got this." No imperatives.
- **No clichés.** No "live intentionally." No "follow your heart." No "midlife crisis."
- **No hype.** No exclamation marks. No urgency. No promises.
- **Sceptical and adult tone.** The reader is treated as a peer who has lived a life.

These are architectural constraints, not stylistic preferences. They apply to questionnaire wording, sentence libraries, dashboard prose, term explanations, experience descriptions, error states, footer copy. Every surface in the system speaks in this register, with one deliberate exception: the engine output prose can use second-person where it's specified to in `ENGINE.md` and `SYNTHESIS.md`. The experience layer specifically does not.

The "yep, that fits" test: if the man reads a sentence and his reaction is "yep, that fits, that's actually true of me," it works. If his reaction is "what does that even mean" or "this sounds like therapy speak," it fails.

## 14. What this system does not do

The non-goals are as architecturally important as the goals. WAEL does not:

- **Tell the man what to do.** It reads what's there and offers things to try. The man decides.
- **Animate or perform.** No fade-ins, no dramatic transitions, no celebratory micro-interactions. The dashboard renders instantly.
- **Persist user state inside surfaces.** Card expand/collapse resets on page load. The dashboard is not a tracking app.
- **Engage retention.** No streaks, no notifications, no "you haven't checked in." The product succeeds when the man stops needing it.
- **Learn from preference signals.** Status flags exclude (don't show me this again); they don't train a preference model. The system does not converge on what he already does.
- **Use machine learning.** All transformations are heuristic, deterministic, and inspectable in code.
- **Call an LLM.** All prose is from curated data files or synthesis output. No dynamic generation.
- **Generate content dynamically.** All text is from data files, synthesis output, or static copy.
- **Use Tailwind, CSS-in-JS, or utility frameworks.** Plain CSS only.
- **Optimise for engagement metrics.** The product is one-shot or few-shot. Quality of the cold-start session matters more than session count.
- **Couple layers tightly.** Each layer is a pure function over its inputs.

## 15. Current build state

As of the date of this document:

**Built and validated:**
- Engine. Cohort fixtures pass. Source: `src/ENGINE.md`.
- Synthesis. Cohort fixtures pass. Source: `src/SYNTHESIS.md`.
- CSS design system. Single `main.css`.
- Routing refactor. Pinia store, four routes, mode gating, fixture loader.

**In progress:**
- Render layer. Build under way. Source: `src/RENDER.md`.

**Queued:**
- Experience layer. Spec being verified. Source: `src/EXPERIENCE.md`.
- Data authoring. Recognition sentences, term explanations, term indicator targets, static copy. Briefed; running as a parallel task.

**Production-mode hooks (stubbed):**
- User authentication. Real auth integration is a future task.
- Assessment storage. Real persistence is a future task.
- User-fetching backend. Stubbed loaders in the store throw informative errors when called.
- Real impersonation. Mechanism is in place; backend is stubbed.

The system is built layer by layer with verification rounds at each boundary. Each layer's specification is the source of truth for that layer; this document is the high-level map.

---

## Where to read next

- For the engine internals: `src/ENGINE.md`.
- For synthesis logic: `src/SYNTHESIS.md`.
- For the dashboard render layer: `src/RENDER.md`.
- For the experience layer: `src/EXPERIENCE.md`.
- For design tokens and visual register: `src/ui/styles/main.css`.
- For the cohort fixtures: `fixtures/`.

Each spec is self-contained for its layer. This document orients; the specs prescribe.
