# WAEL Style Brief

**Status:** Agreed. Authoritative reference for all man-facing language in the WAEL dashboard: sentence libraries, term explanations, panel headings, static copy, error and loading states.

**Scope.** This brief governs the style of every sentence, label, and string the man reads on the dashboard. It applies across SYNTHESIS.md sentence libraries, term explanations, display labels, and all man-facing static copy in RENDER.md. It does not govern architectural prose in the specs themselves (spec text written for engineering reading, not for the dashboard).

---

## Part 1: Universal principles

These principles apply to every sentence the man reads, regardless of which slot it appears in.

### 1.1 Audience

One specific reader.

A British professional man in his fifties. White collar: senior manager, director, owner-operator, or similar. Educated but not academic. Successful by external measures. Has built something: a career, a family, a business, a life. Quietly suspects something has narrowed without him noticing. Wry, self-deprecating, sceptical. Says "mustn't grumble" when asked how things are. Has dismissed therapy not because he disrespects it but because it's not his register. Would rather read than be told.

The tests he applies, silently, to every sentence on the dashboard:

- **Recognition:** if a sentence lands as something he recognises about himself, he keeps reading.
- **The pub test:** would a man speaking to a friend at the pub use this phrase? "I've been feeling stretched" passes. "I'm experiencing feelings of being stretched" does not. This is the sharpest test of the lot; when in doubt about a phrase, run it through the pub test first.
- **Therapy speak:** if a sentence reads like clinical psychology or counselling vocabulary, he closes the tab.
- **Self-help:** if a sentence reads like motivational content, life-coaching, or aspirational framing, he closes the tab.
- **American personal development:** if a sentence reads like the register of US wellness or productivity culture, he closes the tab.
- **Performed earnestness or detachment:** if a sentence sounds like the author is performing either care or distance rather than just observing, he closes the tab.

The voice is operator-researcher. Not guru, not coach, not facilitator. This applies whether the sentence is a tooltip explanation, a closing line, a panel summary, or a footer.

### 1.2 Register

Across every surface:

- Wry over earnest.
- Concrete over abstract.
- Plain over architectural.
- Recognition over instruction.
- Observational over diagnostic.

**The plain test.** Would a 7-year-old understand the sentence? The audience is a 50s British professional, not a child, but the plainest form is what the audience accepts. Reaching for sophistication loses him. The audience tests in §1.1 catch what bounces the audience (therapy speak, self-help, American personal development); the plain test points the cleanup toward what lands.

In practice the plain test sits alongside the pub test. The pub test asks: would a man use this phrase at the pub? The plain test asks: could a 7-year-old understand it? Both must pass. A phrase that passes the plain test but fails the pub test reads as childish; a phrase that passes the pub test but fails the plain test reads as insider shorthand. The intersection is plain language a man would actually use about himself.

### 1.3 Formatting (absolute rules)

- **No em-dashes (`—`).** Use colons, semicolons, full stops, parenthetical commas.
- **No en-dashes (`–`).** Hyphens for compound modifiers; ranges expressed as "10 to 30" not "10–30".
- **British English throughout.** "Realised" not "realized." "Behaviour" not "behavior."

These rules are non-negotiable. Any sentence containing an em-dash or en-dash is an error to fix, not a stylistic choice.

### 1.4 Vocabulary: Allowed

Project vocabulary that surfaces to the man across the dashboard.

**Project framing terms:**

- narrowing, narrowed
- direction (the six directions)
- pull, pulling
- the week, the life-shape

**Architectural concepts (the canonical phrasings the predicates and term keys reference):**

- capacity strain
- stopped expecting
- between shapes
- mid-process
- held unattributed, held attributed with expression, held attributed unexpressed
- past presence
- specificity
- mattering
- expression space
- life shape duration
- sustained constraint intensity
- soured
- suppressed
- desired direction

**Life-stage values:** building, consolidating, re-evaluating, transitioning, settled, drifting, enduring.

**Week-texture values:** empty, depleted, mixed, textured, varied week.

**Direction names:** Creator, Freedom Designer, Experience Seeker, Relationship Rebuilder, Growth Focused, Contributor.

