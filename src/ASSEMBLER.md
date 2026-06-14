# WAEL v2 — Build-Ready Spec (Distilled)

This distilled spec is the CANONICAL build source. The earlier master document is a frozen reasoning
archive and is NOT maintained against build changes; where they differ, this document wins. Field
names, enums, and the InputMap structure remain design-asserted and must be verified against the
actual engine code before the assembler is built.

This is a tightened, build-ready extraction of the WAEL v2 Master Build Document. It contains the
imperative spec plus the build-time actions and constraints, scope-tagged. Avatar names, fixture
results, test methodology, and "why we believe this" justification have been removed (a summary of
what was stripped is at the end). Derivation tables and consistency-check logic are reproduced
**verbatim** — they are deterministic and must not be paraphrased.

---

## ⚠️ VALUE-VERIFICATION CAVEAT (read first)

**All field names, enum spellings, and the InputMap structure in this spec are DESIGN-ASSERTED.**
This is a design document, not the contract. The real contract is the engine's actual type and
validation source (location to be found during the verification pass — do not assume a filename).
Design docs have drifted from code in this project.
Before/during build, **every** field name, enum value, key spelling, and the InputMap shape below
**MUST be verified against the actual engine code.** Where this spec and the engine disagree, the
engine wins.

**All numeric cut-points are PROVISIONAL and tunable.** They were fitted to synthetic avatars and
must be recalibrated on real respondents. Treat every threshold as a *named, tunable parameter held
in one place*, not a constant. Hold the structure loosely too — real respondents may break the
taxonomy, not just the numbers.

---

## Governing principle

WAEL measures **AGENCY, not desire.** Ask the man to describe his life in observable, behavioural
terms; **DERIVE** internal states (how strongly he wants, what absence costs, where he sits in his
arc) in the assembler. Never ask a numb man to self-diagnose. The core population is FLAT, NUMB men.
Everyone else is an edge case: apply an edge fix only if it helps the core, or handles an edge at
zero cost to the core.

**Boundary rule (load-bearing):** the ENGINE scores; the ASSEMBLER maps, derives, and flags.
**Consistency flags NEVER mutate the InputMap the engine sees.** The triad triangulation and all
checks live in the assembler, not the engine. This keeps the engine a pure, deterministic function
over a fixed input contract.

**Determinism requirement:** Derivations and checks must be implemented as **deterministic code, NOT
free LLM re-derivation.** Loose re-derivation was observed to get them wrong. Follow the tables
literally.

---

## Architecture / data flow `[ASSEMBLER]`

```
Questionnaire answers
   -> Assembler:  (a) MAP observable answers to InputMap fields
                  (b) DERIVE the 6 internal fields (stated_strength, felt_cost, saturation,
                      domain wanting, life_stage, would_reach_for)
                  (c) RUN 9 consistency checks -> emit flags (never mutate the InputMap)
   -> Engine:     pure scorer over the validated InputMap (defined in ENGINE.md; NOT built here)
   -> Synthesis / Render / Experience (NOT built here)
```

## Assembler build order `[ASSEMBLER]` (derivations depend on earlier blocks — follow exactly)

1. Build `domains` first (needed for the vitality term in felt_cost).
2. Build observable per-direction fields (movement, recent_action, past_presence, specificity,
   anticipation, stopped_expecting, would_reach_for).
3. Derive per-direction internal fields (stated_strength, felt_cost, saturation).
4. Build `cross_direction` (including derived life_stage).
5. Build `constraints`, `cross_cutting`, `self_report`.
6. Run the 9 consistency checks; emit `{input_map, reach_confidence, consistency_flags}`.

> **BUILD-TIME ACTION:** `compute domains BEFORE felt_cost` — felt_cost needs the vitality term
> (mean of all 12 domain current_state values). This ordering is load-bearing.

## Keys

Six DIRECTION keys (Part C card order): `contributor`, `experience_seeker`, `freedom_designer`,
`growth_focused`, `creator`, `relationship_rebuilder`.

Twelve DOMAIN keys: `time_as_yours`, `energy_as_resource`, `felt_aliveness`,
`body_physical_aliveness` (these four are **UNIVERSAL** — omit their `wanting` field), `curiosity`,
`making`, `conversation_depth`, `being_known`, `friendship`, `intimacy`, `mattering`, `spiritual`
(spiritual `wanting` is **MANDATORY**).

---

# QUESTIONNAIRE — questions, options, mappings `[QUESTIONNAIRE]` + `[ASSEMBLER]` (MAP)

Each entry: exact question + options shown to the man, then MAP (answer → InputMap field/value),
then ENGINE (what the engine does — for context only; engine not built here).

**Intro page** (non-answering content)
A content-only "Before you start" page renders FIRST, before q1a/q1b. It produces no answer and feeds nothing to the assembler/engine. Represented as a page with kind='content' and an empty questions array in the manifest.

