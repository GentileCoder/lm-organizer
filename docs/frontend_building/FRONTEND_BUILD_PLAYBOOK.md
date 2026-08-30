# Frontend Build Playbook

How to actually build a frontend on the `FRONTEND_TEMPLATE_SPEC.md` stack — the process,
sequencing, and verification discipline. Not what to build (that's the domain's job to specify)
and not what it should look like (`AAXON_OS_DESIGN_SYSTEM.md`) or how the codebase is structured
(`FRONTEND_TEMPLATE_SPEC.md`) — this is the third leg: **how to go from "nothing" to "a real,
verified feature"** without the process itself introducing bugs.

> Ship all three documents together. `AAXON_OS_DESIGN_SYSTEM.md` is the visual authority,
> `FRONTEND_TEMPLATE_SPEC.md` is the structural authority, this document is the process authority.
> None of them restate the others' content on purpose — if something seems missing here, check
> whether it belongs in one of the other two first.

This document is domain-agnostic. Examples below use a generic "Invoices"-style feature (same
placeholder domain the template spec uses) purely for illustration — nothing here assumes what
your app actually does.

---

## 1. Before writing code: the backend contract is truth, not the ticket/spec/memory

The single biggest source of wasted work and shipped-but-broken features is building against an
*assumed* contract instead of the *actual* one. Before designing any screen that talks to a
backend:

1. **Read the backend's actual source (or a live schema/OpenAPI doc, or a real request/response
   capture) for every endpoint the feature needs.** Not the ticket description. Not a similar
   feature in another app. Not what a teammate said it does. APIs drift out from under docs
   constantly; source code (or a live call) doesn't lie.
2. **Enumerate every literal value a field can take** — enum strings, status codes, type
   discriminators — directly from the validator/schema that enforces them, not from a comment or
   a docstring describing them. A comment can be stale; a `Literal[...]`/enum/JSON-schema
   `enum:` array that the runtime actually validates against cannot be (see §7's gotcha list for
   what happens when you build against the comment instead).
3. **If the backend has any "pause and wait for the user" mechanism** — human-in-the-loop review
   steps, approval gates, wizard checkpoints, anything where execution stops mid-flight and
   resumes on a follow-up payload — get the *complete* list of distinct pause-types directly from
   the backend (grep for the literal type/state names it can emit), not from whatever a similar
   app happened to implement. Design one UI branch per real pause-type. A pause-type with no
   matching branch in your UI does not merely "not render nicely" — depending on how the
   orchestration layer is written, it can leave the whole screen blank with no error at all (see
   §7).
4. **Pause-vs-error is a common backend design worth designing your frontend around explicitly**:
   many backends distinguish "stopped and waiting for input" from "something broke" as two
   completely different, non-overlapping signals — a stream/response can simply end with neither
   an error nor a final result, meaning "go poll for a pending pause." If your contract works this
   way, build the poll-after-silence step as a first-class part of your orchestration composable
   from day one, not as an afterthought once someone notices approvals never render.
5. Only after the contract is nailed down, clarify pure business/UX questions that genuinely can't
   be answered from source (copy, ordering, what counts as "done" for this feature).

---

## 2. Sequencing: build bottom-up, one layer at a time

For a new feature or domain area, build in this order — each layer should lint/build clean before
the next one depends on it:

1. **Store** (Pinia) — model the domain's state shape. Get the field names and defaults right
   here; everything downstream inherits them.
2. **Service / API layer** — the network contract, per `FRONTEND_TEMPLATE_SPEC.md` §8. One
   function per endpoint, thin, no transformation.
3. **Composable(s)** — the orchestration/business logic: a streaming/run composable, a
   filter/derivation composable, whatever ties store + service together into behavior a component
   can just call.
4. **Shared display components** — cards, list items, filter panels: anything more than one
   surface in this feature will reuse. Building these before the surfaces that consume them means
   the *first* consumer's requirements don't accidentally become the *only* requirements baked
   into the component's API.
5. **Feature-specific panels/screens** — assemble the shared components into the actual UI for
   each state/mode/pause-type identified in §1.
6. **The view** — resolves route params, wires store + composable + panels together. Views stay
   thin (`FRONTEND_TEMPLATE_SPEC.md` §11.1); if a view has any nontrivial logic, that logic belongs
   in a composable instead.

Building top-down (start from the view, stub everything below it) hides contract mistakes until
very late, when they're expensive to unwind. Building bottom-up surfaces them at the layer where
they're cheap to fix.

