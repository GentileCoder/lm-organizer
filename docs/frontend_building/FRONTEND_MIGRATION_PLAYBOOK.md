# Frontend Migration Playbook

How to port an existing legacy frontend (server-rendered templates, vanilla JS/jQuery, imperative
DOM manipulation, global mutable state — the "old html architecture") onto the
`FRONTEND_TEMPLATE_SPEC.md` stack, preserving every real piece of functionality while fixing
legacy's mistakes rather than porting them forward unchanged.

> Ship this alongside `AAXON_OS_DESIGN_SYSTEM.md` and `FRONTEND_TEMPLATE_SPEC.md`. Those two
> tell you what the result should look like and how the codebase should be structured;
> `FRONTEND_BUILD_PLAYBOOK.md` tells you the general build/verification discipline. This document
> is specifically about the *translation* problem: getting from an old codebase to a new one
> without silently losing or corrupting functionality along the way. Read the Build Playbook
> too — everything in it still applies; this document only adds what's specific to migrating.

Domain-agnostic throughout. No step here assumes what the legacy app or the new app actually does.

---

## 1. The golden rule: legacy code describes a past backend, not necessarily today's

This is the single most important idea in this document, and the source of the most expensive
mistakes if skipped.

**The legacy frontend was written against whatever the backend looked like when it was written.**
Backends evolve — routes get removed, field names change, enum values get renamed, entire features
get deprecated — and legacy frontend code almost never gets cleaned up in lockstep, because it
still "works" for whatever paths still get exercised. Treating legacy code as an accurate
description of the *current* backend is the default mistake this whole playbook exists to prevent.

**Before porting any single feature, confirm its backend contract fresh, from current backend
source (or a live capture) — never from what the legacy JS assumes.** For every endpoint, field,
and literal enum value the legacy code touches, there are exactly three possible outcomes once you
check the current backend:

1. **Still exists, unchanged.** Port faithfully.
2. **Still exists, but the shape/values have changed.** Migrate to the *new* shape. Do not carry
   the old field names or enum values forward just because that's what the legacy code sent — a
   validator on the backend will often reject the old value outright, and because legacy JS
   typically never validated anything client-side, this kind of drift shipped and worked in the old
   app for years without anyone noticing, right up until the schema tightened.
3. **No longer exists** — a dead route, a removed field, a renamed literal, a feature the backend
   dropped. Do not build UI for it. Record it explicitly as intentionally not migrated, with the
   reason, so it reads as a deliberate decision rather than an oversight later.

Concretely: grep the *current* backend source for the literal route paths, field names, and enum
strings the legacy code references, one by one, before writing the corresponding Vue code. This is
tedious and it is the single highest-leverage step in the entire migration — most silent breakage
in a migrated feature traces back to skipping it.

---

## 2. Inventory before you port anything

1. **Read the entire legacy file(s) for the feature area — not excerpts.** Legacy vanilla-JS files
   accumulate scattered helper functions, DOM-ID-keyed state, and secondary features (a
   "suggest"/autocomplete helper, a history dropdown, a bulk-select button) months apart from the
   primary flow. A partial read — "the parts that look relevant" — reliably misses real,
   user-facing functionality that has no obvious home near the main code path.
2. **Catalog everything, per feature area**, before writing any Vue code:
   - Every distinct UI state/view/mode the feature has.
   - Every field displayed on every card/row/detail view.
   - Every filter, sort, and search control.
   - Every button/action and exactly what it does (not just its label) — including bulk actions,
     undo/dismiss affordances, "select all", history/recent-items dropdowns, and any secondary
     "assist" feature (an AI-suggest button, an autocomplete) that's easy to overlook because it's
     not part of the primary request/response chain.
   - Any client-side persisted state (localStorage, sessionStorage, in-memory globals that survive
     across views).
   - Every endpoint called, and the exact request/response shape the legacy code actually reads —
     not the shape you'd guess from the endpoint's name.
3. **Cross-reference every item in that catalog against the current backend (§1)** before deciding
   it's real. An item that fails the cross-reference gets moved to "not migrating, and here's why,"
   not silently dropped from the catalog.