### Q1 — week_shape (nine booleans)
Q: Think about a normal week, not a one-off. Tick whatever is true of most weeks. (Tick any, or none.)
- a) A regular thing outside work and home: a class, a club, a league, a standing session
- b) Seeing people you like, in person, beyond the house
- c) Making something: building, writing, music, cooking as a craft and not just dinner
- d) Your body working on purpose: a proper walk, the bike, the gym, sport, physical graft
- e) Something you belong to: a team, a congregation, a cause, a group
- f) Something you do on your own for its own sake: reading properly, an instrument, the garden
- g) Work runs long: over fifty hours, or it comes home with you most nights and weekends
- h) Weekends mostly go on family, the house, the admin, the caring
- i) No two weeks look the same

MAP: nine booleans, true iff ticked. a=weekly_activity, b=sees_people, c=makes_things, d=active_body,
e=belongs_to_group, f=solo_practice, g=work_dominates, h=weekends_consumed, i=varied_week.
→ `cross_direction.week_shape`.
ENGINE: derives life_texture_band and per-direction expression_space. **All nine must be present
booleans — engine hard-fails on a missing flag; no silent false.**

### Q2 — primary_load
Q: What is taking the most out of you at the moment? If it is more than one, pick the biggest.
- a) Work  b) Looking after someone  c) The house and the admin  d) Nothing much has a real claim on me

MAP: a=paid_work, b=caregiving, c=household_admin, d=none. → `cross_direction.primary_load`.

### Q3 — paid_work_relationship
Q: Work, as it actually runs. Which is nearest? (Pick one.)
- a) It stays at work. When I am out, I am out
- b) It follows me home some nights or weekends
- c) It takes up most of my waking life, the hours and the head space both
- d) I am between things at the moment
- e) It is mine by choice. I would take it on again
- f) It is just a job on the side now, not the point of my life
- g) That part of my life is behind me now. I am retired or no longer working

MAP: a=functional, b=consuming, c=defining, d=between, e=chosen, f=peripheral, g=peripheral.
→ `cross_direction.paid_work_relationship`.
NOTE: g (retired) maps to **peripheral NOT between** (between misreads a settled retiree as
transitional). `endured` is unreachable from Q3.
> **ENGINE-SIDE RECOMMENDATION (not our change):** engine has no `retired` value; recommend it adopt
> one.

### Q4 — life_shape_duration
Q: How long has your life been roughly the shape it is now? (Pick one.)
- a) Under a couple of years  b) Two to five years  c) Five years or more

MAP: a=recent, b=sustained, c=long. → `cross_direction.life_shape_duration`. Feeds life_stage
derivation and the enduring-and-long rule.

### Q5 — recent_life_shape_change + replacement_structure_exists
Q: In the last year or three, has a big part of life ended or changed: a job, a role, the caring, the
kids leaving? And if so, has anything real grown into the gap? (Pick one.)
- a) Nothing much has ended or changed
- b) Something ended, and something real has grown into the gap
- c) Something ended, and nothing has filled it yet

MAP: recent_life_shape_change: a=no, b=yes, c=yes. replacement_structure_exists: b=yes, a=no, c=no.
→ `cross_cutting.recent_life_shape_change` (RECENT by design, ~1–3yr) and
`cross_cutting.replacement_structure_exists` (ignored by scoring when recent_life_shape_change=no).

### Q6 — capacity_strain
Q: Right now, is there more being asked of you than you can manage? (Pick one.)
- a) No, I have got the room for what is on me  b) Tight, but I manage  c) Yes, more than I can keep up with

MAP: c=yes; a or b=no. → `cross_direction.capacity_strain`.
ENGINE: fires as `capacity_strain=Yes AND pull[d]>=50` — the engine supplies the "wants more" half via
pull, so this one-sided overload question is correct.
> **BUILD-TIME ENGINE-USAGE CHECK:** Q6 looks one-sided vs a two-sided definition, but it is correct
> *because the engine pairs it with pull[d]*. Verify engine USAGE, not just the definition line,
> before "fixing" this.

### Q7 — sociality_default
Q: Outside your partner or family, do you prefer your own company, or the company of others? (Pick one.)
- a) My own company  b) The company of others  c) A genuine mix

MAP: a=solitary_by_default, b=social_by_default, c=balanced. → `cross_direction.sociality_default`.
TEMPERAMENT (not recharge, not loneliness). Lowest-evidence field — mark `low_confidence` (CHECK 8).

### Part C — the six area cards
Answer one card per area, in order: contributor, experience_seeker, freedom_designer, growth_focused,
creator, relationship_rebuilder. Each card has three parts (a, b, c). **Part c is GATED: skip it if
card-b = "does nothing for me".**

**CARD a) current_movement + recent_action**
Q: What does this actually amount to in your life right now? Not what you would like. What is there.
- a) Nothing, really  b) The odd bit, here and there  c) Been picking it up again lately  d) A proper part of my weeks

MAP: current_movement: a=0, b=33, c=67, d=100. recent_action: a=none, b=some, c=recent, d=recent.

**CARD b) anticipation (the felt question)**
Q: Picture a bit more of it in your life. What is the honest reaction? First one, do not think about it.
- a) Does nothing for me  b) Wouldn't mind that  c) That one I would genuinely want

MAP: a=none, b=mild, c=quickening.