---

## 3. Plan before code, proportionally to risk

For anything touching more than a couple of files, or where the right approach genuinely isn't
obvious, write a short plan before implementing: what files, why, in what order, and — critically —
which facts in the plan are **confirmed** (read from source, tested live) versus **assumed**. Mark
the difference explicitly. A wrong assumption that's labeled as an assumption gets caught in
review; a wrong assumption presented as a confirmed fact gets built on top of and discovered much
later, usually by a user.

This doesn't need to be a formal document for small work — a few sentences of stated plan is
enough. The point is forcing the "have I actually verified this, or am I guessing" question before
code gets written, not producing paperwork.

---

## 4. Shared components: design for every consumer, not just the first

The moment a component, a composable, or a block of copy is used by a **second** feature/domain,
go back and ask two questions immediately — not "eventually," not "if it becomes a problem":

- Does this component's **prop API** assume something only the first consumer needed (a fixed enum
  of options, a field name specific to that domain)?
- Does this component's **copy** (labels, hints, banner text) name the first consumer's domain
  explicitly ("publication", "invoice", whatever noun the first feature happened to use)? If so, it
  will read wrong — confusingly, visibly wrong — the moment the second consumer renders it.

Both are easy to introduce accidentally (you're only thinking about the feature in front of you)
and easy to miss in review (the component "works," it's just wrong for the *other* caller, and
nobody's looking at it from that caller's screen). Do the audit at the point of reuse, not later.

---

## 5. Verification: lint and build passing proves almost nothing

A component that lints clean, builds clean, and renders without a console error can still:

- send a request payload the backend will reject outright (a wrong enum value, a missing
  required field) — nothing in the frontend build pipeline checks this;
- silently no-op a feature (a filter that never actually filters, a button that updates the wrong
  piece of state) — nothing renders differently, nothing errors, it just doesn't do anything;
- crash the instant it receives *real* data shaped differently than the mocked/small dataset it
  was written against (see §7's flexbox and Proxy/clone gotchas — both are invisible until the
  data is real and large enough).

None of that shows up in a type-check or a lint pass. The only way to catch it is to actually run
the feature, against a real (or realistic) backend, with real data, and watch it happen.

### 5.1 What "actually run it" means

- **Click through the DEFAULT configuration first**, not just the paths you had to explicitly
  opt into while building. It's very easy to test every *non-default* radio option/checkbox state
  because you were actively toggling them while developing, and never once run the screen exactly
  as a fresh user would land on it. The default path is what almost everyone hits first — verify
  it explicitly, every time, even though it feels redundant with "I tested the feature."
- **Exercise every branch**, not just the happy path. If a component has five `v-if`/`v-else-if`
  states for five different backend response shapes, "I tested it" means five runs, not one. An
  unexercised branch is unverified, full stop — confidence that it "should" work based on reading
  the code is not the same thing as having watched it work.
- **Use a real browser against a real backend** for anything with actual network calls or nontrivial
  CSS layout, not just a component-level unit test. A meaningful share of the bug classes in §7
  only manifest with a real DOM, a real network round trip, and real response payload sizes/shapes
  — they are invisible to a mocked unit test.
- **Screenshot every stage of a multi-step flow**, and check the browser console for errors *and*
  warnings after every state transition — not only at the very end. A crash three steps into a
  five-step flow can leave stages four and five looking fine in a final screenshot while stage
  three silently failed.
- **Confirm dark mode** (and, for a multi-locale app, at least one non-default locale) for any new
  visual surface before calling it done — a pale, light-mode-only tint on a dark canvas is a
  five-second check that's routinely skipped.
- If the feature streams or polls, **actually wait for the slow path** rather than assuming a quick
  timeout means "broken." An agentic/LLM-backed endpoint that takes 20–30 seconds is normal, not
  a bug — confirm against a direct call to the endpoint (curl or equivalent) before concluding the
  frontend integration is at fault for something that's just genuinely slow.

---

## 6. Human-in-the-loop / pause-and-resume UI, if your backend has it

If §1.3–1.4 applies to your backend, the orchestration composable driving this UI needs a few
properties that are easy to get wrong:

- Keep a single `phase` (or equivalent) ref that's either a known UI state (`'form'`, `'running'`,
  `'results'`) or one of the backend's real pause-type identifiers — and render one component
  branch per value. Never fall through to "nothing" for an unrecognized value; if your data model
  allows a value with no branch, that is a bug waiting to blank the screen the moment the backend
  actually sends it (a deferred/unimplemented pause-type is exactly this case — see §7.5).
