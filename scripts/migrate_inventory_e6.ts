// One-shot inventory migration for Phase E.6.
//
// Schema changes (see types.ts for the new typed shape):
//   * Promote `physical` from a tag value to a typed `experience.physical:
//     boolean` field, consumed by the body-capacity exclusion in recommend.ts.
//   * Replace `venue.type` and `venue.region` with a clean three-shape model:
//       - anywhere   (venue.name === null)
//       - single     (venue.name !== null, venue.examples === null)
//       - category   (venue.name !== null, venue.examples is an array)
//     and add `venue.setting: Setting[]` (a multi-tick facet) plus structured
//     `postal_code` and `country` fields.
//   * Drop the descriptive tags `outdoors`, `local`, `no_booking` (replaced by
//     venue.setting, dropped entirely as low-signal, and the existing
//     `bookable` boolean respectively). All other tag values are preserved as
//     free-form descriptive text per the new design rule (typed fields drive
//     algorithm + filter; tags stay author-driven, not consumed by code).
//
// Execution: this is a one-time script. Re-running is safe — it detects the
// post-migration shape and aborts. A backup is written to
//   src/ui/experience/data/experiences.json.pre-e6.bak
// before any write, in case the migration needs to be rolled back.
//
// Tooling note: the repo has no `tsx` / `ts-node` installed, so this is run
// by compiling with the in-repo `tsc` to a temp directory and executing the
// resulting JS. The TS source is the committed artefact; the compiled JS is
// transient.

import * as fs from 'node:fs';
import * as path from 'node:path';

// Resolve relative to process.cwd(): the script is intended to be run from
// the repo root (e.g. `pnpm exec ...`). Using cwd rather than __dirname
// also lets us compile to a temp directory and execute from there without
// the script having to know its own real location.
const REPO_ROOT = process.cwd();
const INVENTORY_PATH = path.join(
  REPO_ROOT,
  'src/ui/experience/data/experiences.json',
);
const BACKUP_PATH = path.join(
  REPO_ROOT,
  'src/ui/experience/data/experiences.json.pre-e6.bak',
);

type OldVenueType =
  | 'specific_venue'
  | 'anywhere'
  | 'your_home'
  | 'app_or_platform'
  | 'community_org';

interface OldVenue {
  name: string | null;
  url: string | null;
  type: OldVenueType;
  region: string;
}

interface OldExperience {
  id: string;
  name: string;
  directions: string[];
  friction: string;
  scale: string;
  cost_tier: string;
  cost_max_gbp: number;
  context: string[];
  tags: string[];
  interest_domains: string[];
  venue: OldVenue;
  description: string;
  why_it_works: string;
  experience_types: string[];
  bookable: boolean;
  seasonal: boolean;
}

interface VenueExample {
  name: string;
  postal_code: string | null;
  country: string;
  url: string | null;
}

interface NewVenue {
  setting: string[];
  name: string | null;
  postal_code: string | null;
  country: string | null;
  url: string | null;
  examples: VenueExample[] | null;
}

interface NewExperience {
  id: string;
  name: string;
  directions: string[];
  friction: string;
  scale: string;
  cost_tier: string;
  cost_max_gbp: number;
  context: string[];
  physical: boolean;
  tags: string[];
  interest_domains: string[];
  venue: NewVenue;
  description: string;
  why_it_works: string;
  experience_types: string[];
  bookable: boolean;
  seasonal: boolean;
}

// Tags carried directly as content signal. 'outdoors' moves to venue.setting.
// 'physical' moves to experience.physical. 'local' is dropped as low-signal
// (meaningless without user location). 'no_booking' is dropped because the
// existing experience.bookable boolean already encodes the same fact.
const TAGS_TO_DROP: ReadonlySet<string> = new Set([
  'physical',
  'outdoors',
  'local',
  'no_booking',
]);

function deriveSetting(oldTags: readonly string[]): string[] {
  // Inventory content review will refine venue.setting per entry. For the
  // initial migration we surface only the one signal that the inventory
  // currently carries (`outdoors`); everything else lands on the catch-all
  // 'mixed' value, which the filter UI labels as "Mixed / Anywhere".
  if (oldTags.includes('outdoors')) return ['outdoors'];
  return ['mixed'];
}