**CARD c) specificity (gated: skip if b = "does nothing for me")**
Q: Is there an actual thing in mind, or just the general idea? (Pick one, or skip.)
- a) Just the general idea  b) A vague notion  c) Yes, a specific thing I keep coming back to

MAP: a=none, b=partial, c=strong; if skipped (b was "does nothing") = none.

ENGINE (all three cards): per-direction current_movement (0–100), recent_action
(none/some/recent), anticipation (none/mild/quickening), specificity (none/partial/strong).
**anticipation is the single load-bearing felt read; drives pull, felt_cost, saturation,
stated_strength.**

### Q8 — past_presence (per direction)
Q: Which of the six areas have ever been a real, active part of your life, at any point, whether or
not they still are? Count it if it was once genuinely there, including through your work (a career of
building, managing, or looking after people counts as doing things for others). (Tick any, or none.)

MAP: ticked = past_presence yes, others = no. → per-direction `past_presence`.
ENGINE: gates felt_cost (past=no routes felt_cost to a 15 floor unless an emerging-want rule
overrides) and stopped_expecting coherence.

### Q9 — stopped_expecting (per direction)
Q: Now tick the ones you've moved on from, even though, secretly, there's a spark still there.
Help: From the ones you ticked above - the ones you've let go of, but not quite completely.

MAP: ticked = stopped_expecting yes, others = no. → per-direction `stopped_expecting`.

### Q10 — direction_chosen + would_reach_for
Q: Say a Saturday comes free. Nothing owed to anyone, nobody needing anything. What do you actually
end up doing? First honest answer, not the sensible one. (Pick one.)
- a) Something useful for other people
- b) Something new, somewhere I have not been
- c) Time that is properly my own, however I want it
- d) Getting better at something, learning
- e) Making something: building, writing, fixing, playing
- f) Time with the people who matter, the unhurried sort
- g) Nothing in particular. Rest. I am tired enough as it is
- h) Could not tell you. Nothing springs to mind

MAP: a–f = the six direction keys, g=rest, h=none → `cross_direction.direction_chosen`.
would_reach_for: yes for the chosen direction, no for all other five (g/h ⇒ all six no).

### Q10b — triangulation variant (retrospective)
Position: separated from Q10, near Q29. Q: Think back to the last time you had a free stretch that was
genuinely yours. What did you find yourself drawn to, even if you did not get round to all of it?
(Same 8 options a–h as Q10.)
MAP: capture as one of the 8 outcomes; write `cross_direction.reach_retrospective` via the same
interpretation as Q10a. Also feeds reach_confidence + CHECK 1.

### Q10c — triangulation variant (counterfactual)
Position: separated, before Q34. Q: If you were handed an extra day next week that nobody knew about,
so nothing was expected of you and nothing followed from it, what would you want to point it at?
(Same 8 options a–h as Q10.)
MAP: capture as one of the 8 outcomes; write `cross_direction.reach_counterfactual` via the same
interpretation as Q10a. Also feeds reach_confidence + CHECK 1.

### Q11 — psychological_filtering (three probes: q11a_spare_resource, q11b_footprint, q11c_small_wants)

**Q11a — spare-resource reflex probe**
Q: Say you won a hundred quid, or got an unexpected day off - what tends to happen?
- a) I'll usually put it toward something I'd actually enjoy
- b) I think about it, but it tends to go on something sensible or for someone else
- c) It goes on the practical stuff almost without thinking - using it on myself doesn't really come up

**Q11b — footprint / naming a want probe**
Q: What do you actually want for yourself these days? Not for work, not for anyone else - just you. Could you put your finger on it?
- a) Yes - I know what I want
- b) I'd have something, but I'd need to think
- c) I'd struggle, honestly - I'm not sure I could put my finger on anything

**Q11c — fate of small wants probe**
Q: Think about the last few times you wanted something for yourself - even something small. What tends to happen to it?
- a) I'll generally go after it
- b) I talk myself out of it, or it slides down the list behind everything else
- c) I tend to decide I don't really need it, often before I've even properly considered it

MAP: each probe letter maps via `mapPsychologicalFilteringProbe` (a=does_not_filter, b=filters_some, c=filters_pervasively). The three readings are combined by `combinePsychologicalFilteringProbes` using the following rules:
- Rule 1: footprint (q11b) == 'c' is decisive on its own → filters_pervasively
- Rule 2: Majority of the three per-probe readings (>=2) wins → does_not_filter / filters_pervasively / filters_some
- Rule 3: No majority / tie / three-way split → conservative middle → filters_some
→ `cross_direction.psychological_filtering`.
**The engine REQUIRES this field, so it MUST be populated.** "Experimental/low-confidence" means
nothing load-bearing downstream should lean on its value — NOT that it is withheld from the engine.

### Q12–Q23 — domain current_state (nine 0–100 sliders, grouped by kind)
The nine slider domains are rendered on three pages grouped by kind. Each slider carries inline per-slider label + minLabel + maxLabel in the manifest.