**Domain names:** Time as yours, Energy as resource, Felt aliveness, Body, Curiosity, Making, Conversation depth, Being known, Friendship, Intimacy, Mattering, Spiritual.

**Narrowing band names:** Structure, Variety, Wanting, Identity, Energy, Relationships, Attention.

**Plain observational verbs that read naturally:**

- sits (how X sits for him)
- runs (the bands run high)
- stack up (when several things stack up)
- press in, pressing in
- carry, carrying
- holding (something held)
- catching up (the surrounding readings haven't caught up)
- reads / reading (allowed in dashboard prose; not in tooltips: see Part 2)

### 1.5 Vocabulary: Not allowed

**These lists name registers to avoid, not words to avoid in all uses.** Most of the words below have legitimate everyday meanings. The ban is on the tainted register, not the lexical item. Where a word has both an everyday meaning and a self-help or therapy register, the everyday meaning is fine; the pub test in §1.1 is the arbiter. "He discovered the leak in the boiler" passes; "discover your authentic self" does not. "He wasn't ready to retire" passes; "ready to start your journey" does not. The lists below are guidance; the pub test and the audience tests in §1.1 are authoritative.

**Brand-rejected scripts (named explicitly by the WAEL position):**

The brand explicitly rejects four replacement scripts: hustle, purpose, reinvention, therapy theatre. These four registers are the system's "enemy" and surface across multiple categories below; they are listed here as a category of their own because they are the registers the brand most strongly defines itself against.

- hustle, hustle culture, grind
- purpose, sense of purpose, find your purpose, purposeful
- reinvention, reinvent yourself, new chapter (as transformation register)
- therapy theatre (performative vulnerability; performative self-disclosure)

**Therapy and counselling register:**

- process of, journey of
- sit with, lean into, work through
- holding space, safe space
- inner work, shadow work
- triggers, triggered
- attachment, attached (as therapy terms; the everyday meaning is fine)
- regulation, dysregulation
- presenting (as in "presenting concern")

**Words to use carefully (everyday OK, therapy register not):**

The words "feeling," "feelings," "felt," "experience," "experienced," and "sense" are fine in everyday usage and pass the audience test. "He felt stretched thin." "The experience of the week running empty." "A sense that something has narrowed."

What does not pass is the clinical compound register: "feelings of anxiety," "experiences of overwhelm," "a felt sense of," "the lived experience of," "experiencing feelings of X." The compound constructions read as counselling vocabulary; the simple everyday uses do not.

Test: would a man speaking to a friend at the pub use this phrase? "I've been feeling stretched" passes. "I'm experiencing feelings of being stretched" does not.

**Self-help and motivational:**

- discover, embrace, unlock
- potential, your potential
- growth mindset, fixed mindset
- authentic, authenticity, your true self
- empowered, empowerment
- holding you back, what's holding you back
- ready to, ready for
- next chapter, this chapter of life

**American personal development:**

- intentional, intentionality
- showing up, show up for yourself
- doing the work
- vibe, energy (as in "low energy" register)
- mindset
- abundance, scarcity (as registers)
- vulnerability (when used as a virtue)

**Architectural shorthand that doesn't belong in man-facing prose:**

- arc (life-arc, arc of his life)
- axis, dimension, vector (when used metaphorically)
- compounding, compound
- consolidation, consolidating (as architectural verbs)
- categorical, categorical compression
- subjective relationship to X
- architectural shape, architectural reading (the compound phrases as set expressions; the dashboard frame already establishes that the architecture is reading, so the man does not need the compound restated inside a sentence he is reading)
- predicate, firing, matching, scanning (engine vocabulary)
- "the man's X" as a noun phrase substitution

**Note on "the architecture" as a noun.** The bare noun "the architecture" is the dashboard's name for the shape of the man's life as the system has read it. It is the project's metaphor and the noun the panel headings and overall framing establish. In dashboard prose (§2.2) it is allowed as a sentence subject ("The architecture is in place. Getting on with it."). The set expressions above (architectural shape, architectural reading, the architecture's reading) and the noun used inside tooltip explanations are forbidden; the tooltip's job is to translate the dashboard vocabulary into plain language, so reproducing the bare noun there creates a feedback loop. See §2.1 and §2.2 for the surface-specific rules.

**Fluffy or soft register:**

