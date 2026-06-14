// Self-report items metadata. Sourced verbatim from SYNTHESIS.md §6.11.
// Consumed by:
//   - synthesis/comparison_surface.ts (§5.10) — via architectural_anchors.
//   - EXPERIENCE.md (downstream arc) — via influences_experience_layer.
// The engine does NOT read this file (engine amendment §3.1: self_report is
// read for validation only; architectural interpretation lives in synthesis).

import type {
  DirectionName,
  DomainName,
  SelfReportItemId,
  WeekShapeFlags,
} from '../../engine';

export type SelfReportAnchor =
  | { kind: 'domain'; name: DomainName }
  | { kind: 'direction'; name: DirectionName }
  | { kind: 'constraint'; name: 'energy' | 'time' | 'body' | 'permission' }
  | { kind: 'week_shape_flag'; name: keyof WeekShapeFlags };

export type SelfReportItem = {
  id: SelfReportItemId;
  label: string;
  architectural_anchors: SelfReportAnchor[];
  influences_experience_layer: boolean;
};

/**
 * §6.11 — The committed ten-item array.
 *
 * The v2 cross-kind anchor additions (Round 1 finding) are absorbed:
 *   - more_friends adds week_shape_flag: sees_people
 *   - building_or_making adds week_shape_flag: makes_things
 *   - getting_back_in_shape adds week_shape_flag: active_body
 *
 * Other items (something_just_for_me, proper_conversation) deliberately do
 * not gain flag anchors — looser architectural-flag overlap (§6.11 v2 note).
 */
export const SELF_REPORT_ITEMS: ReadonlyArray<SelfReportItem> = [
  {
    id: 'more_friends',
    label: 'More friends',
    architectural_anchors: [
      { kind: 'direction', name: 'relationship_rebuilder' },
      { kind: 'domain', name: 'friendship' },
      { kind: 'week_shape_flag', name: 'sees_people' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'more_time_to_myself',
    label: 'More time to myself',
    architectural_anchors: [
      { kind: 'direction', name: 'freedom_designer' },
      { kind: 'domain', name: 'time_as_yours' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'something_just_for_me',
    label: 'Something just for me (a hobby, an interest)',
    architectural_anchors: [
      { kind: 'direction', name: 'experience_seeker' },
      { kind: 'direction', name: 'creator' },
      { kind: 'domain', name: 'curiosity' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'more_energy',
    label: 'More energy',
    architectural_anchors: [
      { kind: 'domain', name: 'energy_as_resource' },
      { kind: 'constraint', name: 'energy' },
    ],
    influences_experience_layer: false,
  },
  {
    id: 'getting_back_in_shape',
    label: 'Getting back in shape',
    architectural_anchors: [
      { kind: 'domain', name: 'body_physical_aliveness' },
      { kind: 'week_shape_flag', name: 'active_body' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'something_to_look_forward_to',
    label: 'Something to look forward to',
    architectural_anchors: [
      { kind: 'direction', name: 'experience_seeker' },
      { kind: 'domain', name: 'felt_aliveness' },
      { kind: 'week_shape_flag', name: 'varied_week' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'proper_conversation',
    label: 'A proper conversation now and then',
    architectural_anchors: [
      { kind: 'domain', name: 'conversation_depth' },
      { kind: 'domain', name: 'being_known' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'building_or_making',
    label: 'Building or making something',
    architectural_anchors: [
      { kind: 'direction', name: 'creator' },
      { kind: 'domain', name: 'making' },
      { kind: 'week_shape_flag', name: 'makes_things' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'something_im_part_of',
    label: "Something I'm part of",
    architectural_anchors: [
      { kind: 'direction', name: 'contributor' },
      { kind: 'domain', name: 'mattering' },
      { kind: 'week_shape_flag', name: 'belongs_to_group' },
    ],
    influences_experience_layer: true,
  },
  {
    id: 'nothing_really',
    label: "Nothing really, I'm fine",
    architectural_anchors: [],
    influences_experience_layer: false,
  },
];

export function getSelfReportItem(
  id: SelfReportItemId,
): SelfReportItem | undefined {
  return SELF_REPORT_ITEMS.find((item) => item.id === id);
}