**Page: domain-sliders-felt** (felt_aliveness, curiosity, mattering)
- felt_aliveness: "How alive life feels" (Pretty flat / Properly alive)
- curiosity: "Whether things still spark your interest" (Nothing much grabs me / Plenty still grabs me)
- mattering: "Whether what you do feels like it counts" (Doesn't feel like it matters / Feels like it really counts)

**Page: domain-sliders-resources** (time_as_yours, energy_as_resource, body_physical_aliveness)
- time_as_yours: "How much your time feels your own" (None of it feels mine / Most of it feels mine)
- energy_as_resource: "Whether you've got the energy to draw on" (Running on empty / Plenty of go)
- body_physical_aliveness: "How your body feels in itself" (Letting me down / Feels good)

**Page: domain-sliders-presence** (intimacy, making, spiritual)
- intimacy: "Someone you're really close to" (No one that close / Someone I'm properly close to)
- making: "Making things, or mostly taking them in" (Mostly take it in / Make things myself)
- spiritual: "Faith, or a spiritual side to life" (Not part of my life / A real part of my life)

Q: For each, a number 0–100. 0 = absent from your life, 100 = fully present. How things are now.

| Domain key | Label shown |
|---|---|
| time_as_yours | How much your time feels your own |
| energy_as_resource | Whether you've got the energy to draw on |
| felt_aliveness | How alive life feels |
| body_physical_aliveness | How your body feels in itself |
| curiosity | Whether things still spark your interest |
| making | Making things, or mostly taking them in |
| intimacy | Someone you're really close to |
| mattering | Whether what you do feels like it counts |
| spiritual | Faith, or a spiritual side to life |

**Relational domains (friendship, conversation_depth, being_known) are derived from single-select questions, NOT sliders:**

**Q_friendship_count — friendship current_state**
Q: Friends - the real sort. Not family, not your partner, not people you only know through work. People you would choose to see. How many have you got, honestly?
- a) None really, not these days
- b) One or two
- c) A handful or more

MAP: a=15, b=50, c=80 → `domains.friendship.current_state`.

**Q_depth_known — conversation_depth + being_known current_states**
Q: Most talk is just the day-to-day - what needs doing, who's where, or even just banter with your mates. With the people close to you, does it ever go deeper than that?
- a) Honestly, not really - it mostly stays at that
- b) Yes, we get into the real stuff - what's actually going on, not just the surface
- c) Yes, and there's someone I can be properly open with - who really knows what I'm like underneath

MAP: a→{conversation_depth: 25, being_known: 25}; b→{conversation_depth: 75, being_known: 40}; c→{conversation_depth: 75, being_known: 80}.
→ `domains.conversation_depth.current_state` and `domains.being_known.current_state`.
**Note:** the b-row has conversation_depth intact (75) while being_known reduced (40 fires) — this captures "present but distracted" vs "hollow".

**Remaining domains (time_as_yours, energy_as_resource, felt_aliveness, body_physical_aliveness, curiosity, making, intimacy, mattering, spiritual):**
MAP: slider value → `domains.<key>.current_state`.

ENGINE: each drives domain fires, vitality (the MEAN of all 12, used in felt_cost), and life_texture.
> **CAVEAT (watch at respondent testing):** Q23 wording ("something larger: faith, the
> contemplative") is looser than the engine's strict reading of `spiritual` (man self-identifying as
> religious/spiritual). May over-capture. Confirm the wanting derivation does not mis-fire for a man
> who marked a moderate current_state on a broad reading.

### Q24 — domain past_presence
Q: Which of these were once an active part of your life?
Help: This time, the feel of life rather than the doings - what your life used to have in it. Tick any, or none.
MAP: listed = past_presence yes, others = no → `domains.<key>.past_presence`.

### Q25 — energy_availability
Q: A normal week. On how many nights do you actually have something left in you, enough to do
something of your own rather than just get through to bed? (Pick one.)
- a) None, really  b) Maybe one  c) A couple  d) Three or four  e) Most nights

MAP: a=10, b=30, c=50, d=70, e=90 → `constraints.energy_availability`. [PROVISIONAL bands]

### Q26 — time_availability
Q: Time, not energy. Across a normal week, how many of your hours are genuinely your own, not already
spoken for by work or other people? (0 to 100.)
MAP: value → `constraints.time_availability`.

### Q27 — body_capacity
Q: Your body, in practical terms. Which is nearest to what you can still actually do? (Pick one.)
- a) Whatever I want  b) Most things, though I notice it more than I used to  c) The everyday is fine,
  but the demanding stuff is going or gone  d) It sets real limits on an ordinary day now

MAP: a=85, b=65, c=45, d=25 → `constraints.body_capacity`. [PROVISIONAL bands]
> **CALIBRATION NOTE:** men minimise physical decline ("not too bad, the old hip"); Q27 wording may
> need to get past the "mustn't grumble" reflex, since this is the single field that marks a
> body-narrowed man.

### Q29 — recent_reaching (+ input to life_stage derivation)
Q: Lately, have you been reaching for something of your own: starting something, trying to change
something, or picking an old thing back up? (Pick one.)
- a) Yes, and it is still new and unsettled. I have not really told anyone
- b) Yes, and it has settled into a regular part of my life by now
- c) Yes, it is something from the past I have come back to, an old hobby or interest
- d) No, nothing like that at the moment