- meaningful, meaning (when used loosely; "mattering" is the canonical term)
- truly, deeply, profoundly
- beautiful, powerful (as descriptors of internal states)
- whole, wholeness
- aligned, alignment

**System voice:**

- "this suggests," "indicates," "demonstrates"
- "what this means for you is"

**Imperative voice:**

- consider, try, remember to
- ask yourself, notice

(Note: imperative voice is conventional in error-state copy. See Part 2.)

### 1.6 Length defaults

- Short. The man is reading on a dashboard, not a longform essay.
- Any sentence that runs more than ~20 words probably needs splitting.
- Two short sentences is almost always better than one long one.

Surface-specific length guidance is in Part 2.

### 1.7 Pronoun usage by surface

Three voices operate across WAEL surfaces. Each surface uses the voice that fits its function.

**Pronoun-free observational prose.** The architecture observes the man; the prose describes a state of affairs; the man supplies himself implicitly. Used in: direction card per-direction sentences, architectural state panels (current shape, week's texture, what's heavy, what's reduced, narrowings observation sentences), closing observation. Example: "Wants and desires get heavily filtered." "Contact has thinned. Even the close ones feel more managed than present." "Paid work reads functional."

**Direct address (second-person).** The system speaks to the reader. Used when the architecture is addressing the man about a specific finding or orientation. Used in: surfaced findings on cards ("You didn't name this one, but the architecture reads it firing"), panel-heading explanatory tooltips ("How your work and life are sitting at the moment"). Used sparingly; the surface should justify direct address.

**Third-person about the man ("he", "him", "his").** Avoided as a default voice. Reads as the system describing him from outside, putting distance between him and his own reading. Two narrow exceptions: the canonical phrasings exempted per §3.1 (e.g., "the role is who he is everywhere"), and contexts where pronoun-free phrasing produces awkward or ambiguous prose. Default to pronoun-free; reach for second-person before reaching for third-person.

**Note about register discovery.** This principle emerged from observation of real surface needs across multiple cleanup passes. The pronoun-free rule of the original §7.0 was inferred too narrowly; surfaces using second-person (surfaced cards, panel tooltips) demonstrated that some kinds of addressing require it. The three-voice principle codifies what the surfaces have shown.

---

## Part 2: Surface-specific conventions

The universal principles in Part 1 apply across all surfaces. The conventions in this part are additions or modifications that apply only to specific slots.

### 2.1 Tooltip term explanations (§6.8)

The popovers that appear when the man taps or hovers on an underlined term in the dashboard.

**Voice:** Defaults to pronoun-free observation, per §1.7. Second-person is permitted when addressing the reader directly (e.g., for orientation-focused tooltips). The pronoun-free rule for dashboard prose applies here as the default; second-person is the permitted exception when the surface justifies direct address.

**Forbidden in this surface specifically:**

- "reading," "reads" (this verb lives in dashboard prose; using it inside a tooltip that's supposed to explain a term creates a feedback loop where the tooltip leans on the vocabulary it's supposed to explain).
- "the architecture" as a noun. Same reason.
- "Reading:" as a colon-prefix opener. (This works in panel summary slots; not in tooltips.)

**Length:**

- One short sentence is the default.
- Two short sentences when the second carries genuine additional information (a disambiguation, a recognition handle, a specific concretisation).
- Three sentences only with deliberate exception (see the Spiritual anchor below).

**Purpose:** Translate the project vocabulary into plain language. The tooltip is a moment of explanation; it sits alongside the dashboard prose and helps the man recognise what the underlined term means.

**Anchors:**

`paid work (relationship)`

> Before: "The man's subjective relationship to paid work, distinct from work hours and from capacity strain."
>
> After: "How paid work sits for him: whether it's chosen, endured, consuming, or just functional. Different from how many hours he works."

`Structure (narrowing)`

> Before: "Reading: the structural pressure of his life-shape: load, time, permission, life-stage compounding."
>
> After: "How much his life itself is pressing in: work load, time pressure, what he's allowed to do, where he is in life. The more these stack up, the heavier it gets."

`Identity (narrowing)`

> Before: "Reading: how much the role shapes who he is across contexts."
>
> After: "How much the role he plays at work has become who he is everywhere else, including with old friends, family, on his own."

`Spiritual (domain)` (three-sentence exception)

> Before: "Reading: whether his life has a felt religious or spiritual axis: a tradition, God, or a private frame he would name as spiritual. Not whether his hobbies have meaning, not whether his practices read as contemplative from outside; whether he himself would say I am religious or I am spiritual."
>
> After: "Whether he'd actually call himself religious or spiritual. A tradition, a faith, or a private frame he names that way. Not whether his hobbies feel meaningful, not whether his routines look contemplative from outside."

### 2.2 Dashboard observational prose (most of §7.x)

The sentence libraries that render the architectural readings as prose: pattern paragraph (§7.1), life-texture summary (§7.5), life-texture pattern note (§7.6), expression space caption (§7.7), domains intact callout (§7.8), comparison surface summary (§7.10), life-stage summary (§7.11), work-load summary (§7.12), sociality summary (§7.13), narrowing summary (§7.15).

**Voice:** Pronoun-free observational, per §1.7. Gerunds, direct observations, or noun-phrase readings. No second-person "you" except where the user's own words are quoted back.

**Allowed in this surface specifically:**

- "reading," "reads" as the project's framing verb. "The week reads empty." "All seven readings sit at high." "Paid work reads consuming."
- "Reading:" as a colon-prefix opener in panel summary slots that use it consistently (life-stage summary §7.11 is the established example).
- "the architecture" as a bare noun sentence subject. The dashboard's framing makes the noun concrete: the man reads "the architecture is in place" as a metaphor for his life-shape being set up, established by the panel headings and the overall framing of the dashboard. This usage is allowed only in dashboard prose, not in tooltip explanations (see §2.1).
- Multi-sentence entries where the architectural reading needs to compose more than one observation.

**Length:** Typically one to three short sentences per entry. The pattern paragraph entries (§7.1) carry more weight than other panel summaries and may run longer. Single-line panel summaries (life-stage, work-load, sociality) sit at one or two sentences.

**Pattern discipline within a library:** Sibling entries within a single library use the same sentence pattern as far as possible. Mixing two or three patterns within one library is a register inconsistency (the validator's report flagged this in §7.12). Pattern alignment is part of the cleanup work.

### 2.3 Direction card summaries (§7.2) and closing lines (§7.3)

**Voice:** Pronoun-free observational. Single short observation per entry.

**Length:** One sentence. Closing lines are particularly short (they sit below the cards as a single line of architectural reading).

### 2.4 Permission sub-shape lines (§7.4)

**Voice:** Pronoun-free observational. The library uses a gerund-led pattern ("Wanting that isn't being let in," etc.) for three of four entries. The fourth entry (`present`) describes the absence-of-block case; its pattern break is acceptable if the structural difference warrants it.

**Length:** One sentence.

### 2.5 Comparison surface item templates (§7.9)

**Voice:** Pronoun-free observational with substitution placeholders. The templates carry placeholders for `{item_label}`, `{direction_display}`, `{constraint_display}`, `{flag_absence_phrasing}`, etc. The substituted strings must compose grammatically with the template (a finding the validator flagged for §6.20 phrasing alignment).

**Length:** Each item renders as one short observation, sometimes with a tally suffix on the first Surfaced item only ("Not in the named list.").

### 2.6 Recognition paragraph combination sentences (§3.2) and per-direction meaning sentences (§3.3)

**Voice:** Third-person plural type voice ("Creators need...", "Freedom Designers value..."). This is the only surface that uses this voice convention. The voice names the type, not the man.

**Length:** Recognition sentences (§3.2) are two to three sentences per combination. Per-direction meaning sentences (§3.3) are one to two sentences per direction.

### 2.7 Headlines (§4 / §5.1)

The situation-naming line at the top of the dashboard. Examples: "All seven readings sit at high." "Two specific directions held: making, contribution." "A desired direction named: relationship rebuilder."

**Voice:** Pronoun-free observational, per the dashboard prose convention.

**Length:** One short sentence. The headline sits at the top of the dashboard and frames everything below; brevity is the point.

**Tone:** The headline reads as architectural observation, not as summary or interpretation. It names what the architecture has read; it does not editorialise.

### 2.8 Static copy (panel headings, loading state)

**Voice:** Short observational phrases or invariant text. Panel headings are noun phrases ("The seven dimensions," "What's heavy," "Named and surfaced").

**Length:** Heading-length.

### 2.9 Error state copy

**Voice:** Second-person imperative conventional. This is the only place on the dashboard where direct address ("Refresh and try again") is acceptable. Error-state UIs across the wider software world use this register; the audience will read it as conventional rather than as the kind of instruction the brief otherwise forbids.

**Length:** Short. Two sentences typically.

### 2.10 Display labels for engine values

The short labels rendered into card fields, panel chips, and band rows. Examples: the four constraint band labels (full, moderate, heavy depletion, etc.), the six pull-quality tokens (real, desired direction, etc.), the four pull tokens (peripheral, present, active, dominant).

**Voice:** Plain. One to three words typically.

**Forbidden:** Architectural shorthand. The label "depleted" passes; the label "compressed state" does not. The label "consuming" passes; the label "subjective relationship: consuming" does not.

**Discipline:** Display labels and term keys may share form but they are distinct surfaces. The term key is the tooltip target; the display label is the rendered chip text. Where the engine value name reads naturally as a label, the display label is the engine value name capitalised. Where it does not (e.g., `never_been_part_of_his_life`), the display label is a plain-language form ("Never been part of life").

**Parenthetical qualifiers:** Display labels do not surface parenthetical qualifiers. The canonical term keys carry the parenthetical for tooltip lookup (e.g., `Structure (narrowing)`, `Empty (week)`, `Spiritual (domain)`), but the displayed label renders the plain name only ("Structure", "Empty", "Spiritual"). Panel context disambiguates; the parenthetical is redundant to the reader. The TermIndicator's `:term` prop maps the displayed plain label to the canonical key for explanation lookup.

### 2.11 Token fallback strings

**Voice:** Short, structural, minimal. Token fallbacks are the system's graceful-degradation forms when an authored sentence does not fire ("Bands reading: 3 high, 4 moderate, 0 low."). They read more system-y than authored prose; this is by design.

**Length:** Single line, minimal.

These fall under the universal principles (no em-dashes, British English, no forbidden vocabulary) but the surface is genuinely structural rather than expressive.

---

## Part 3: Process notes

### 3.1 Dispositions to apply during rewrite work

Two items resolved by project lead direction; recorded here as authority for any rewrite work that uses this brief.

- **The two term-key forms embedding "he"** (`the role is who he is everywhere`, `mostly absent in the relationships he has`) stay as the canonical phrasings the predicates reference. The embedded pronouns are exempted under §1.7 as canonical phrasings.
- **The §6.8 declaration text** in SYNTHESIS.md is edited to reflect that the pronoun-free convention does not apply to tooltip explanations. The declaration edit happens as part of the §6.8 rewrite work.

One item remains open and is decided per-entry:

- **Cross-references between tooltips.** When a tooltip's explanation naturally references another term that has its own tooltip (for example, the spiritual entry mentions "meaningful" which could be confused with mattering), whether to cross-link explicitly or rely on the man's reading. Per-entry judgement.

### 3.2 Using this brief for editorial work

- The brief is the calibration target. Each rewrite is checkable against the universal principles in Part 1 and the surface-specific conventions in Part 2.
- For editorial passes over multiple entries (sweeping §6.8, sweeping a §7.x library, reconciling worked examples), a calibration sample of three or four entries gets rewritten and project-lead-reviewed before the full sweep proceeds. The calibration confirms the brief's register lands.
- The brief is a living document. If rewrite work surfaces words that should be added to the allowed or not-allowed lists, or if a category of entry needs guidance the brief doesn't carry, the brief gets updated rather than the rule getting bent.

### 3.3 What this brief does not govern

- Architectural prose in the specs themselves (rules, predicate definitions, computation order, rationale paragraphs, honest concerns lists, fixture validation logic). The specs are written for engineering reading; their register is technical, not man-facing.
- Code identifiers and internal names (engine value names, predicate identifiers, type names, variable names). These are engineering surface; their register is consistency and clarity for developers.
- Test fixture content (input.json, expected.json, expected_synthesis.json). Structural data, not man-facing prose.