function deriveVenue(oldVenue: OldVenue, oldTags: readonly string[]): NewVenue {
  const setting = deriveSetting(oldTags);

  switch (oldVenue.type) {
    case 'specific_venue':
      // Single concrete venue. Country defaults to GB if a name is present
      // (the entire current inventory is UK-targeted; content review can
      // refine per entry). postal_code is left null pending content review.
      return {
        setting,
        name: oldVenue.name,
        postal_code: null,
        country: oldVenue.name !== null ? 'GB' : null,
        url: oldVenue.url,
        examples: null,
      };

    case 'anywhere':
    case 'your_home':
      return {
        setting,
        name: null,
        postal_code: null,
        country: null,
        url: null,
        examples: null,
      };

    case 'community_org':
    case 'app_or_platform':
      // Category venue: a class of place / platform with concrete examples
      // to follow. The migration leaves `examples: []` so the typed
      // distinction is in place; content review fills the array.
      return {
        setting,
        name: oldVenue.name,
        postal_code: null,
        country: null,
        url: oldVenue.url,
        examples: [],
      };
  }
}

function cleanTags(oldTags: readonly string[]): string[] {
  return oldTags.filter((t) => !TAGS_TO_DROP.has(t));
}

function migrateEntry(old: OldExperience): NewExperience {
  return {
    id: old.id,
    name: old.name,
    directions: old.directions,
    friction: old.friction,
    scale: old.scale,
    cost_tier: old.cost_tier,
    cost_max_gbp: old.cost_max_gbp,
    context: old.context,
    physical: old.tags.includes('physical'),
    tags: cleanTags(old.tags),
    interest_domains: old.interest_domains,
    venue: deriveVenue(old.venue, old.tags),
    description: old.description,
    why_it_works: old.why_it_works,
    experience_types: old.experience_types,
    bookable: old.bookable,
    seasonal: old.seasonal,
  };
}

interface InventoryFile {
  version: string;
  experiences: unknown[];
}

function main(): void {
  const raw = fs.readFileSync(INVENTORY_PATH, 'utf-8');
  const inventory = JSON.parse(raw) as InventoryFile;

  // Idempotency check: bail if the inventory has already been migrated.
  const first = inventory.experiences[0] as Record<string, unknown> | undefined;
  if (
    first !== undefined &&
    'physical' in first &&
    typeof first.venue === 'object' &&
    first.venue !== null &&
    'setting' in (first.venue as Record<string, unknown>)
  ) {
    console.error('Inventory appears to be already migrated. Aborting.');
    process.exit(1);
  }

  fs.copyFileSync(INVENTORY_PATH, BACKUP_PATH);
  console.log(`Backup written: ${BACKUP_PATH}`);

  const migrated = {
    version: '2.0',
    experiences: (inventory.experiences as OldExperience[]).map(migrateEntry),
  };

  fs.writeFileSync(
    INVENTORY_PATH,
    JSON.stringify(migrated, null, 2) + '\n',
    'utf-8',
  );
  console.log(`Migrated ${migrated.experiences.length} entries.`);

  // Summary stats so the run is auditable.
  const settings: Record<string, number> = {};
  for (const e of migrated.experiences) {
    for (const s of e.venue.setting) {
      settings[s] = (settings[s] ?? 0) + 1;
    }
  }
  console.log(`Setting distribution: ${JSON.stringify(settings)}`);

  const physicalCount = migrated.experiences.filter((e) => e.physical).length;
  console.log(
    `Physical: ${physicalCount} / ${migrated.experiences.length}`,
  );

  const venueShapes: Record<string, number> = {};
  for (const e of migrated.experiences) {
    const shape =
      e.venue.name === null
        ? 'anywhere'
        : e.venue.examples !== null
          ? 'category'
          : 'single';
    venueShapes[shape] = (venueShapes[shape] ?? 0) + 1;
  }
  console.log(`Venue shape distribution: ${JSON.stringify(venueShapes)}`);

  const nonEmptyTags = migrated.experiences.filter(
    (e) => e.tags.length > 0,
  ).length;
  console.log(
    `Entries with non-empty tags after cleanup: ${nonEmptyTags} / ${migrated.experiences.length}`,
  );
}

main();