MAP: recent_reaching: a=recent_and_awkward, b=mid_stream, c=long_established, d=no_current_reaching.
→ `cross_cutting.recent_reaching`. (Also an input to the life_stage derivation — see Derivations.)

### Q30 — permission + permission_sub_shape
Q: The last thing you fancied doing but didn't do, big or small. Looking back, what actually happened?
- a) Just did not fancy it in the end. No real argument either way
- b) I wanted to but I never actually got round to it
- c) I wanted to, but I never said anything or made it a thing, so it came to nothing
- d) Barely got as far as thinking about it before "I do not need that" shut it down
- e) Honestly, I can't think of a recent time I wanted something just for myself

MAP: via `interpretQ30`:
- a=permission 70 + present
- b=45 + act_block
- c=40 + say_block
- d=25 + want_block
- e=25 + want_block (SAME pair as d; surface-distinct wording, identical engine effect)
→ `constraints.permission` and `constraints.permission_sub_shape`.
ENGINE: permission_sub_shape (when permission<70) governs the suggestion type downstream:
want_block → "let yourself want it"; say_block → communication/naming step; act_block → small
actionable step.
> **CALIBRATION WATCH:** say 40 vs act 45 nearly equal. [PROVISIONAL]

### Q31 — role_consolidation
Q: People often come across differently in different parts of life - a bit of a different bloke at work, at home, off on their own. How about you? (Pick one.)
- a) Pretty much the same whoever I'm with, wherever I am
- b) A bit different depending where I am, but broadly the same
- c) Quite different sides of me come out in different settings

MAP: via `deriveRoleConsolidation` (consistency + activity cross):
- c (different sides) → holds_other_selves
- b (a bit different) → role_inflected
- a (same) → split on activity (>=2 direction cards with card-a in {c,d}, NOT b):
  - activity present → holds_other_selves
  - activity absent → role_consolidated
→ `cross_direction.role_consolidation`.
**Rationale:** consistent+active=whole (holds_other_selves); consistent+inactive=reduced (role_consolidated).
**PROVISIONAL CALIBRATION:** the {c,d}-not-b predicate and threshold-2 are the LEADING calibration, tunable against real data — NOT a final lock.
ENGINE: value space unchanged (holds_other_selves / role_inflected / role_consolidated); validation unchanged.

### Q32 — attention_pattern
Q: Last weekend. How much of it can you actually call to mind now? (Pick one.)
- a) Most of it, in some detail  b) The gist, but it blurs  c) Honestly, it is a blank. I was on autopilot

MAP: a=engaged, b=intermittent, c=autopilot. → `cross_direction.attention_pattern`.

### Q33 — relational_presence
Q: The last evening you spent with whoever you're closest to, if there's someone like that. Where were you, really? (Pick one.)
- a) I was there with them, properly (help: In it with them, not off in your own head)
- b) I was there, but half of me was elsewhere (help: There, but distracted - keeping it light, half thinking about other things)
- c) I was going through the motions (help: There in body only - saying the right things, but not really in it)
- d) Honestly, there isn't anyone I'm that close to (help: No one that close right now - different from a quiet evening, just no one it really applies to)

MAP: a=present, b=partial, c=mostly_absent, d=no_close_relationship. → `cross_direction.relational_presence`.
**Option d is INERT BY DESIGN:** the relational band uses strict equality on present/partial/mostly_absent and falls through (the new value contributes nothing; narrowing for this man comes from the relational DOMAINS, not q33). The two synthesis predicates use strict equality and exclude it. This is additive plumbing only (type union, validation whitelist, mapper) — band logic was NOT changed.

### Q34 — named_absences (the only direct self-report)
Q: If you had to say what's thin on the ground for you at the moment, what would you point to? (Pick up to three, or just "nothing much" on its own if nothing fits.)
- a) People I can count on = more_friends
- b) More time to myself = more_time_to_myself
- c) Something that is just mine = something_just_for_me
- d) Energy = more_energy
- e) Getting back into some kind of shape = getting_back_in_shape
- f) Something to look forward to = something_to_look_forward_to
- g) A proper conversation = proper_conversation
- h) Something of my own to make or build = building_or_making
- i) Something I am part of = something_im_part_of
- j) (Nothing much, things are alright) = nothing_really

MAP: each chosen option → its id; cap 3; **j (nothing_really) is EXCLUSIVE (cannot co-occur);**
empty = []. → `self_report.named_absences` (array 0–3).
ENGINE: read for the COMPARISON SURFACE ONLY — no scoring function references it. Engine validates the
exclusivity rule (rejects nothing_really + others).

---

# DERIVATIONS `[ASSEMBLER]` (computed; the man is never asked these)

> All numbers **PROVISIONAL**. Evaluate each as an **ORDERED FIRST-MATCH** table: check rules top to
> bottom, use the first that matches, stop. **Implement as deterministic code, not free reasoning.**
> Reproduced verbatim — do NOT paraphrase.

### stated_strength (per direction, 0–100)
```
1. anticipation == none -> 0
2. anticipation == quickening -> 64
3. anticipation == mild AND current_movement >= 60 -> 0  (already doing plenty; flicker is contentment)
4. anticipation == mild AND current_movement < 60 -> 30  (add 6, making 36, if specificity == strong)
```