- Treat "the resume request succeeded" as committed the moment the backend acknowledges it. If a
  *following* status check fails on a transient error, retry only that follow-up check in
  isolation — never retry the whole "resume + check" unit as one bundle, or you risk re-sending the
  same resume value to a run that has already moved past that pause point.
- On any resume/interrupt-handling error, return the user to the state they were reviewing (not
  back to a blank form) — a failed submission of a review hasn't lost the thing being reviewed, it
  just needs retrying.
- If the same pause-type can be surfaced in more than one execution mode (e.g. a step-by-step
  screen and a conversational/chat mode), the resume/response handling for it is usually
  structurally different between modes — verify each mode's version independently; don't assume
  the pattern that works in one mode carries over unchanged to the other.
- **Optional, once a workflow's phase list gets long:** a flat one-branch-per-phase dispatch (the
  baseline pattern above) stops orienting the user once there are enough sequential phases that
  they lose track of where they are or what already happened. At that point, consider a numbered
  step-dot trail above the active panel — one dot per step, filled for done, a ring around the
  current one, a check on the finished report; clicking an earlier dot opens a read-only preview
  of that step, clicking the current dot returns to the live view. Don't build this preemptively —
  it's real UI surface for something a 3-4 phase flow doesn't need; reach for it only once users
  are visibly losing their place in a longer run.

---

## 7. Common gotchas — check this list before you file a bug as "mysterious"

These recur across unrelated codebases on this exact stack. If something is behaving impossibly,
check here first.

### 7.1 A missing i18n key is truthy

`t('some_key')` returns the key string itself when the key doesn't exist — which is truthy. Any
`t('key') || 'fallback'` pattern **never falls back**, silently, even for a genuinely missing key.
Don't rely on that pattern; add the key, or check for it explicitly if a real fallback is needed.

### 7.2 A wrapped input component silently drops constraint props

A custom input component with an internal wrapper (`label` → `input` → `hint`, all inside one root
`<div>`) only auto-forwards undeclared attrs to that **root** element (Vue's default attrs
fallthrough targets the single root element). Any prop the wrapper doesn't explicitly declare and
bind onto the *inner* control — `min`, `max`, `step`, `pattern`, `autocomplete`, etc. — silently
lands on the outer div instead, where it does nothing. No error, no warning: the constraint you
passed simply never applies to the real `<input>`. Declare every such prop explicitly on the
wrapper component and bind it onto the inner element.

### 7.3 `structuredClone()` cannot serialize a Vue reactive Proxy

Any object that has passed through a `ref()`/`reactive()` — including something you read off
*another* composable's exposed ref (`someComposable.value.nestedField`) — is wrapped in a reactive
Proxy by the time you touch it, even if the original value was plain JSON-safe data. The browser's
native `structuredClone()` cannot serialize that Proxy (its internal getter traps aren't part of
the structured-clone algorithm) and throws `DataCloneError`.

This is unusually dangerous because the throw happens **synchronously inside `setup()`**, which is
an unhandled error that crashes the component's mount with no visible error state — the screen
just goes blank where that component should have rendered, with nothing telling the user or an
unsuspecting developer why. Use `JSON.parse(JSON.stringify(x))` for a plain-data deep clone
instead; it reads through the Proxy transparently via ordinary property access. (This does mean
`undefined` values and functions are dropped — fine for plain form/record data, wrong for anything
containing those on purpose.)

### 7.4 A fixed-height scrollable flex column can shrink its children to zero

A `display: flex; flex-direction: column` container with `max-height` + `overflow-y: auto`, whose
children have `overflow` set to anything other than `visible` (very common — rounded-corner cards
use `overflow: hidden`), hits a specific flexbox rule: the automatic minimum size resolves to
**zero** for a flex item with non-visible overflow. Once the children's combined natural height
exceeds the container's max-height, the flex algorithm shrinks every child toward that zero floor
instead of just letting the container scroll — every item collapses to a couple of pixels tall,
with no error, no warning, and (usually) still-correct DOM content underneath the collapsed box.

This only manifests once there's enough content to actually exceed the container's height — a
list with one or two test items never triggers it, which is exactly why it survives testing and
only shows up once real, larger data flows through. Fix with `flex-shrink: 0` on the children.

### 7.5 An unhandled state value blanks the screen, not an error

