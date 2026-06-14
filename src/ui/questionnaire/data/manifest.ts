// Real questionnaire manifest — 36 pages following ASSEMBLER.md question order.
// Letters map to assembler values per verified mappings in Part 1.

import type { Manifest } from '../types';

const manifest: Manifest = {
  pages: [
    // Page 0: Intro page (non-answering content)
    {
      id: 'intro',
      kind: 'content' as const,
      questions: [],
    },

    // Page 1: Q1a and Q1b — week_shape (split into two questions on one page)
    {
      id: 'q1-week-shape',
      questions: [
        {
          id: 'q1a',
          renderer: 'tick_any',
          prompt: 'In the average week and when not at work, tick whatever is typically true.',
          help: 'Tick as many as fit. None is a fair answer.',
          options: [
            { value: 'a', label: 'I do a regular activity outside home', help: 'A recurring class or standing thing in the week' }, // weekly_activity
            { value: 'b', label: 'I see friends and people I actually like', help: 'In person, down the pub, over a coffee or at the gym' }, // sees_people
            { value: 'c', label: 'I make things and build stuff', help: 'Creating things, writing or even cooking as a craft (and not just dinner)' }, // makes_things
            { value: 'd', label: 'I\'m physically active', help: 'Going for a proper walk, getting on the bike, going to the gym, doing a sport, or just physical graft in the garden' }, // active_body
            { value: 'e', label: 'I belong to a group or club', help: "Being a member of a team, congregation or a group of people" }, // belongs_to_group
            { value: 'f', label: 'I do things on my own for the sake of it', help: 'Reading books, playing an instrument, pottering in the garden' }, // solo_practice
          ],
          config: { multiSelect: true },
          required: false,
        },
      ]
    },
    {
      id: 'q1a-week-shape',
      questions: [
        {
          id: 'q1b',
          renderer: 'tick_any',
          prompt: 'For the week overall, which of these are true?',
          help: 'Tick as many as fit. None is a fair answer.',
          options: [
            { value: 'g', label: 'Work takes up a lot of my time', help: 'Over fifty hours or it comes home with you most nights and weekends' }, // work_dominates
            { value: 'h', label: 'Weekends are mostly spoken for', help: 'Family, the house, the admin, the caring' }, // weekends_consumed
            { value: 'i', label: 'No two weeks look the same', help: 'No fixed pattern from one week to the next' }, // varied_week
          ],
          config: { multiSelect: true },
          required: false,
        },
      ],
    },

    // Page 2: Q2 — primary_load
    {
      id: 'q2-primary-load',
      questions: [
        {
          id: 'q2',
          renderer: 'single_select',
          prompt: "What's taking the most out of you at the moment?",
          help: "If it's more than one thing, pick the biggest.",
          options: [
            { value: 'a', label: 'Work', help: 'Long hours, stress, lack of control, or feeling undervalued' }, // paid_work
            { value: 'b', label: 'Looking after someone', help: 'Elderly parents, a partner, the kids, a neighbour' }, // caregiving
            { value: 'c', label: 'The house and the admin', help: 'Cleaning, cooking, bills, paperwork' }, // household_admin
            { value: 'd', label: 'Nothing much has a real claim on me' }, // none
          ],
          required: true,
        },
      ],
    },

    // Page 3: Q3 — paid_work_relationship
    {
      id: 'q3-paid-work-relationship',
      questions: [
        {
          id: 'q3',
          renderer: 'single_select',
          prompt: 'Thinking about work, select which describes your situation best.',
          options: [
            { value: 'a', label: 'It stays at work', help: "When I am not there, I'm not thinking about it" }, // functional
            { value: 'b', label: 'It follows me home some nights or weekends', help: "I'm thinking about it or doing stuff some of the time outside work hours" }, // consuming
            { value: 'c', label: 'It takes up most of my waking life', help: "I'm constantly thinking about it and working most of the time" }, // defining
            { value: 'd', label: 'I am between things at the moment', help: 'Between jobs, or working out the next move' }, // between
            { value: 'e', label: 'It is mine by choice', help: "I love what I do and work hard because it's my passion" }, // chosen
            { value: 'f', label: 'It is just a job on the side', help: 'Part time work or something I do for some pin money' }, // peripheral
            { value: 'g', label: 'Retired or no longer working', help: 'Work is no longer part of my life' }, // peripheral (retired)
          ],
          required: true,
        },
      ],
    },

    // Page 4: Q4 — life_shape_duration
    {
      id: 'q4-life-shape-duration',
      questions: [
        {
          id: 'q4',
          renderer: 'single_select',
          prompt: "How long has your life been roughly the shape it's in now?",
          help: 'Pick just one',
          options: [
            { value: 'a', label: 'Under a couple of years' }, // recent
            { value: 'b', label: 'Two to five years' }, // sustained
            { value: 'c', label: 'Five years or more' }, // long
          ],
          required: true,
        },
      ],
    },

    // Page 5: Q5 — recent_life_shape_change
    {
      id: 'q5-recent-life-shape-change',
      questions: [
        {
          id: 'q5',
          renderer: 'single_select',
          prompt: 'In the last three years, has a big part of your life ended or changed?',
          help: 'Pick just one',
          options: [
            { value: 'a', label: 'Nothing much has ended or changed', help: 'Life is roughly as it was a few years back' }, // no
            { value: 'b', label: 'Something ended, and something has grown in its place', help: 'A job, a role, the caring of someone, or the kids leaving, and something has taken over the space' }, // yes
            { value: 'c', label: 'Something ended, and I\'m still in the in-between', help: 'A job, a role, the caring of someone, or the kids leaving, and the next thing hasn\'t taken shape yet' }, // yes
          ],
          required: true,
        },
      ],
    },

    // Page 6: Q6 — capacity_strain
    {
      id: 'q6-capacity-strain',
      questions: [
        {
          id: 'q6',
          renderer: 'single_select',
          prompt: 'Right now, is there more being asked of you than you can manage?',
          help: 'Pick just one',
          options: [
            { value: 'a', label: 'No, I have got the room for what is on me' }, // no
            { value: 'b', label: 'Tight, but I manage' }, // no
            { value: 'c', label: 'Yes, more than I can keep up with' }, // yes
          ],
          required: true,
        },
      ],
    },

    // Page 7: Q7 — sociality_default
    {
      id: 'q7-sociality-default',
      questions: [
        {
          id: 'q7',
          renderer: 'single_select',
          prompt: 'Excluding your partner or family, do you prefer your own company, or the company of others?',
          help: 'Pick just one',
          options: [
            { value: 'a', label: 'My own company, mostly' }, // solitary_by_default
            { value: 'b', label: 'The company of others, mostly' }, // social_by_default
            { value: 'c', label: 'A genuine mix - I need both, about equally' }, // balanced
          ],
          required: true,
        },
      ],
    },

    // Page 8: Q11a — spare-resource reflex probe
    {
      id: 'q11a-spare-resource',
      questions: [
        {
          id: 'q11a_spare_resource',
          renderer: 'single_select',
          prompt: "When a bit of money or time comes free - a quiet afternoon, an unexpected hundred quid - what tends to happen?",
          options: [
            { value: 'a', label: "I'll usually put it toward something I'd actually enjoy" },
            { value: 'b', label: "I think about it, but it tends to go on something sensible or for someone else" },
            { value: 'c', label: "It goes on the practical stuff almost without thinking - using it on myself doesn't really come up" },
          ],
          required: true,
        },
      ],
    },

    // Pages 9-14: Part C — six direction cards (contributor, experience_seeker, freedom_designer, growth_focused, creator, relationship_rebuilder)
    // Each card has three sub-questions (a, b, c) with card-c gated on card-b != 'a' (does nothing for me)

    // Page 9: Contributor card
    {
      id: 'card-contributor',
      kind: 'card' as const,
      questions: [
        {
          id: 'card-contributor-a',
          renderer: 'single_select',
          prompt: "Beyond the people you've already got to look after, how much do you do for others by choice these days?",
          help: 'Mentoring someone, coaching a side, volunteering, being the one people come to, a job you chose because it helps people. Not the family duties you\'ve already got',
          options: [
            { value: 'a', label: 'Nothing, really' }, // current_movement=0, recent_action=none
            { value: 'b', label: 'Occasionally but not much' }, // current_movement=33, recent_action=some
            { value: 'c', label: 'Doing a bit more of it recently' }, // current_movement=67, recent_action=recent
            { value: 'd', label: 'It\'s something I do regularly' }, // current_movement=100, recent_action=recent
          ],
          required: true,
          config: { directionKey: 'contributor' },
        },
        {
          id: 'card-contributor-b',
          renderer: 'single_select',
          prompt: "Picture doing more of it in your life. What's your first reaction?",
          options: [
            { value: 'a', label: 'Does nothing for me' }, // anticipation=none
            { value: 'b', label: "Wouldn't mind more" }, // anticipation=mild
            { value: 'c', label: 'It\'s what I genuinely want' }, // anticipation=quickening
          ],
          required: true,
          config: { directionKey: 'contributor', felt: true },
        },
        {
          id: 'card-contributor-c',
          renderer: 'single_select',
          prompt: 'How clear is it? A general pull, or something specific?',
          options: [
            { value: 'a', label: 'Just a general pull, nothing specific' }, // specificity=none
            { value: 'b', label: "Something's there, but not pinned down" }, // specificity=partial
            { value: 'c', label: 'Yes, a specific thing I keep coming back to' }, // specificity=strong
            { value: 'skipped', label: 'Skip' }, // specificity=none (when card-b was "does nothing")
          ],
          required: false,
          conditionalOn: { questionId: 'card-contributor-b', operator: 'not_equals' as const, value: 'a' },
          config: { directionKey: 'contributor' },
        },
      ],
    },

   // Page 10: Experience seeker card
    {
      id: 'card-experience-seeker',
      kind: 'card' as const,
      questions: [
        {
          id: 'card-experience-seeker-a',
          renderer: 'single_select',
          prompt: "How much do you actually do that's new these days?",
          help: 'Somewhere you have not been, food you have not tried, a first go at something, a different route',
          options: [
            { value: 'a', label: 'Nothing, really' },
            { value: 'b', label: 'Occasionally but not much' },
            { value: 'c', label: 'Doing a bit more of it recently' },
            { value: 'd', label: "It's something I do regularly" },
          ],
          required: true,
          config: { directionKey: 'experience_seeker' },
        },
        {
          id: 'card-experience-seeker-b',
          renderer: 'single_select',
          prompt: "Picture doing more of it in your life. What's your first reaction?",
          options: [
            { value: 'a', label: 'Does nothing for me' },
            { value: 'b', label: "Wouldn't mind more" },
            { value: 'c', label: "It's what I genuinely want" },
          ],
          required: true,
          config: { directionKey: 'experience_seeker', felt: true },
        },
        {
          id: 'card-experience-seeker-c',
          renderer: 'single_select',
          prompt: 'How clear is it? A general pull, or something specific?',
          options: [
            { value: 'a', label: 'Just a general pull, nothing specific' }, // specificity=none
            { value: 'b', label: "Something's there, but not pinned down" }, // specificity=partial
            { value: 'c', label: 'Yes, a specific thing I keep coming back to' }, // specificity=strong
            { value: 'skipped', label: 'Skip' }, // specificity=none (when card-b was "does nothing")
          ],
          required: false,
          conditionalOn: { questionId: 'card-experience-seeker-b', operator: 'not_equals' as const, value: 'a' },
          config: { directionKey: 'experience_seeker' },
        },
      ],
    },

    // Page 11: Freedom designer card
    {
      id: 'card-freedom-designer',
      kind: 'card' as const,
      questions: [
        {
          id: 'card-freedom-designer-a',
          renderer: 'single_select',
          prompt: "How often do you get time that's yours, to spend how you like?",
          help: "A morning with nothing booked, an hour that is nobody else's, a trip done your way, an evening no one has claimed",
          options: [
            { value: 'a', label: 'Hardly ever' },
            { value: 'b', label: 'Now and then' },
            { value: 'c', label: 'A bit more lately' },
            { value: 'd', label: "Regularly" },
          ],
          required: true,
          config: { directionKey: 'freedom_designer' },
        },
        {
          id: 'card-freedom-designer-b',
          renderer: 'single_select',
          prompt: "Picture doing more of it in your life. What's your first reaction?",
          options: [
            { value: 'a', label: 'Does nothing for me' },
            { value: 'b', label: "Wouldn't mind more" },
            { value: 'c', label: "It's what I genuinely want" },
          ],
          required: true,
          config: { directionKey: 'freedom_designer', felt: true },
        },
        {
          id: 'card-freedom-designer-c',
          renderer: 'single_select',
          prompt: 'How clear is it? A general pull, or something specific?',
          options: [
            { value: 'a', label: 'Just a general wish for more time' }, // specificity=none
            { value: 'b', label: "Some sense of what I'm missing" }, // specificity=partial
            { value: 'c', label: 'I know exactly the time I want back, I think it over a lot' }, // specificity=strong
            { value: 'skipped', label: 'Skip' }, // specificity=none (when card-b was "does nothing")
          ],
          required: false,
          conditionalOn: { questionId: 'card-freedom-designer-b', operator: 'not_equals' as const, value: 'a' },
          config: { directionKey: 'freedom_designer' },
        },
      ],
    },

    // Page 12: Growth focused card
    {
      id: 'card-growth-focused',
      kind: 'card' as const,
      questions: [
        {
          id: 'card-growth-focused-a',
          renderer: 'single_select',
          prompt: "How much is getting better at something a part of your life these days?",
          help: 'A skill you are working at, a language, the handicap coming down, reading to properly learn something',
          options: [
            { value: 'a', label: 'Nothing, really' },
            { value: 'b', label: 'Occasionally but not much' },
            { value: 'c', label: 'Doing a bit more of it recently' },
            { value: 'd', label: "It's something I do regularly" },
          ],
          required: true,
          config: { directionKey: 'growth_focused' },
        },
        {
          id: 'card-growth-focused-b',
          renderer: 'single_select',
          prompt: "Picture doing more of it in your life. What's your first reaction?",
          options: [
            { value: 'a', label: 'Does nothing for me' },
            { value: 'b', label: "Wouldn't mind more" },
            { value: 'c', label: "It's what I genuinely want" },
          ],
          required: true,
          config: { directionKey: 'growth_focused', felt: true },
        },
        {
          id: 'card-growth-focused-c',
          renderer: 'single_select',
          prompt: 'How clear is it? A general pull, or something specific?',
          options: [
            { value: 'a', label: 'Just a general pull, nothing specific' }, // specificity=none
            { value: 'b', label: "Something's there, but not pinned down" }, // specificity=partial
            { value: 'c', label: 'Yes, a specific thing I keep coming back to' }, // specificity=strong
            { value: 'skipped', label: 'Skip' }, // specificity=none (when card-b was "does nothing")
          ],
          required: false,
          conditionalOn: { questionId: 'card-growth-focused-b', operator: 'not_equals' as const, value: 'a' },
          config: { directionKey: 'growth_focused' },
        },
      ],
    },

    // Page 13: Creator card
    {
      id: 'card-creator',
      kind: 'card' as const,
      questions: [
        {
          id: 'card-creator-a',
          renderer: 'single_select',
          prompt: "How much is making and fixing things a part of your life these days?",
          help: 'Woodwork or writing, a bit of music, doing up the bike, cooking as a craft',
          options: [
            { value: 'a', label: 'Nothing, really' },
            { value: 'b', label: 'Occasionally but not much' },
            { value: 'c', label: 'Doing a bit more of it recently' },
            { value: 'd', label: "It's something I do regularly" },
          ],
          required: true,
          config: { directionKey: 'creator' },
        },
        {
          id: 'card-creator-b',
          renderer: 'single_select',
          prompt: "Picture doing more of it in your life. What's your first reaction?",
          options: [
            { value: 'a', label: 'Does nothing for me' },
            { value: 'b', label: "Wouldn't mind more" },
            { value: 'c', label: "It's what I genuinely want" },
          ],
          required: true,
          config: { directionKey: 'creator', felt: true },
        },
        {
          id: 'card-creator-c',
          renderer: 'single_select',
          prompt: 'How clear is it? A general pull, or something specific?',
          options: [
            { value: 'a', label: 'Just a general pull, nothing specific' }, // specificity=none
            { value: 'b', label: "Something's there, but not pinned down" }, // specificity=partial
            { value: 'c', label: 'Yes, a specific thing I keep coming back to' }, // specificity=strong
            { value: 'skipped', label: 'Skip' }, // specificity=none (when card-b was "does nothing")
          ],
          required: false,
          conditionalOn: { questionId: 'card-creator-b', operator: 'not_equals' as const, value: 'a' },
          config: { directionKey: 'creator' },
        },
      ],
    },

    // Page 14: Relationship rebuilder card
    {
      id: 'card-relationship-rebuilder',
      kind: 'card' as const,
      questions: [
        {
          id: 'card-relationship-rebuilder-a',
          renderer: 'single_select',
          prompt: "How much is real time with the people who matter a part of your life these days?",
          help: 'A sit-down with your other half, a pint with an old mate, unrushed time with the kids, an old friend rung up',
          options: [
            { value: 'a', label: 'Nothing, really' },
            { value: 'b', label: 'Occasionally but not much' },
            { value: 'c', label: 'Doing a bit more of it recently' },
            { value: 'd', label: "It's something I do regularly" },
          ],
          required: true,
          config: { directionKey: 'relationship_rebuilder' },
        },
        {
          id: 'card-relationship-rebuilder-b',
          renderer: 'single_select',
          prompt: "Picture doing more of it in your life. What's your first reaction?",
          options: [
            { value: 'a', label: 'Does nothing for me' },
            { value: 'b', label: "Wouldn't mind more" },
            { value: 'c', label: "It's what I genuinely want" },
          ],
          required: true,
          config: { directionKey: 'relationship_rebuilder', felt: true },
        },
        {
          id: 'card-relationship-rebuilder-c',
          renderer: 'single_select',
          prompt: 'How clear is it? A general pull, or something specific?',
          options: [
            { value: 'a', label: 'Just a general pull, nothing specific' }, // specificity=none
            { value: 'b', label: "Something's there, but not pinned down" }, // specificity=partial
            { value: 'c', label: 'Yes, a specific thing I keep coming back to' }, // specificity=strong
            { value: 'skipped', label: 'Skip' }, // specificity=none (when card-b was "does nothing")
          ],
          required: false,
          conditionalOn: { questionId: 'card-relationship-rebuilder-b', operator: 'not_equals' as const, value: 'a' },
          config: { directionKey: 'relationship_rebuilder' },
        },
      ],
    },
    // Page 15: Q8 — past_presence (tick directions)
    {
      id: 'q8-past-presence',
      kind: 'past_presence_pair' as const,
      questions: [
        {
          id: 'q8',
          renderer: 'tick_any',
          prompt: 'Think back, were any of these ever a real part of your life in the past?',
          help: "Things you've gone in for at some point - not now, just ever. Tick any, or none.",
          options: [
            { value: 'contributor', label: 'Doing things for other people', help: 'Volunteering, coaching a side, showing someone the ropes, or a career spent looking after people' },
            { value: 'experience_seeker', label: 'Something new, somewhere new', help: 'Somewhere you have not been, food you have not tried, a first go at something' },
            { value: 'freedom_designer', label: 'Time that\'s yours to spend how you like', help: "A morning with nothing booked, an hour that is nobody else's, an evening no one has claimed" },
            { value: 'growth_focused', label: 'Getting better at something', help: 'A skill you are working at, a language, reading to properly learn something' },
            { value: 'creator', label: 'Making and fixing things', help: 'Woodwork or writing, a bit of music, doing up the bike, cooking as a craft' },
            { value: 'relationship_rebuilder', label: 'Time with the people who matter', help: 'A sit-down with your other half, a pint with an old mate, unrushed time with the kids' },
          ],
          config: { multiSelect: true },
          required: false,
        },
        {
          id: 'q9',
          renderer: 'tick_any',
          prompt: "Now tick the ones you've moved on from, even though, secretly, there's a spark still there.",
          help: "From the ones you ticked above - the ones you've let go of, but not quite completely.",
          options: [
            { value: 'contributor', label: 'Doing things for other people', help: 'Volunteering, coaching a side, showing someone the ropes, or a career spent looking after people' },
            { value: 'experience_seeker', label: 'Something new, somewhere new', help: 'Somewhere you have not been, food you have not tried, a first go at something' },
            { value: 'freedom_designer', label: 'Time that\'s yours to spend how you like', help: "A morning with nothing booked, an hour that is nobody else's, an evening no one has claimed" },
            { value: 'growth_focused', label: 'Getting better at something', help: 'A skill you are working at, a language, reading to properly learn something' },
            { value: 'creator', label: 'Making and fixing things', help: 'Woodwork or writing, a bit of music, doing up the bike, cooking as a craft' },
            { value: 'relationship_rebuilder', label: 'Time with the people who matter', help: 'A sit-down with your other half, a pint with an old mate, unrushed time with the kids' },
          ],
          config: { multiSelect: true },
          required: false,
        },
      ],
    },

    // Page 16: Q10 — direction_chosen
    // TRIAD GUARD (Q10 / Q10b / Q10c): option labels deliberately vary in surface wording
    // across the three arms (present / retrospective / counterfactual) to prevent the
    // respondent recognising a repeat and answering for consistency. Values, constructs,
    // and order are identical in all three. Do NOT re-unify the wording — this is a
    // deliberate, documented exception to the matched-set rule. See keystone doc.
    {
      id: 'q10-direction-chosen',
      questions: [
        {
          id: 'q10',
          renderer: 'single_select',
          prompt: 'Saturday comes free, what do you actually do with it?',
          help: 'Pick the first honest answer, not the sensible one',
          options: [
            { value: 'contributor', label: 'Something useful for someone else' },
            { value: 'experience_seeker', label: 'Something new, somewhere new' },
            { value: 'freedom_designer', label: 'Time on my own terms, however I want it' },
            { value: 'growth_focused', label: 'Getting better at something' },
            { value: 'creator', label: 'Making or fixing something' },
            { value: 'relationship_rebuilder', label: 'Time with the people who matter' },
            { value: 'rest', label: 'Nothing in particular. Rest. I am tired enough as it is' },
            { value: 'none', label: 'Could not tell you. Nothing springs to mind' },
          ],
          required: true,
        },
      ],
    },

    // Pages 17-19: domain current_state sliders (3 pages of 3, grouped by kind)
    // FELT: felt_aliveness, curiosity, mattering
    // RESOURCES: time_as_yours, energy_as_resource, body_physical_aliveness
    // PRESENCE: intimacy, making, spiritual

    // Page 17: FELT domain sliders
    {
      id: 'domain-sliders-felt',
      questions: [
        {
          id: 'domain_current_state_felt',
          renderer: 'domain_sliders',
          prompt: "How things feel from the inside lately.",
          help: "Not what you do or how much you've got - just how it all feels right now. First instinct is fine.",
          config: {
            sliderMin: 0,
            sliderMax: 100,
            domains: [
              { key: 'felt_aliveness', label: "How alive life feels", minLabel: 'Pretty flat', maxLabel: 'Properly alive' },
              { key: 'curiosity', label: "Whether things still spark your interest", minLabel: 'Nothing much grabs me', maxLabel: 'Plenty still grabs me' },
              { key: 'mattering', label: "Whether what you do feels like it counts", minLabel: "Doesn't feel like it matters", maxLabel: 'Feels like it really counts' },
            ],
          },
          required: true,
        },
      ],
    },

    // Page 18: RESOURCES domain sliders
    {
      id: 'domain-sliders-resources',
      questions: [
        {
          id: 'domain_current_state_resources',
          renderer: 'domain_sliders',
          prompt: "What you've got to draw on - and whether it feels like yours.",
          help: "Not the hours or the diary - the feel of it. Whether your time, your energy, your body are actually there for you.",
          config: {
            sliderMin: 0,
            sliderMax: 100,
            domains: [
              { key: 'time_as_yours', label: "How much your time feels your own", minLabel: "None of it feels mine", maxLabel: "Most of it feels mine" },
              { key: 'energy_as_resource', label: "Whether you've got the energy to draw on", minLabel: 'Running on empty', maxLabel: 'Plenty of go' },
              { key: 'body_physical_aliveness', label: "How your body feels in itself", minLabel: 'Letting me down', maxLabel: 'Feels good' },
            ],
          },
          required: true,
        },
      ],
    },

    // Page 19: PRESENCE domain sliders
    {
      id: 'domain-sliders-presence',
      questions: [
        {
          id: 'domain_current_state_presence',
          renderer: 'domain_sliders',
          prompt: "What's actually in your life right now.",
          help: "Not how you feel about it - just whether it's there. Be honest if something's just not part of things anymore.",
          config: {
            sliderMin: 0,
            sliderMax: 100,
            domains: [
              { key: 'intimacy', label: "Someone you're really close to", minLabel: 'No one that close', maxLabel: "Someone I'm properly close to" },
              { key: 'making', label: "Making things, or mostly taking them in", minLabel: 'Mostly take it in', maxLabel: 'Make things myself' },
              { key: 'spiritual', label: "Faith, or a spiritual side to life", minLabel: 'Not part of my life', maxLabel: 'A real part of my life' },
            ],
          },
          required: true,
        },
      ],
    },

    // Page 20: Q11b — footprint / naming a want probe
    {
      id: 'q11b-footprint',
      questions: [
        {
          id: 'q11b_footprint',
          renderer: 'single_select',
          prompt: "What do you actually want for yourself these days? Not for work, not for anyone else - just you. Could you put your finger on it?",
          options: [
            { value: 'a', label: "Yes - I know what I want" },
            { value: 'b', label: "I'd have something, but I'd need to think" },
            { value: 'c', label: "I'd struggle, honestly - I'm not sure I could put my finger on anything" },
          ],
          required: true,
        },
      ],
    },

    // Page 21: Q_friendship_count — friendship count question
    {
      id: 'q-friendship-count',
      questions: [
        {
          id: 'q_friendship_count',
          renderer: 'single_select',
          prompt: 'Friends - the real sort. Not family, not your partner, not people you only know through work. People you would choose to see. How many have you got, honestly?',
          options: [
            { value: 'a', label: 'None really, not these days' },
            { value: 'b', label: 'One or two' },
            { value: 'c', label: 'A handful or more' },
          ],
          required: true,
        },
      ],
    },

    // Page 22: Q_depth_known — depth and being known question
    {
      id: 'q-depth-known',
      questions: [
        {
          id: 'q_depth_known',
          renderer: 'single_select',
          prompt: "Most talk is just the day-to-day - what needs doing, who's where, or even just banter with your mates. With the people close to you, does it ever go deeper than that?",
          options: [
            { value: 'a', label: "Honestly, not really - it mostly stays at that" },
            { value: 'b', label: "Yes, we get into the real stuff - what's actually going on, not just the surface" },
            { value: 'c', label: "Yes, and there's someone I can be properly open with - who really knows what I'm like underneath" },
          ],
          required: true,
        },
      ],
    },

    // Page 23: Q24 — domain past_presence (tick domains)
    {
      id: 'q24-domain-past-presence',
      questions: [
        {
          id: 'q24',
          renderer: 'tick_any',
          prompt: 'Which of these were once an active part of your life?',
          help: "This time, the feel of life rather than the doings - what your life used to have in it. Tick any, or none.",
          options: [
            { value: 'time_as_yours', label: 'Having time that was genuinely yours' },
            { value: 'energy_as_resource', label: 'Having energy left once the duties were done' },
            { value: 'felt_aliveness', label: 'Feeling switched on, awake to things' },
            { value: 'body_physical_aliveness', label: 'A body that did what you asked of it' },
            { value: 'curiosity', label: 'Being curious, wanting to know things' },
            { value: 'making', label: 'Making or building things' },
            { value: 'conversation_depth', label: 'Having conversations with real depth' },
            { value: 'being_known', label: 'Being properly known by someone' },
            { value: 'friendship', label: 'Having real friends, the proper sort' },
            { value: 'intimacy', label: 'Being really close to someone' },
            { value: 'mattering', label: 'Feeling that what you did mattered' },
            { value: 'spiritual', label: 'Having faith, or a spiritual side to life' },
          ],
          config: { multiSelect: true },
          required: false,
        },
      ],
    },

    // Page 24: Q11c — fate of small wants probe
    {
      id: 'q11c-small-wants',
      questions: [
        {
          id: 'q11c_small_wants',
          renderer: 'single_select',
          prompt: "Think about the last few times you wanted something for yourself - even something small. What tends to happen to it?",
          options: [
            { value: 'a', label: "I'll generally go after it" },
            { value: 'b', label: "I talk myself out of it, or it slides down the list behind everything else" },
            { value: 'c', label: "I tend to decide I don't really need it, often before I've even properly considered it" },
          ],
          required: true,
        },
      ],
    },

    // Page 25: Q25 — energy_availability
    {
      id: 'q25-energy-availability',
      questions: [
        {
          id: 'q25',
          renderer: 'single_select',
          prompt: 'In a normal week, how many nights have you actually got enough in the tank to do something of your own?',
          help: 'Pick one',
          options: [
            { value: 'a', label: 'None, really' }, // 10
            { value: 'b', label: 'Maybe one' }, // 30
            { value: 'c', label: 'A couple' }, // 50
            { value: 'd', label: 'Three or four' }, // 70
            { value: 'e', label: 'Most nights' }, // 90
          ],
          required: true,
        },
      ],
    },

    // Page 26: Q26 — time_availability
    {
      id: 'q26-time-availability',
      questions: [
        {
          id: 'q26',
          renderer: 'slider',
          prompt: 'In a normal week, how much of your time is left over once all your obligations are met?',
          help: 'Roughly how much of the week is genuinely your own - not what you do with it, just whether it\'s spoken for.',
          config: {
            sliderMin: 0,
            sliderMax: 100,
            minLabel: 'None left',
            maxLabel: 'Loads left',
          },
          required: true,
        },
      ],
    },

    // Page 27: Q27 — body_capacity
    {
      id: 'q27-body-capacity',
      questions: [
        {
          id: 'q27',
          renderer: 'single_select',
          prompt: 'Your body, in practical terms. Which of these is nearest to what you can still actually do?',
          help: 'Pick one',
          options: [
            { value: 'a', label: 'Whatever I want' }, // 85
            { value: 'b', label: 'Most things, though I notice it more than I used to' }, // 65
            { value: 'c', label: 'The everyday is fine, but the demanding stuff is going or gone' }, // 45
            { value: 'd', label: 'It sets real limits on an ordinary day now' }, // 25
          ],
          required: true,
        },
      ],
    },

    // Page 28: Q10b — retrospective (triangulation variant, far from Q10a)
    // TRIAD GUARD: surface wording intentionally differs from Q10/Q10c — do NOT re-unify. See note at Q10.
    {
      id: 'q10b-retrospective',
      questions: [
        {
          id: 'q10b',
          renderer: 'single_select',
          prompt: "Think back to the last time you had a free stretch that was genuinely yours. What did you find yourself drawn to, even if you didn't get round to all of it?",
          options: [
            { value: 'contributor', label: 'Doing something for somebody else' },
            { value: 'experience_seeker', label: 'Somewhere I had not been, something I had not done' },
            { value: 'freedom_designer', label: 'Time that was properly mine, however I wanted it' },
            { value: 'growth_focused', label: 'Working at something, getting better at it' },
            { value: 'creator', label: 'Making or mending something' },
            { value: 'relationship_rebuilder', label: 'Time with people who matter to me' },
            { value: 'rest', label: 'Nothing in particular. Rest. I was tired enough as it was' },
            { value: 'none', label: 'Could not tell you. Nothing comes back to me' },
          ],
          required: true,
        },
      ],
    },

    // Page 30: Q29 — recent_reaching
    {
      id: 'q29-recent-reaching',
      questions: [
        {
          id: 'q29',
          renderer: 'single_select',
          prompt: 'Lately, have you been reaching for something of your own: starting something, trying to change something, or picking an old thing back up? (Pick one.)',
          options: [
            { value: 'a', label: 'Yes, and it is still new and unsettled. I have not really told anyone' }, // recent_and_awkward
            { value: 'b', label: 'Yes, and it has settled into a regular part of my life by now' }, // mid_stream
            { value: 'c', label: 'Yes, it is something from the past I have come back to, an old hobby or interest' }, // long_established
            { value: 'd', label: 'No, nothing like that at the moment' }, // no_current_reaching
          ],
          required: true,
        },
      ],
    },

    // Page 31: Q30 — permission
    {
      id: 'q30-permission',
      questions: [
        {
          id: 'q30',
          renderer: 'single_select',
          prompt: "The last thing you fancied doing but didn't do, big or small. Looking back, what actually happened?",
          options: [
            { value: 'a', label: 'Just did not fancy it in the end. No real argument either way' }, // 70 + present
            { value: 'b', label: 'I wanted to but I never actually got round to it' }, // 45 + act_block
            { value: 'c', label: 'I wanted to, but I never said anything or made it a thing, so it came to nothing' }, // 40 + say_block
            { value: 'd', label: 'Barely got as far as thinking about it before "I do not need that" shut it down' }, // 25 + want_block
            { value: 'e', label: "Honestly, I can't think of a recent time I wanted something just for myself" }, // 25 + want_block
          ],
          required: true,
        },
      ],
    },

    // Page 32: Q31 — role_consolidation
    {
      id: 'q31-role-consolidation',
      questions: [
        {
          id: 'q31',
          renderer: 'single_select',
          prompt: "People often come across differently in different parts of life - a bit of a different bloke at work, at home, off on their own. How about you?",
          options: [
            { value: 'a', label: "Pretty much the same whoever I'm with, wherever I am" },
            { value: 'b', label: 'A bit different depending where I am, but broadly the same' },
            { value: 'c', label: 'Quite different sides of me come out in different settings' },
          ],
          required: true,
        },
      ],
    },

    // Page 33: Q32 — attention_pattern
    {
      id: 'q32-attention-pattern',
      questions: [
        {
          id: 'q32',
          renderer: 'single_select',
          prompt: 'Last weekend. How much of it can you actually call to mind now? (Pick one.)',
          options: [
            { value: 'a', label: 'I can call most of it to mind, in some detail' }, // engaged
            { value: 'b', label: 'I get the gist, but it blurs' }, // intermittent
            { value: 'c', label: 'Honestly, it is a blank. I was on autopilot' }, // autopilot
          ],
          required: true,
        },
      ],
    },

    // Page 34: Q33 — relational_presence
    {
      id: 'q33-relational-presence',
      questions: [
        {
          id: 'q33',
          renderer: 'single_select',
          prompt: "The last evening you spent with whoever you're closest to, if there's someone like that. Where were you, really?",
          options: [
            { value: 'a', label: 'I was there with them, properly', help: 'In it with them, not off in your own head.' },
            { value: 'b', label: 'I was there, but half of me was elsewhere', help: 'There, but distracted - keeping it light, half thinking about other things.' },
            { value: 'c', label: 'I was going through the motions', help: 'There in body only - saying the right things, but not really in it.' },
            { value: 'd', label: "Honestly, there isn't anyone I'm that close to", help: 'No one that close right now - different from a quiet evening, just no one it really applies to.' },
          ],
          required: true,
        },
      ],
    },

    // Page 35: peace_discriminator (renderer pending Step B)
    // Rows are dynamic: computed at render time from assembler's computeFadedDomains()
    // For each faded domain, the man picks made_peace or still_misses
    {
      id: 'peace-discriminator',
      questions: [
        {
          id: 'peace_discriminator',
          renderer: 'peace_discriminator',
          prompt: "There are things that used to be part of your life that aren't there now. For each one: are you fine without it now, or do you want it back?",
          help: "The things that have slipped from your life. For each, just whether you mind.",
          config: {},
          required: true,
        },
      ],
    },

    // Page 36: q70_allocation (renderer pending Step B)
    // Per-direction £ allocation: up to 3 directions, each 0–70, sum ≤70
    {
      id: 'q70-allocation',
      questions: [
        {
          id: 'q70_allocation',
          renderer: 'allocation',
          prompt: "Here's £70. Put it toward whichever of these you'd honestly want more of in your life. Not what sounds right, what you'd actually want. Split it across up to three of them, any amounts, no more than £70 in total.",
          config: {},
          required: true,
        },
      ],
    },

    // Page 37: Q10c — counterfactual (triangulation variant, far from Q10a and Q10b)
    // TRIAD GUARD: surface wording intentionally differs from Q10/Q10b — do NOT re-unify. See note at Q10.
    {
      id: 'q10c-counterfactual',
      questions: [
        {
          id: 'q10c',
          renderer: 'single_select',
          prompt: "Suppose an extra day turned up tomorrow that nobody else knew about. There's nothing expected of you, nothing owed and nothing coming after it. What would you actually do with it?",
          options: [
            { value: 'contributor', label: 'Doing something useful for someone' },
            { value: 'experience_seeker', label: 'Going somewhere new, trying something new' },
            { value: 'freedom_designer', label: 'Keeping the day my own, run my way' },
            { value: 'growth_focused', label: 'Putting time into getting better at something' },
            { value: 'creator', label: 'Making something, or fixing something up' },
            { value: 'relationship_rebuilder', label: 'Spending it with the people who matter' },
            { value: 'rest', label: 'Nothing much. Catching up on rest. I am tired enough as it is' },
            { value: 'none', label: 'Honestly could not say. Nothing springs to mind' },
          ],
          required: true,
        },
      ],
    },

    // Page 38: Q34 — named_absences (capped_multi with exclusive_key)
    {
      id: 'q34-named-absences',
      questions: [
        {
          id: 'q34',
          renderer: 'capped_multi',
          prompt: 'If you had to say what\'s thin on the ground for you at the moment, what would you point to? (Pick up to three, or just "nothing much" on its own if nothing fits.)',
          options: [
            { value: 'more_friends', label: 'People I can count on', help: 'Mates you could actually ring when something happens' },
            { value: 'more_time_to_myself', label: 'More time to myself', help: 'Hours not already spoken for by work or the house' },
            { value: 'something_just_for_me', label: 'Something that is just mine', help: "A thing of your own, not the family's and not the job's" },
            { value: 'more_energy', label: 'More energy', help: 'Something left in the tank at the end of the day' },
            { value: 'getting_back_in_shape', label: 'Getting back into some kind of shape', help: 'The fitness, the weight, what the body can manage' },
            { value: 'something_to_look_forward_to', label: 'Something to look forward to', help: 'A date in the diary that is yours' },
            { value: 'proper_conversation', label: 'A proper conversation', help: 'Past the weather, the football and the logistics' },
            { value: 'building_or_making', label: 'Something of my own to make or build', help: 'A project with your name on it' },
            { value: 'something_im_part_of', label: 'Something I am part of', help: 'A team, a club, a cause, a group' },
            { value: 'nothing_really', label: 'Nothing much, things are alright' },
          ],
          config: { max: 3, exclusiveKey: 'nothing_really' },
          required: false,
        },
      ],
    },
  ],
};

export default manifest;