### felt_cost (per direction, 0–100)  [compute domains FIRST: needs vitality]
```
vitality = mean of all twelve domains' current_state.
Evaluate IN ORDER 1..9, first match wins. Rule 4 (past_presence no) MUST be checked before the mild
rules 6-8, or a never-held want is wrongly costed.
1. specificity == strong AND anticipation == quickening -> 80
2. specificity == strong (and not quickening) -> 70
3. past_presence == no AND anticipation == quickening -> 55  (powerful emerging want, never previously held)
4. past_presence == no -> 15  (never held it; little lost by continued absence). Fires for ALL remaining
   past_presence==no directions, including mild ones.
5. anticipation == none -> 25
6. anticipation == mild AND stopped_expecting == yes -> 50
7. anticipation == mild AND current_movement >= 60 -> 35
8. anticipation == mild AND vitality >= 45 -> 55
9. otherwise -> 40
```

### saturation (per direction, yes/no)
```
current_movement >= 60 AND anticipation == none -> yes; else no.
```

### would_reach_for (per direction, yes/no)
```
yes for direction_chosen (Q10); no for the other five. (g/h => all no.)
```
Fully determined by direction_chosen; not independent.

### domain wanting (8 non-universal domains only; the 4 universal domains OMIT wanting)
```
doesnt_want IF past_presence == yes AND peace_discriminator == made_peace AND current_state < 60;
doesnt_want IF past_presence == no AND current_state < 30;
else wants.
```
(Present and wanting are orthogonal: high current_state does NOT imply doesnt_want.)
**SPIRITUAL is mandatory and uses this same rule; it must always carry a wanting value.**
> **BUILD-TIME CONFIRM:** confirm spiritual wanting is actually DERIVED (not merely current_state
> captured).

### life_stage (one value; derived, not asked) — ORDERED first-match
```
1. life_shape_duration == recent AND Q5 in {b,c} (something ended) -> transitioning
2. Q29 == a (recent_and_awkward reaching) -> transitioning
3. Q29 == c (resumed old hobby = long_established reaching; re-engaging, opposite of drifting) -> consolidating
4. a want surfaces (anticipation == quickening in any direction, OR direction_chosen is one of the six) -> consolidating
5. Q29 == d (no current reaching) -> enduring
6. otherwise -> drifting
```
COVERAGE NOTE: only 4 of the engine's 7 life_stage values are ever emitted (transitioning /
consolidating / enduring / drifting). building / re_evaluating / settled are never produced. This is a
deliberate principled deviation (we derive life_stage to avoid asking a numb man to self-place). Legal
(4 of 7 valid values), but those 3 engine paths are never exercised by questionnaire input.
> **BUILD-TIME CONFIRM:** confirm the 3 never-emitted life_stage values are acceptable as untested
> engine paths.

---

# CONSISTENCY CHECKS `[ASSEMBLER]` (run AFTER InputMap built, BEFORE engine)

> Each is deterministic and produces a **FLAG, never a correction. The engine never sees the flags.**
> Severity: contradiction (cannot both be true), tension (unusual but possible), low_confidence
> (thinly evidenced). Reproduced verbatim.

**CHECK 1 — Q10 triangulation (highest value; uses Q10, Q10b, Q10c)**
```
picks = [Q10, Q10b, Q10c]   // each is a direction key, rest, or none
if all three are the same direction:            reach_confidence = high            // no flag
else if all three in {rest, none}:              reach_confidence = high            // numb core confirmed; no flag
else if Q10 in {rest,none} AND (Q10b is a direction OR Q10c is a direction):
    flag("tired_or_blocked_pull", tension)
    if Q10c is a direction AND Q10 in {rest,none} AND Q10b in {rest,none}:
        note = "filtered: pull only surfaces when consequences removed"
    else if Q10b is a direction AND Q10 in {rest,none}:
        note = "tired-but-not-empty: pull was live on the last good day"
    reach_confidence = low
else if the three name different directions:
    flag("divergent_reach", tension);           reach_confidence = low
else:   // otherwise: Q10 names a direction with partial (non-unanimous) corroboration
    reach_confidence = low                  // no flag
    // high is reserved for unanimity (branch 1) or confirmed-numbness (branch 2);
    // partial corroboration is ordinary under-determination — low, but not a tension/
    // contradiction, so no flag (flagging it would dilute the flags' signal).
```
direction_chosen and would_reach_for stay set from Q10 ONLY; the variants set reach_confidence and may
flag, nothing more.

**CHECK 2 — stopped_expecting requires past_presence (per direction)**
```
for each direction d:
    if d.stopped_expecting == yes AND d.past_presence == no:
        flag("stopped_expecting_without_history", contradiction, direction=d)
```

**CHECK 3 — high movement implies past_presence (per direction)**
```
for each direction d:
    if d.current_movement >= 60 AND d.past_presence == no:
        flag("active_but_no_history", tension, direction=d)
```

**CHECK 4 — stopped_expecting vs a live want (per direction)**
```
for each direction d:
    if d.stopped_expecting == yes AND d.anticipation == quickening:
        flag("gave_up_but_still_keenly_wants", tension, direction=d)
```