4. **Produce a written gap list, organized by UI surface** (not by legacy function name — function
   names are an implementation detail of the old codebase and won't map cleanly onto the new one).
   This list is the migration's actual scope. Get it reviewed before writing code proportional to
   how much the migration matters — the cost of a wrong scope call found *after* building is much
   higher than the cost of one more review pass before.

---

## 3. Translate architecture patterns, not literal code

Do not transliterate legacy JavaScript into Vue line-by-line. The old patterns exist because of
constraints (no reactivity, no component model, no real state management) that don't apply
anymore; porting them forward carries the constraints without the excuse. Translate the *pattern*:

| Legacy pattern | New-stack equivalent |
|---|---|
| A global mutable namespace object holding feature state (`APP.currentX`, a module-level `STATE` object) | A Pinia store |
| DOM-ID-keyed render functions (`document.getElementById('x').innerHTML = template(...)`) | A reactive template driven by store/computed state — no manual DOM writes |
| Inline event wiring (`onclick="doThing()"` string attributes, manually attached listeners) | `@click` handlers; data flows via props down, emits up |
| A render-to-DOM-then-re-collect-from-DOM round trip for editable forms (build the DOM from data, later scrape the DOM back into an object on submit) | A real form component bound with `v-model`, deep-cloning **plain data** on init and on every emit — never reach for a browser-native structured-clone API here either; see the Build Playbook's note on why that specific API is unsafe for anything that has touched a reactive framework's state |
| Scattered `fetch()` calls with ad hoc JSON handling, one per feature, sometimes duplicated across features | One API module per backend resource, all routed through a single shared HTTP wrapper (auth injection, session-expiry handling, one place to change error behavior) |
| A single large legacy file mixing state, rendering, and network calls for one whole feature | Split along the store / service / composable / component boundaries the target stack defines — resist rebuilding the same monolith as one big Vue component just because the legacy shape was one big file |
| Manual `EventSource`/streaming-response buffer parsing, reimplemented per feature | One dedicated composable per stream type that owns the connection and exposes reactive state; components never touch the raw stream |
| A generic modal/dialog that tries to handle every "pause and wait for input" case with conditionals inside it | One component per real pause-type (enumerated fresh from the current backend, §1), dispatched from a `phase`-style ref in an orchestration composable — see the Build Playbook §6 |
| A shared legacy helper reused (copy-pasted, not truly shared) across multiple legacy pages | A genuinely shared component/util — but audit it against **every** real consumer immediately, not just the first one ported (see §5) |

---

## 4. Terminology, copy, and content need their own review pass — not just the code

Legacy copy was written for whatever the product's naming was at the time, and for one specific
feature/surface. Two things commonly go wrong when it gets carried into a migration:

- **Product-level renames don't retroactively apply themselves.** If the product or company has
  since renamed or banned a term (a rebrand, a legal/compliance-driven terminology change), grep
  the legacy text for the literal old term — it hides in places that are easy to miss: alt text,
  title attributes, tooltip strings, comments that got copy-pasted into user-facing text, not just
  the obvious visible labels.
- **Copy written for one domain reads wrong when the component becomes shared.** If a legacy panel
  or helper gets consolidated into a component now shared by multiple features, its hint text and
  banners often still say the first domain's specific noun. This is the same failure mode as the
  Build Playbook's §4 (design shared components for every consumer) — it just tends to surface
  during migration specifically because migrations are exactly when previously-separate legacy
  surfaces get consolidated into one shared new component for the first time.

If the app is multi-locale, every fix here must land in **every** locale file in the same pass —
a fix applied only to the primary language file is a half-fix that ships an inconsistent
experience in every other language.

---

## 5. Shared components get extra scrutiny during a migration

Migrations are exactly when components that were previously separate (because they lived in
separate legacy pages) get merged into one shared component for the first time. Apply the Build
Playbook's §4 rule here explicitly, because it's easy to assume a legacy helper that was reused
across two old pages is already "shared" in the sense that matters — it usually is not:

- **Confirm the two legacy call sites' behavior actually matched**, rather than assuming they did
  because they called the same legacy function. Copy-paste-and-drift is extremely common in legacy
  codebases; the two call sites may have quietly diverged (a slightly different field read, a
  slightly different edge case handled) in ways worth knowing about *before* you build one shared
  Vue component that has to serve both.
- Once merged, audit the new shared component's prop API and copy against **both** original
  consumers, not just whichever one you happened to migrate first.

---

## 6. Phased execution, in the same bottom-up order as a fresh build

Migrating a feature does not change the build order from the Build Playbook §2: store → service →
composable → shared components → feature panels → view. Resist the pull to build top-down just
because "the UI already exists, I know what it should look like" — the contract-and-data layer
underneath still needs to be gotten right first, and skipping straight to UI because the shape is
already known is exactly how a wrong field name or a stale enum value (§1) makes it all the way
into a component that otherwise looks correct.

---

## 7. The second pass: audit against legacy, after the first pass "looks done"

Once a feature's initial migration renders, lints, and builds — **do not consider it done yet.**
Run a second, dedicated pass: read the legacy source for that feature area again, line by line,
specifically hunting for what the first pass missed. In practice, the same categories of gap
recur across unrelated migrations:

- **Fields silently dropped.** A shared display card/row often gets built to satisfy the first
  interrupt/response shape it's used for, and every *other* shape that reuses the same card quietly
  loses whatever fields that first shape didn't happen to need.
- **Secondary/bulk actions.** Select-all, deselect-all, add-all, undo/dismiss, a history dropdown,
  an "AI suggest"-style assist endpoint distinct from the main flow — these get skipped
  disproportionately often because the primary happy path doesn't need them to "work," so a
  migration that stops at "the primary flow works" reliably leaves several of these behind.
- **Filters and controls with no Vue equivalent at all**, especially ones that exist on some but
  not all of the legacy surfaces that show the same kind of data — it's easy to port the filter
  panel used by the first surface and forget the other surfaces had one or two fields the first
  one didn't.
- **Stateless "assist" endpoints** called from the legacy UI as a side helper (autocomplete,
  suggestion, validation-on-type) rather than part of the primary request/response chain — these
  don't show up when tracing "what does Start/Submit call," only when reading the full legacy file
  for every button that exists.

Treat this audit's output as a second, real scope list — close it in one deliberate pass rather
than letting fixes trickle in ad hoc as they're noticed. Update the gap list from §2 with what the
audit found so the record of "what legacy had vs. what actually got migrated" stays accurate.

---

## 8. Only then: actually run it, against a real backend, in every mode

A migration that matches legacy's screenshots but has never been executed against a live backend
is not verified — see the Build Playbook §5 in full; it all applies here without modification.
Two migration-specific emphases:

- **Run the feature's default configuration**, not only whichever mode you happened to be looking
  at while porting. A migration can pass a state-by-state visual comparison against legacy and
  still fail immediately the first time a real user runs it with default settings, if a literal
  value baked into that default path drifted per §1 and nobody actually clicked through it.
- **If the migration touches a component shared with an already-migrated, already-"done" feature**,
  re-verify that other feature too once the shared component changes. A bug found in shared code
  during this migration was very likely *already live* in whatever previously consumed that shared
  code — fix it in both places, and say so explicitly when reporting the fix, rather than only
  reporting it against the feature you were actively working on.

---

## 9. Definition of done for a migrated feature

- Every item in the §2 catalog is either ported, or explicitly recorded as intentionally not
  migrated with a stated reason (dead backend contract, superseded by new UX, confirmed
  unreachable) — nothing is silently missing without a note explaining why.
- Every literal value sent to the backend (enum strings, field/param names) has been checked
  against **current** backend source per §1 — none were carried forward from legacy on the
  assumption that they still matched.
- The §7 second-pass audit against legacy has actually happened — "it renders and lints" was never
  treated as sufficient on its own.
- The feature has been run against a real backend in every mode/path it supports, including its
  default configuration, per §8 — with a note of exactly what was and wasn't exercised, so a
  reviewer or a future session can tell verified claims apart from unverified ones.
- Any bug found in a component shared with other, previously-migrated features has been fixed in
  all of them, not just the feature that surfaced it.
- A living progress record (Build Playbook §8) has been updated with what was migrated, what was
  deferred and why, what bugs were found, and exactly what verification was actually performed.
