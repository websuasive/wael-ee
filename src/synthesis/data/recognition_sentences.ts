// Recognition sentences keyed by direction-combination string. Sourced from earlier authoring (provided as data input). TypeKey alignment with SYNTHESIS.md section 6.7 (contribution → contributor) is complete: keys use 'contributor' to match DIRECTION_TO_TYPE_KEY in tokens.ts. The lookup function lives in Phase 3 logic per spec section 10's data/logic separation.

export const recognitionSentences: Record<string, string> = {
  creator:
    "You need to be making something that's genuinely yours: not contributing to someone else's project, not assisting, actually building.",

  experience_seeker:
    "You move through life through range: different contexts, new things, the feeling of being genuinely in it. That's been narrowing.",

  freedom_designer:
    "You can tolerate almost anything if you chose it. What you can't tolerate is feeling owned by obligations you never fully agreed to.",

  relationship_rebuilder:
    "What you're missing is depth: not more people, not networking, but a small number of people who actually know you.",

  growth_focused:
    "You need to feel like you're getting sharper: learning something real, becoming more capable at something that matters. Coasting feels like dying.",

  contributor:
    'You need your work to matter beyond the transaction: not prestige, not appreciation, but the knowledge that something you did genuinely helped.',

  'creator,experience_seeker':
    'You need to be making something genuinely yours, and the making needs to come from actually being out in the world, not just executing inside the same four walls.',

  'creator,freedom_designer':
    "You need to be making something that's genuinely yours, on your own terms: not assigned, not supervised, actually yours.",

  'creator,relationship_rebuilder':
    "You need to be making something real, and you need at least one person who genuinely understands what you're trying to do.",

  'creator,growth_focused':
    "You need to be making something that's genuinely yours, and the making needs to be pushing you: not just executing what you already know how to do.",

  'creator,contributor':
    'You need to be making something real, and it needs to land somewhere, matter to someone, not just be technically well executed.',

  'creator,experience_seeker,freedom_designer':
    'You need to be making something genuinely yours, in different contexts, on your own terms: range, output, and autonomy, all three at once.',

  'creator,experience_seeker,relationship_rebuilder':
    "You need to be making something real, out in the world doing it, with at least one person who genuinely understands what you're trying to build.",

  'creator,experience_seeker,growth_focused':
    'You need to be making something real and getting sharper in the process; the work has to be pushing you, not just deploying what you already know.',

  'creator,experience_seeker,contributor':
    'You need to be making something real, out in the world doing it, and having it land somewhere that matters: execution, range, and purpose.',

  'creator,freedom_designer,experience_seeker':
    'You need to be making something genuinely yours, on your own terms, and the making needs to come from actually being out in the world.',

  'creator,freedom_designer,relationship_rebuilder':
    "You need to be making something genuinely yours, on your own terms, with at least one person who really understands what you're doing.",

  'creator,freedom_designer,growth_focused':
    'You need to be making something genuinely yours, on your own terms, and the work has to be pushing you forward, not just repeating.',

  'creator,freedom_designer,contributor':
    'You need to be making something genuinely yours, on your own terms, and it needs to actually matter: not just be well executed.',

  'creator,relationship_rebuilder,experience_seeker':
    'You need to be making something real, with people who genuinely understand it, and the work needs to take you somewhere new.',

  'creator,relationship_rebuilder,freedom_designer':
    'You need to be making something genuinely yours, alongside people who know you well enough to understand why that matters.',

  'creator,relationship_rebuilder,growth_focused':
    'You need to be making something real, with people who challenge you in the process, and feeling yourself get sharper through the doing.',

  'creator,relationship_rebuilder,contributor':
    'You need to be making something real, with people who matter, and having it land: creativity, depth, and purpose all at once.',

  'creator,growth_focused,experience_seeker':
    'You need to be making something that pushes you, out in the world doing it, not executing what you already know inside the same walls.',

  'creator,growth_focused,freedom_designer':
    "You need to be making something that pushes you, on your own terms: chosen work that's genuinely developing you.",

  'creator,growth_focused,relationship_rebuilder':
    'You need to be making something that pushes you, alongside people who genuinely challenge you: not just support you.',

  'creator,growth_focused,contributor':
    'You need to be making something that pushes you and matters: creative growth in service of something real.',

  'creator,contributor,experience_seeker':
    'You need to be making something real that lands somewhere it matters, and the making needs to come from actually being out in the world.',

  'creator,contributor,freedom_designer':
    'You need to be making something real that matters, on your own terms: chosen output that actually helps.',

  'creator,contributor,relationship_rebuilder':
    'You need to be making something real that matters to specific people who you care about: not scale, but depth and output combined.',

  'creator,contributor,growth_focused':
    'You need to be making something that matters and pushes you: purposeful creative growth.',

  'experience_seeker,creator':
    "You move through life through range and making: different contexts, new places, and the need to have something you're actually building in the middle of it.",

  'experience_seeker,freedom_designer':
    "You move through life through range, and you need that range to be yours: chosen, not assigned, not on someone else's schedule.",

  'experience_seeker,relationship_rebuilder':
    "You move through life through range, and what you're missing is someone to actually move through it with, not just report back to.",

  'experience_seeker,growth_focused':
    "You move through life through range and learning: the feeling of being genuinely in something new and getting sharper while you're in it.",

  'experience_seeker,contributor':
    'You move through life through range, and the range needs to connect to something real, not just accumulate as experience for its own sake.',

  'experience_seeker,creator,freedom_designer':
    'You move through life through range and making, and you need both to be on your own terms, not assigned.',

  'experience_seeker,creator,relationship_rebuilder':
    "You move through life through range and making, and you need at least one person who's genuinely in it with you.",

  'experience_seeker,creator,growth_focused':
    'You move through life through range and making, and both need to be pushing you forward: not just movement for its own sake.',

  'experience_seeker,creator,contributor':
    'You move through life through range and making, and the work needs to land somewhere real: not just accumulate.',

  'experience_seeker,freedom_designer,creator':
    "You move through life through range, on your own terms, and you need something you're actually making in the middle of it.",

  'experience_seeker,freedom_designer,relationship_rebuilder':
    'You move through life through range, on your own terms, and you need people who know you well enough to move with you rather than hold you back.',

  'experience_seeker,freedom_designer,growth_focused':
    'You move through life through range, on your own terms, and the movement needs to be making you sharper: not just passing time.',

  'experience_seeker,freedom_designer,contributor':
    'You move through life through range, on your own terms, and you need the movement to connect to something that matters beyond yourself.',

  'experience_seeker,relationship_rebuilder,creator':
    "You move through life through range, and you need someone to move through it with, and something you're both actually building.",

  'experience_seeker,relationship_rebuilder,freedom_designer':
    "You move through life through range, and you need genuine depth with people you've actually chosen, not just people obligation assigned you.",

  'experience_seeker,relationship_rebuilder,growth_focused':
    'You move through life through range, and you need people who genuinely challenge you as you move, not just watch.',

  'experience_seeker,relationship_rebuilder,contributor':
    'You move through life through range, and you need it to matter to specific people, not just accumulate as personal experience.',

  'experience_seeker,growth_focused,creator':
    "You move through life through range and learning, and the learning needs to be toward something you're actually building.",

  'experience_seeker,growth_focused,freedom_designer':
    'You move through life through range and learning, and you need both to be on your own terms: chosen, not scheduled.',

  'experience_seeker,growth_focused,relationship_rebuilder':
    'You move through life through range and learning, and you need people around you who make the learning deeper, not safer.',

  'experience_seeker,growth_focused,contributor':
    'You move through life through range and learning, and the learning needs to connect to something real, not just develop you abstractly.',

  'experience_seeker,contributor,creator':
    'You move through life through range, and the range needs to produce something: movement that makes and matters.',

  'experience_seeker,contributor,freedom_designer':
    "You move through life through range, and you need it to connect to something real: on your own terms, not someone else's purpose.",

  'experience_seeker,contributor,relationship_rebuilder':
    'You move through life through range, and what you want is for it to genuinely help people you care about, not just accumulate.',

  'experience_seeker,contributor,growth_focused':
    'You move through life through range, and the movement needs to make you sharper in ways that actually help.',

  'freedom_designer,creator':
    'You need autonomy: specifically the kind that lets you make things that are actually yours, not just freedom to do nothing in particular.',

  'freedom_designer,experience_seeker':
    "You need autonomy to move: the freedom to follow what's interesting rather than stay where you're placed.",

  'freedom_designer,relationship_rebuilder':
    'You need to choose your own terms, and you need at least one relationship where the person knows you well enough to understand why that matters so much.',

  'freedom_designer,growth_focused':
    'You need autonomy to grow: the freedom to pursue what you actually want to get good at, not what the role requires.',

  'freedom_designer,contributor':
    'You need your work to be yours and to matter: not supervised contribution, but something you chose to give.',

  'freedom_designer,creator,experience_seeker':
    'You need autonomy to make things and move: freedom, output, and range, all three feeding each other.',

  'freedom_designer,creator,relationship_rebuilder':
    'You need autonomy to make things that are genuinely yours, with people who understand what that means.',

  'freedom_designer,creator,growth_focused':
    'You need autonomy to make things that push you: not just freedom to do nothing, freedom to build and grow.',

  'freedom_designer,creator,contributor':
    'You need autonomy to make things that matter: chosen work, built by you, landing somewhere real.',

  'freedom_designer,experience_seeker,creator':
    "You need autonomy to move and make: freedom to follow what's interesting and build from what you find.",

  'freedom_designer,experience_seeker,relationship_rebuilder':
    'You need autonomy to move, and people who are genuinely alongside you as you do, not waiting for you to come back.',

  'freedom_designer,experience_seeker,growth_focused':
    "You need autonomy to move and learn: freedom to follow what's interesting and get genuinely sharper through it.",

  'freedom_designer,experience_seeker,contributor':
    'You need autonomy to move, and the movement needs to connect to something beyond your own experience.',

  'freedom_designer,relationship_rebuilder,creator':
    "You need autonomy and depth: freedom to choose your own path, with at least one person who genuinely knows you and something you're building.",

  'freedom_designer,relationship_rebuilder,experience_seeker':
    'You need autonomy and depth: freedom to move as you choose, alongside people who are genuinely with you.',

  'freedom_designer,relationship_rebuilder,growth_focused':
    'You need autonomy and depth: freedom to grow how you choose, with people who genuinely challenge you.',

  'freedom_designer,relationship_rebuilder,contributor':
    "You need autonomy and depth: the freedom to give what you've chosen to give, to people who matter.",

  'freedom_designer,growth_focused,creator':
    'You need autonomy to grow, and you need the growth to produce something you can point to.',

  'freedom_designer,growth_focused,experience_seeker':
    "You need autonomy to grow through range: freedom to follow what's interesting and get sharper as you go.",

  'freedom_designer,growth_focused,relationship_rebuilder':
    'You need autonomy to grow, and people around you who are genuinely challenging you to do it.',

  'freedom_designer,growth_focused,contributor':
    'You need autonomy to grow in ways that actually matter: not just self-improvement, purposeful development.',

  'freedom_designer,contributor,creator':
    'You need your work to be yours and to matter: chosen contribution, not assigned service, built by you.',

  'freedom_designer,contributor,experience_seeker':
    'You need your work to be yours and to matter, and the work needs to take you somewhere, not just repeat.',

  'freedom_designer,contributor,relationship_rebuilder':
    'You need your work to be yours and to matter to specific people: not obligation, genuine chosen contribution.',

  'freedom_designer,contributor,growth_focused':
    'You need your work to be yours, to matter, and to be pushing you: chosen, purposeful, developmental.',

  'relationship_rebuilder,creator':
    "What you're missing is depth with people, and making something real alongside them, not just functional collaboration.",

  'relationship_rebuilder,experience_seeker':
    "What you're missing is depth, and the range of shared experience that makes depth possible. Not just knowing someone, actually living something with them.",

  'relationship_rebuilder,freedom_designer':
    "What you're missing is depth: with people you've genuinely chosen, not just the people obligation put in your path.",

  'relationship_rebuilder,growth_focused':
    "What you're missing is depth: people who challenge you as well as know you, relationships where you're actually growing rather than just comfortable.",

  'relationship_rebuilder,contributor':
    "What you're missing is depth: the feeling of being genuinely useful to specific people who matter, not just functionally helpful.",

  'relationship_rebuilder,creator,experience_seeker':
    "What you're missing is depth: with people who understand what you're making and can actually move through the world with you.",

  'relationship_rebuilder,creator,freedom_designer':
    "What you're missing is depth: with people who genuinely understand what you're trying to build, on your own terms.",

  'relationship_rebuilder,creator,growth_focused':
    "What you're missing is depth: people who challenge you and understand what you're building at the same time.",

  'relationship_rebuilder,creator,contributor':
    "What you're missing is depth: people who understand what you're making and feel genuinely helped by it.",

  'relationship_rebuilder,experience_seeker,creator':
    "What you're missing is depth: with people who want to move through the world with you and understand what you're building.",

  'relationship_rebuilder,experience_seeker,freedom_designer':
    "What you're missing is depth with people you've genuinely chosen: not people assigned by obligation, people you'd move toward.",

  'relationship_rebuilder,experience_seeker,growth_focused':
    "What you're missing is depth: people who are genuinely out in the world with you, challenging you as you go.",

  'relationship_rebuilder,experience_seeker,contributor':
    "What you're missing is depth: people you've actually moved through things with, whose lives you've genuinely touched.",

  'relationship_rebuilder,freedom_designer,creator':
    "What you're missing is depth with people you've genuinely chosen, and something you're both building from that place of freedom.",

  'relationship_rebuilder,freedom_designer,experience_seeker':
    "What you're missing is depth with people you've genuinely chosen: people who move with you rather than anchor you.",

  'relationship_rebuilder,freedom_designer,growth_focused':
    "What you're missing is depth with people you've genuinely chosen: who challenge you rather than just support you.",

  'relationship_rebuilder,freedom_designer,contributor':
    "What you're missing is depth with people you've genuinely chosen, and the feeling that you're actually useful to them.",

  'relationship_rebuilder,growth_focused,creator':
    "What you're missing is depth: people who genuinely challenge you, and something you're building together.",

  'relationship_rebuilder,growth_focused,experience_seeker':
    "What you're missing is depth: people who challenge you as you move through the world, not just support you from a distance.",

  'relationship_rebuilder,growth_focused,freedom_designer':
    "What you're missing is depth with people you've chosen: people who make you sharper, not just people who accept you.",

  'relationship_rebuilder,growth_focused,contributor':
    "What you're missing is depth: people who challenge you and whose lives you're genuinely improving.",

  'relationship_rebuilder,contributor,creator':
    "What you're missing is depth: the feeling of being genuinely useful to specific people, building something together.",

  'relationship_rebuilder,contributor,experience_seeker':
    "What you're missing is depth: the feeling of being genuinely useful to specific people as you move through the world with them.",

  'relationship_rebuilder,contributor,freedom_designer':
    "What you're missing is depth with people you've genuinely chosen, and the knowledge that you're actually useful to them.",

  'relationship_rebuilder,contributor,growth_focused':
    "What you're missing is depth: people who make you sharper and whose lives you're genuinely improving.",

  'growth_focused,creator':
    "You need to feel like you're getting sharper, and the sharpening needs to be toward something you're actually building, not just general improvement.",

  'growth_focused,experience_seeker':
    "You need to feel like you're getting sharper, and the learning needs to come from being genuinely out in the world, not from a course or a book.",

  'growth_focused,freedom_designer':
    "You need to feel like you're getting sharper, and you need the freedom to choose what you're getting good at, not have it decided for you.",

  'growth_focused,relationship_rebuilder':
    "You need to feel like you're getting sharper, and you need people around you who are genuinely challenging you, not just supportive.",

  'growth_focused,contributor':
    "You need to feel like you're getting sharper, and the sharpening needs to be in service of something real, not just self-improvement for its own sake.",

  'growth_focused,creator,experience_seeker':
    "You need to feel like you're getting sharper: through making something real, out in the world doing it.",

  'growth_focused,creator,freedom_designer':
    "You need to feel like you're getting sharper through making something genuinely yours: on your own terms.",

  'growth_focused,creator,relationship_rebuilder':
    "You need to feel like you're getting sharper: through building something real, alongside people who genuinely challenge you.",

  'growth_focused,creator,contributor':
    "You need to feel like you're getting sharper through making something that actually matters: not just developing skills in isolation.",

  'growth_focused,experience_seeker,creator':
    "You need to feel like you're getting sharper: through range, through actually being out in the world, and through building from what you find.",

  'growth_focused,experience_seeker,freedom_designer':
    "You need to feel like you're getting sharper through range, and you need the freedom to choose where that range takes you.",

  'growth_focused,experience_seeker,relationship_rebuilder':
    "You need to feel like you're getting sharper: through range and through people who genuinely challenge you as you move.",

  'growth_focused,experience_seeker,contributor':
    "You need to feel like you're getting sharper through range, and the sharpening needs to connect to something real.",

  'growth_focused,freedom_designer,creator':
    'You need autonomy to grow, and the growth needs to produce something you can actually point to.',

  'growth_focused,freedom_designer,experience_seeker':
    "You need the freedom to grow through range: to follow what's genuinely interesting and get sharper as you go.",

  'growth_focused,freedom_designer,relationship_rebuilder':
    'You need autonomy to grow, and people around you who challenge you rather than just let you.',

  'growth_focused,freedom_designer,contributor':
    "You need the freedom to grow in ways that matter: purposeful development that you've chosen and that actually helps.",

  'growth_focused,relationship_rebuilder,creator':
    "You need to feel like you're getting sharper: alongside people who genuinely challenge you, building something in the process.",

  'growth_focused,relationship_rebuilder,experience_seeker':
    "You need to feel like you're getting sharper: through people who challenge you and range that pushes you beyond what you know.",

  'growth_focused,relationship_rebuilder,freedom_designer':
    "You need to feel like you're getting sharper: with people you've genuinely chosen who make you better.",

  'growth_focused,relationship_rebuilder,contributor':
    "You need to feel like you're getting sharper alongside people who matter: growth that's purposeful and relational.",

  'growth_focused,contributor,creator':
    "You need to feel like you're getting sharper, and the sharpening needs to produce something real that actually helps.",

  'growth_focused,contributor,experience_seeker':
    "You need to feel like you're getting sharper: through range, in ways that connect to something beyond your own development.",

  'growth_focused,contributor,freedom_designer':
    "You need to feel like you're getting sharper, and you need to have chosen what you're developing and why it matters.",

  'growth_focused,contributor,relationship_rebuilder':
    "You need to feel like you're getting sharper in ways that genuinely help people: not abstract development, purposeful growth.",

  'contributor,creator':
    'You need your work to matter, and it needs to be something you actually made, not something you facilitated.',

  'contributor,experience_seeker':
    "You need your work to matter, and you need the work to take you somewhere, not just repeat what you've already done.",

  'contributor,freedom_designer':
    "You need your work to matter, and you need to have chosen it, not been assigned it. Contribution on someone else's terms doesn't count.",

  'contributor,relationship_rebuilder':
    'You need your work to matter to specific people: not impact at scale, but the knowledge that you genuinely helped someone who needed it.',

  'contributor,growth_focused':
    'You need your work to matter, and you need to be growing through the doing, not just executing what you already know.',

  'contributor,creator,experience_seeker':
    'You need your work to matter, and it needs to be something you actually made, found out in the world, not executed inside the same box.',

  'contributor,creator,freedom_designer':
    'You need your work to matter, and it needs to be something you actually made, on your own terms.',

  'contributor,creator,relationship_rebuilder':
    'You need your work to matter: built by you, felt by people who are genuinely important to you.',

  'contributor,creator,growth_focused':
    'You need your work to matter, and it needs to be making you better as you do it, not just deploying what you already know.',

  'contributor,experience_seeker,creator':
    'You need your work to matter, and the work needs to take you somewhere and produce something, not just repeat.',

  'contributor,experience_seeker,freedom_designer':
    "You need your work to matter, and the work needs to take you somewhere, on terms you've actually chosen.",

  'contributor,experience_seeker,relationship_rebuilder':
    "You need your work to matter to people you've actually moved through the world with: not impact at scale, specific depth.",

  'contributor,experience_seeker,growth_focused':
    'You need your work to matter and to be making you sharper: purposeful growth through range.',

  'contributor,freedom_designer,creator':
    'You need your work to matter: chosen by you, built by you, given freely.',

  'contributor,freedom_designer,experience_seeker':
    'You need your work to matter: chosen by you, taking you somewhere, not assigned and static.',

  'contributor,freedom_designer,relationship_rebuilder':
    'You need your work to matter: freely chosen, given to people who are genuinely important to you.',

  'contributor,freedom_designer,growth_focused':
    'You need your work to matter: chosen, developmental, purposeful. Not obligation dressed up as meaning.',

  'contributor,relationship_rebuilder,creator':
    'You need to matter to specific people, and you need to be making the thing that makes you useful to them.',

  'contributor,relationship_rebuilder,experience_seeker':
    "You need to matter to specific people: people you've genuinely moved through the world with, not just served.",

  'contributor,relationship_rebuilder,freedom_designer':
    "You need to matter to specific people you've genuinely chosen: not assigned relationships, not obligatory giving.",

  'contributor,relationship_rebuilder,growth_focused':
    'You need to matter to specific people, and the mattering needs to be making you better as well as helping them.',

  'contributor,growth_focused,creator':
    'You need your work to matter and to be making you better: purposeful development that produces something real.',

  'contributor,growth_focused,experience_seeker':
    'You need your work to matter and to be making you sharper: purposeful growth through range and real contact with the world.',

  'contributor,growth_focused,freedom_designer':
    'You need your work to matter and to be making you better: chosen, developmental, genuinely purposeful.',

  'contributor,growth_focused,relationship_rebuilder':
    'You need to matter to specific people, and to be making you better as well as helping them, through work that’s genuinely yours.',
};