If a state/phase value drives a `v-if`/`v-else-if` chain and no branch matches (an unimplemented
pause-type, a value the backend added since you last checked its contract, a state left over from
a bug elsewhere), Vue renders **nothing** for that branch — no fallback, no error, nothing in the
console. From the user's perspective this is indistinguishable from "the app is broken," and from
a developer's perspective it's genuinely hard to diagnose without knowing to check the driving
state value directly, since there's no stack trace pointing at the missing branch. Prefer either an
explicit `v-else` fallback (an error/reset affordance) over silently rendering nothing, or make sure
your state model is provably exhaustive against the backend's real contract (§1.3).

### 7.6 Gate on an explicit signal, never on the truthiness of an ambiguous field

If a backend response distinguishes "success" from "failure" via a field whose *content* varies
(an error message string, a code that's sometimes empty) rather than a dedicated unambiguous
signal (a `severity` enum, an explicit `success: boolean`, an HTTP status), never write
`if (payload.error)` as the failure check. An empty string, a zero, a `false` are all falsy in
JavaScript — a backend that legitimately sends `{"error": "", "severity": "fatal"}` (some
exceptions genuinely stringify to an empty message) will silently pass a `if (payload.error)` check
as "no error at all." Check for the presence of the unambiguous signal field instead, and use the
message only for display: `if (payload.severity) showError(payload.error || 'Something went wrong')`.

### 7.7 `--fix` reformats everything it touches, not just your change

Running a linter/formatter with an auto-fix flag across a whole directory reformats **every** file
matched, including ones you didn't intend to change — purely cosmetic whitespace/wrapping diffs on
unrelated files bloat the commit and hide the actual change. Scope the fix command to the files you
actually edited, or diff afterward and revert incidental reformatting on anything outside your
intended change set.

### 7.8 Never print secret-bearing files to any persisted or shared output

`.env` contents, credential files, API keys — never `cat`/`diff`/echo them directly into a
terminal, log, or transcript that might be persisted, copied, or shared. Check presence, emptiness,
or length only (`KEY=` set vs. empty), never the value itself. A single accidental print can leak a
real credential into a place it can't be un-leaked from.

---

## 8. Keep a living progress record

For any build that spans more than a single sitting, maintain a short running document (separate
from this playbook) recording: what's built, what's actually been verified and how (which
modes/paths were run against a real backend, not just lint/build-checked), what's deliberately
deferred and why, and any bugs found — especially ones in shared code that might also affect other
features already believed to be "done." This is what lets a later session (a different session, a
different person, a different agent) pick up accurately instead of re-deriving context or
re-trusting a stale "this works" claim.

---

## 9. Optional: a backend-for-frontend (BFF) proxy layer

Most apps built on this spec talk directly to one first-party backend and need nothing more — the
API layer in §8 of `FRONTEND_TEMPLATE_SPEC.md` is the whole story. Reach for a thin proxy backend
of your own only when at least one of these is actually true, not speculatively:

- The frontend would otherwise need a third-party API key or secret client-side to talk to an
  upstream service directly.
- More than one upstream origin needs to sit behind a single CORS/auth boundary the browser talks
  to, instead of the browser juggling several origins and credentials itself.
- A backend's streaming protocol (a non-browser-native SSE framing, a different transport
  entirely) needs translating into something `fetch`/`EventSource` on the frontend can consume
  as-is.

If none of those apply, don't add this layer "in case it's useful later" — it's a whole extra
service to run, deploy, and keep in sync, for no present benefit.

When one of them does apply, a minimal proxy (Express + a plain HTTP client is enough; nothing
here requires a specific framework) should have:

- **A fail-fast preflight check on boot.** Verify the upstream(s) it proxies are reachable before
  binding its own port, and exit non-zero if not — starting up "successfully" while unable to
  serve any real request just delays the failure to the first user request instead of to
  deploy/restart time, where it's easier to notice and fix.
- **A per-request id attached at the edge**, threaded through to every log line for that request.
  Without it, correlating "which frontend action caused this backend log line" across a proxy hop
  is guesswork.
- **Auth proxied to a separate identity service, not owned by this layer.** The BFF's job is to
  attach/verify a token on the way through, not to be where passwords or sessions live — keep that
  concern in the identity service it delegates to, the same way `httpClient.js` (§8.2) only reads
  a token, never issues one.

Everything else in this document and in `FRONTEND_TEMPLATE_SPEC.md` — directory layout, stores,
composables, styling, i18n — is unchanged by adding this layer. The frontend's `services/` still
calls one base URL; it's simply the proxy's URL instead of the origin backend's.
