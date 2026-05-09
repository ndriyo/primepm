# Quickstart — Actuals Capture

**Feature**: 003-actuals-capture
**Audience**: a developer (or reviewer) who wants to verify the feature end-to-end on their local machine.

This is the manual acceptance walkthrough. Every numbered step maps to a
spec acceptance scenario or success criterion. Run it after `tasks.md` is
implemented; if any step fails, the feature is not done.

---

## 0. Prerequisites

- Node 20+ and npm installed.
- Local Supabase running OR a `.env` file with `VITE_API_URL` and Supabase
  credentials pointing at a remote dev project.
- A Postgres role with the new migration applied:

  ```bash
  npm run db:migrate:dev    # applies prisma/migrations/20260509120000_add_task_actuals/
  ```

- Dev server running:

  ```bash
  npm run dev
  ```

Open the app at the printed URL and sign in.

---

## 1. Create a baseline scenario (1 minute)

> *Skip if a baseline-tracked project already exists.*

1. Create a new project "Actuals demo".
2. Add three sibling tasks under one summary "Phase X":
   - `A` — duration 4d, depends on nothing.
   - `B` — duration 6d, FS-dependency on `A`.
   - `C` — duration 2d, FS-dependency on `B`.
3. (Once feature 002 ships) "Set baseline" on the project. If 002 is not yet
   landed, skip this step and ignore acceptance scenarios that reference the
   baseline; the spec's User Story 4 AS3 explicitly handles the no-baseline
   case.

---

## 2. User Story 1 — record actuals without disturbing the plan (P1)

Maps to spec User Story 1 acceptance scenarios.

1. Click task `A` to open the task inspector.
2. In the **Actual** group, enter:
   - **% complete** = `50`
   - **Actual start** = today minus 7 days
   - **Actual finish** = (leave empty)
3. Tab out of the field — the inspector saves automatically (no separate save
   button per FR-010).
4. Reload the page (F5).

✅ **Pass criteria** (SC-001, SC-002, US1.AS1):

- Task `A` still shows `50%`, the `Actual start` field is preserved.
- The `Planned start` and `Planned finish` displayed in the inspector are
  identical to before. (US1.AS2)
- If a baseline was set in step §1.3, the baseline-bar position on the Gantt
  for task `A` is byte-for-byte identical to before. (US1.AS3, SC-004)

---

## 3. User Story 2 — same place as other task edits (P1)

Maps to spec User Story 2.

1. Open task `B`'s inspector.
2. Visually confirm: `% complete`, `Actual start`, `Actual finish` are
   present in the same panel as `Name`, `Duration`, `Schedule mode`,
   `Constraint` — no separate tab, modal, or accordion.
3. With the `% complete` field focused, press Tab twice.

✅ **Pass criteria**:

- Focus moves: `% complete` → `Actual start` → `Actual finish` → next existing
  field. No focus-trap. (US2.AS2)
- Editing the task `Name` and the `% complete` in the same session, then
  blurring once, persists both in a single network round-trip (open dev tools
  → Network and confirm one PATCH request, not two). (US2.AS3, FR-010)

---

## 4. User Story 3 — invalid input rejection (P2)

Maps to spec User Story 3.

For each row below, attempt the edit on task `B` and confirm the inspector
rejects it with the listed message. None of the attempts should leave a
partial save behind (verify by reloading after each attempt).

| Field | Value entered | Expected message |
|---|---|---|
| `Actual finish` | a date earlier than the saved `Actual start` | "Actual finish cannot be earlier than actual start" |
| `% complete` | `-1` | "% complete must be between 0 and 100" |
| `% complete` | `150` | "% complete must be between 0 and 100" |
| `% complete` | `42.5` | "% complete must be a whole number" |

✅ **Pass criteria** (US3.AS1–AS3, SC-005):

- Each rejected save highlights the offending field.
- Correcting the value and blurring causes the save to succeed.
- A network sniff confirms a 400 response with the exact error code
  documented in `contracts/api.md`.

---

## 5. User Story 4 — baseline / scheduled / actual side-by-side (P2)