**CHECK 5 — Q10 direction vs its Part C card**
```
if direction_chosen is a direction key:
    if directions[direction_chosen].anticipation == none:
        flag("chose_direction_he_doesnt_want", contradiction)
```

**CHECK 6 — recent_reaching vs behavioural trace**
```
if recent_reaching == recent_and_awkward:
    reaching_trace = any direction d where d.anticipation in {mild, quickening}
                     AND 34 <= d.current_movement <= 67
    if NOT reaching_trace:
        flag("reaching_without_trace", tension)
```
MUST exclude saturated movement (100 = established service, not a new reach). Stays tension (a very
early secret reach can be below movement 34).

**CHECK 7 — hollow mattering**
```
if mattering.current_state >= 70 AND felt_aliveness.current_state <= 35:
    flag("hollow_mattering", tension)
```
The GAP is the signal. Tells synthesis to read mattering as role-level, not felt.

**CHECK 8 — Q7 sociality low-confidence marker**
```
if sociality_default was inferred / low-evidence:
    mark sociality_default low_confidence   // advisory, not an error, not a re-ask
```
**INERT as written:** no "inferred/low-evidence" signal exists in real questionnaire input (this
trigger came from synthetic-avatar tooling). The assembler receives only Q7's a/b/c answer, with no
inferred/low-evidence affordance, so this check cannot fire unless Q7 gains an explicit
low-confidence affordance. Implement as a documented no-op until/unless that affordance exists.

> **OPEN DESIGN QUESTION:** should Q7 gain a "not sure / hard to say" option to give CHECK 8 a real
> trigger? (Owner decision — changes the instrument.)

**CHECK 9 — a strong specific want that never surfaces in the triad (per direction)**
```
for each direction d:
    if d.anticipation == quickening AND d.specificity == strong:
        if d's key is NOT among {Q10, Q10b, Q10c} outcomes:
            flag("specific_want_never_surfaces", tension, direction=d)
```
A signal to LOOK, not a verdict. Synthesis disambiguates using felt_cost, past_presence, and
external-constraint signals. With CHECK 1 this encodes: for a numb man, when Part C claims a want but
the triad stays flat, TRUST THE TRIAD.

**Build priority:** 1) CHECK 1 (core-critical). 2) CHECK 2, 3, 5 (past_presence/direction integrity;
guard the felt_cost floor; cheap). 3) CHECK 4, 6, 9 (over-read tensions). 4) CHECK 7, 8 (soft/advisory).

> **BUILD-TIME ENGINE-USAGE CHECK (rest-vs-none):** CHECK 1 treats `{rest, none}` together as the
> numb-core signal. Preserve the rest/none handling exactly as written — do not collapse or re-split
> these without checking engine usage.

---

# OUTPUT CONTRACT `[ASSEMBLER]`

```
{
  input_map: { ...the validated InputMap, EXACTLY as the derivations produced it, unchanged by checks... },
  reach_confidence: "high" | "low",          // from CHECK 1
  consistency_flags: [ { code, severity, direction?, note? }, ... ]   // zero or more
}
```

**InputMap structure** (per ENGINE.md; all keys required except wanting on the 4 universal domains —
`[VERIFY: confirm this structure, all keys, and enum spellings against the engine's actual type and
validation source (location to be found during the verification pass — do not assume a filename)]`):
```
{
  directions: { <6 keys>: { stated_strength, stated_allocation, felt_cost, anticipation, current_movement,
                            recent_action, past_presence, specificity, would_reach_for, saturation,
                            stopped_expecting } },
  domains:    { <12 keys>: { current_state, past_presence, wanting?, peace_discriminator? } },   // omit wanting for the 4 universal
  cross_direction: { week_shape{9 bools}, life_stage, sociality_default, paid_work_relationship,
                     primary_load, psychological_filtering, role_consolidation, attention_pattern,
                     relational_presence, capacity_strain, life_shape_duration, direction_chosen,
                     reach_retrospective?, reach_counterfactual? },
  constraints: { energy_availability, time_availability, body_capacity, permission, permission_sub_shape },
  cross_cutting: { recent_life_shape_change, replacement_structure_exists, recent_reaching },
  self_report: { named_absences: [...] }
}
```

**Validation (enforce at the boundary; a missing/invalid field is a HARD FAIL, not a silent default):**
- all required fields present;
- enums exact;
- week_shape all nine booleans;
- named_absences 0–3 with nothing_really exclusive;
- spiritual wanting present.

**Empty tick-list handling:** The flattener (toAnswersObject) coerces empty tick_any answers to [] (was undefined, which broke completion). A regression test guards this.

---

# §1.8 WANT-CAUSE DISAMBIGUATION `[SYNTHESIS — BUILT LATER]`

> **SCOPE: NOT part of the questionnaire or assembler build.** This runs in the **SYNTHESIS layer,
> AFTER the engine.** It reads engine OUTPUTS (felt_cost, expression_space[d]) plus InputMap fields.
> It is **NOT one of the 9 consistency checks** and must not run at the pre-engine stage. It produces
> guidance for what to SAY, not an InputMap value. **Do NOT build it as an inert assembler field.**
> It has **no consumer until synthesis exists.** Specced here only so the load-bearing fields are
> known when synthesis is built.