Maps to spec User Story 4.

1. On task `A`, set baseline / scheduled / actual to three distinct date
   ranges. (If no baseline feature available, use scheduled vs. actual only;
   see AS3.)
2. Open the inspector.

✅ **Pass criteria** (US4.AS1, SC-006):

- Three labeled groups visible: `Baseline`, `Scheduled`, `Actual`.
- A reader can compare planned vs. actual without scrolling within the
  inspector.

3. Add task `C` with no actuals recorded. Open its inspector.

✅ **Pass criteria** (US4.AS2):

- The actuals fields are present but empty, labeled "not yet recorded"
  (FR-009 — not zero, not pre-populated).

4. Open the Gantt view.

✅ **Pass criteria** (US4.AS4–AS5, SC-009):

- For task `A`: three distinct horizontal bars/tracks in the same row —
  baseline (or its absence), current, actuals.
- For task `C`: only baseline + current bars; no actuals track for that row.
- At 1280 px viewport width, no horizontal scroll appears just from the new
  track.

---

## 6. User Story 5 — summary rollup (P3)

Maps to spec User Story 5.

1. On the three children of summary `Phase X`, set:

| Child | duration | % complete | Actual start | Actual finish |
|---|---|---|---|---|
| `A` | 4 | 100 | 2026-05-01 | 2026-05-04 |
| `B` | 6 | 50 | 2026-05-05 | (empty) |
| `C` | 2 | 0 | (empty) | (empty) |

2. Open the summary `Phase X` inspector.

✅ **Pass criteria** (US5.AS1–AS3, SC-008):

- `Actual start` shown as `2026-05-01` (earliest).
- `Actual finish` shown as empty / "in progress" (because B and C have not
  finished).
- `% complete` shown as `58%` (duration-weighted: `(4×100 + 6×50 + 2×0) / 12`).
- All three fields are read-only on the summary; clicking them does not
  enter edit mode (US5.AS4 / FR-011).

3. Mark `B`'s `Actual finish` = 2026-05-12 and `C`'s `Actual start` =
   2026-05-12, `Actual finish` = 2026-05-13, `% complete` = 100.

✅ **Pass criteria**:

- Summary `Actual finish` becomes `2026-05-13` (latest, all children
  finished).
- Summary `% complete` becomes `100`.

---

## 7. Lifecycle — delete cascade (FR-012)

1. Delete task `A` (with its actuals recorded).
2. SQL into the DB or load the snapshot:

   ```sql
   SELECT id, actual_start_date, actual_finish_date, progress_pct
     FROM schedule_tasks WHERE name = 'A';
   ```

   ✅ Returns zero rows (cascade deletion via existing FK).

---

## 8. Baseline isolation (FR-013, US1.AS3)

If feature 002 is shipped:

1. Set baseline v0.
2. Add actuals to two tasks.
3. View v0 baseline.

   ✅ The baseline snapshot does not include any actuals values — the bars
   render exactly the planned dates / durations as they were at baseline
   time.

---

## 9. Persistence (FR-014, SC-002)

1. Add actuals to 5 tasks.
2. `npm run dev` restart in another terminal (do NOT close the browser).
3. Hard reload the browser tab.

   ✅ All 5 tasks show their actuals values exactly as entered, with no
   loss and no field zeroed.

---

## 10. Performance smoke (Performance Goals)

1. Load a project with ~500 tasks (use the construction-mega seed if
   available, or a generated stress fixture).
2. Open Chrome DevTools → Performance → record while scrolling the Gantt
   for 5 seconds with all three tracks rendering on every visible row.

   ✅ Sustained ≥ 60 fps. No layout-thrashing red bars.

3. Open the inspector on a task, edit `% complete`, blur.

   ✅ PATCH round-trip ≤ 300 ms in the Network panel (p95 across 10
   attempts).

---

## Done?

If every checkbox above is ticked, run:

```bash
npm run test:run        # all unit + UI tests pass
npm run build           # type-check + bundle clean
```

Then the feature is shippable.