PURPOSE: CHECK 9 flags a named want (anticipation=quickening, specificity=strong) surfacing in none of
Q10/Q10b/Q10c. Four causes; the right message differs sharply by cause.

RECIPE (for each direction d that CHECK 9 flagged):
```
let cost   = directions[d].felt_cost            // engine output; SOFT/low-confidence - see caveat
let past   = directions[d].past_presence
let physical = d in { growth_focused, experience_seeker }   // body-expressed directions
let body   = constraints.body_capacity          // banded full/shifted/limited
let slot_taken = direction_chosen is a DIFFERENT direction (Q10) with would_reach_for=yes
let room   = expression_space[d]                 // engine output: does his week have room for d

if cost is LOW (roughly < 30) AND past == yes:
    cause_hint = "ghost"          // want is internally dead; do NOT urge him to chase it
else if cost is HIGH AND physical AND body == limited (or low shifted):
    cause_hint = "body_blocked"   // barred by the body; never "reach for it"; find an adjacent form
else if cost is HIGH AND slot_taken:
    cause_hint = "out_competed"   // real but lost the day to a stronger live want; it is queued
else if cost is HIGH:
    cause_hint = "external_blocked"  // RESIDUAL/WEAK - barred by circumstance; the want is real,
                                     // the barrier is outside him. See caveat - least reliable branch.
else:
    cause_hint = "unclear"        // do not assert a cause; treat as low-confidence
```
SUGGESTION SHAPE BY CAUSE:
- ghost: do not push the dead want; "this one has gone quiet" / look to a live direction instead.
- body_blocked: acknowledge the loss; offer an ADJACENT reachable form, never the foreclosed act.
- out_competed: name that he has more live wants than days; this one is real but queued, not dead.
- external_blocked: the want is real and the barrier is external; orient toward the barrier, not the
  wanting.

CAVEATS (UNPROVEN — do not treat as fact):
1. Leans on felt_cost — the SOFTEST, lowest-confidence derivation. Emit cause_hint as a HINT with low
   confidence, never as a fact.
2. external_blocked has NO positive signal — it is the "everything else ruled out" residual, the
   weakest inference. expression_space[d]=false weakly supports it but captures no specific barrier.
3. **UNVALIDATED:** it is untested whether felt_cost actually comes out low for a ghost and high for
   an external-blocked want. A fixture test is needed to confirm the discriminator before synthesis
   relies on it; if they come out similar, the recipe collapses to a 3-way (ghost+external merged).
4. The fields this recipe needs (felt_cost, past_presence, body_capacity, expression_space,
   direction_chosen/would_reach_for) are LOAD-BEARING for synthesis and must not be treated as
   trimmable, despite felt_cost being flagged soft elsewhere.

---

# ENGINE BOUNDARY RECORD — Session C-30

The only engine-adjacent changes this session were:

1. **q31 role_consolidation derivation** — ASSEMBLER-layer change only. The `deriveRoleConsolidation` function in `answer-maps.ts` was modified to use a consistency-x-activity cross (c/d-not-b predicate, threshold-2). This still emits the existing three values (`holds_other_selves` / `role_inflected` / `role_consolidated`). The engine's `computeIdentityNarrowingBand` consumes these values unchanged; validation and value space were NOT modified.

2. **q33 relational_presence option d** — ADDITIVE value plumbing only. Type union (`'a' | 'b' | 'c' | 'd'`), validation whitelist, and mapper (`mapRelationalPresence`) were added to support the new `no_close_relationship` value. The engine's relational band logic (`computeRelationalNarrowingBand`) uses strict equality on `present` / `partial` / `mostly_absent` and falls through for the new value (it contributes nothing; narrowing for this man comes from the relational DOMAINS, not q33). The two synthesis predicates use strict equality and exclude it. Band logic was NOT changed.

The engine proper (derivations, band logic, existing validation rules, value spaces) was otherwise NOT modified.

---

# APPENDIX — Every `[VERIFY]` / verification tag added

1. **Top-of-document VALUE-VERIFICATION CAVEAT** — all field names, enum spellings, and InputMap
   structure are DESIGN-ASSERTED and MUST be verified against the engine's actual type and validation
   source (location to be found during the verification pass — do not assume a filename) before/during
   build.
2. **InputMap structure block** — `[VERIFY: confirm this structure, all keys, and enum spellings
   against the engine's actual type and validation source (location to be found during the
   verification pass — do not assume a filename)]`.
3. **PROVISIONAL markers** on numeric cut-points: Q25 energy bands, Q27 body bands, Q30 permission
   ladder (say 40 vs act 45), and the global "all numbers PROVISIONAL" header on Derivations.

Scope tags applied throughout: `[QUESTIONNAIRE]`, `[ASSEMBLER]`, `[SYNTHESIS — BUILT LATER]` (the §1.8
recipe). Build-time confirmations flagged inline: spiritual-wanting-is-derived; 3 never-emitted
life_stage values acceptable; Q6 engine-usage; rest-vs-none engine-usage; compute domains before
felt_cost.