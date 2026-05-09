# Feature Specification: Actuals Capture

**Feature Branch**: `003-actuals-capture`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "Add per-task actuals capture: percent complete, actual start date, actual finish date. Actuals are stored independently from current scheduled values and from baseline values."

## Clarifications

### Session 2026-05-09

- Q: When a user enters a % complete outside 0–100, how should the system respond? → A: Reject the save with a clear validation error; do not clamp. (FR-005 tightened.)
- Q: Should this release include Gantt-track visualization of actuals, or is the inspector view sufficient? → A: Include a Gantt-track rendering of actuals alongside baseline and current bars. (FR-015 tightened; promoted from "optional" to required.)
- Q: How should the rolled-up % complete on a summary task be calculated from its children? → A: Duration-weighted across children (each child's planned duration is the weight). (FR-011 tightened.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - PM records actual progress against a task without disturbing the plan (Priority: P1)

A PM is running a project review. For each task that has actually started or finished, the PM enters three pieces of information directly on the task: the percent complete (0–100), the actual start date, and the actual finish date if it is done. The PM's planned schedule and any committed baseline are untouched by these entries. The system now holds three parallel views of every task — the baseline (frozen plan), the current schedule (latest plan), and the actuals (what really happened) — and the PM can see all three.

**Why this priority**: Actuals are the second leg of "make truth measurable." Without actuals, a baseline alone shows commitment but not delivery. Without actuals, EVM (Phase 2) is impossible. Without actuals, anti-gaming and exec dashboards (Phase 3) are blind. P1 because it is the unblock for everything in Phase 2.

**Independent Test**: Open a project, select a task, enter % complete = 50, actual start = today-7d, leave actual finish empty, save. Reload the project. Confirm the task still shows 50%, the actual start date is preserved, the planned start/finish on the task is unchanged, and the baseline (if any) is unchanged.

**Acceptance Scenarios**:

1. **Given** a task with no actuals recorded, **When** the PM enters % complete, actual start, and actual finish in the task inspector and saves, **Then** all three values are persisted on the task and visible to anyone who reopens it.
2. **Given** a task with actuals saved, **When** the PM later changes the planned (current scheduled) start or finish, **Then** the saved actual start and actual finish remain unchanged.
3. **Given** a task with actuals saved on a project that has a v0 baseline, **When** the PM saves the actual finish, **Then** the v0 baseline snapshot for that task remains byte-for-byte identical.
4. **Given** a task in progress (actual start recorded, no actual finish, % complete > 0 and < 100), **When** the PM views the task inspector, **Then** the partial actuals are clearly displayed and editable.
5. **Given** a task that is finished, **When** the PM enters % complete = 100 and an actual finish date, **Then** the system accepts the values without requiring further metadata.

---

### User Story 2 - PM enters actuals in the same place they already edit the task (Priority: P1)

The PM does not have to learn a new screen, navigate to a separate "actuals" view, or open a modal. The actual-start, actual-finish, and percent-complete fields appear inside the existing task inspector — the same panel where they already edit task name, duration, scheduling mode, and constraints. Day-to-day project review workflow is unchanged in shape; only the fields available are richer.

**Why this priority**: PM hostility is an explicit risk in the PRD. The cheapest defense against PM hostility is to put new inputs where they already work, not where they have to remember to go. P1 because if PMs do not enter actuals, the feature delivers nothing regardless of how good the data model is.

**Independent Test**: Open the existing task inspector on any task and verify that % complete, actual start, and actual finish are present and editable in the same panel as the existing task fields, with no separate navigation step.

**Acceptance Scenarios**:

1. **Given** the task inspector panel, **When** opened on any task, **Then** % complete, actual start, and actual finish fields are visible alongside the existing task fields.
2. **Given** the task inspector with actual start filled, **When** the PM tabs to the next field, **Then** focus moves naturally to the next actuals field, then onward — keyboard flow is uninterrupted.
3. **Given** the task inspector, **When** the PM saves changes, **Then** all task fields including actuals are persisted in a single save action — no separate save for actuals.

---

### User Story 3 - System rejects nonsensical actuals (Priority: P2)

The PM accidentally enters an actual finish that is earlier than the actual start, or a percent complete of 150, or a percent complete of -10. The system refuses the value with a clear, non-blaming message that explains what is allowed. No half-saved state remains.

**Why this priority**: Bad data here corrupts everything downstream — variance, EVM, dashboard, exec-level RAG. P2 because the system can ship without elaborate validation, but it should not ship with no validation; the rules below are the minimum.

**Independent Test**: Try to save each invalid combination in turn — actual finish before actual start, % complete = -1, % complete = 150 — and confirm that each is rejected with a clear message and no partial save occurs.

**Acceptance Scenarios**:

1. **Given** an actual start of 2026-05-01, **When** the PM enters an actual finish of 2026-04-25 and saves, **Then** the system refuses the save with a clear "actual finish cannot be earlier than actual start" message and the field with the bad value is highlighted.
2. **Given** the % complete field, **When** the PM enters -10 or 150, **Then** the system refuses the save with a clear "% complete must be between 0 and 100" message and the field is highlighted; clamping is not used.
3. **Given** any rejected save, **When** the PM corrects the offending value, **Then** the save proceeds and all fields persist atomically.

---

### User Story 4 - PM sees actuals alongside baseline and scheduled values per task (Priority: P2)

When the PM opens a task on the inspector or looks at the Gantt, the system shows all three temporal pictures of that task: when it was originally baselined to start and finish, when it is currently scheduled to start and finish, and when it actually started and finished (or actually started and is still running). On the Gantt, the actuals appear as a third visual track alongside the baseline bar and the current-schedule bar so PMs can compare delivery to commitment without opening a task. The PM can answer "did we deliver on plan?" at a glance.

**Why this priority**: Without surfacing actuals next to baseline and scheduled values, the PM cannot reason about variance even if the data is captured. P2 because the inspector view alone is enough to start using the feature; the Gantt-track rendering is the visualization payoff that makes the data useful at portfolio scale.

**Independent Test**: For a task with baseline, scheduled, and actual dates all distinct, open the task inspector and verify all three sets of values are visible and clearly labeled. Then open the Gantt and verify a third bar/track for actuals is rendered in the same row alongside the baseline bar and current-schedule bar.

**Acceptance Scenarios**:

1. **Given** a task with baseline, current scheduled, and actual values all distinct, **When** the PM opens the task inspector, **Then** all three sets of dates and the % complete value are visible and clearly labeled (baseline / scheduled / actual).
2. **Given** a task without actuals, **When** the PM opens the inspector, **Then** the actual fields are present but empty, and clearly indicated as "not yet recorded".
3. **Given** a task without a baseline (project never baselined), **When** the PM opens the inspector, **Then** the baseline labels are absent or marked "no baseline" — but actuals and scheduled values are still visible.
4. **Given** a task with actuals recorded, **When** the PM opens the Gantt, **Then** a distinct actuals track/bar is rendered in the same row alongside the baseline bar and the current-schedule bar.
5. **Given** a task with no actuals recorded yet, **When** the PM opens the Gantt, **Then** the actuals track is omitted for that task; the row still shows the baseline and current bars normally.

---

### User Story 5 - Actuals roll up to summary tasks (Priority: P3)

A summary task that owns child tasks shows a derived view of its actual progress: a duration-weighted rolled-up % complete across its children, the earliest actual start across its children, and the latest actual finish across its children (if every child has finished). The PM does not enter actuals on summary tasks directly — they are computed.

**Why this priority**: Without rollup, summary rows show nothing about actual progress, so the Gantt looks half-empty at the PM's natural reading level. P3 because the summary computation is straightforward and can ship as a fast follow within the same Phase 1 milestone if time allows; the PM can survive without it for the first release.

**Independent Test**: Build a summary task with three child tasks, enter actuals on the children with a mix of in-progress and completed states, and verify the summary shows the earliest actual start, the latest applicable actual finish, and a sensible rolled-up % complete.

**Acceptance Scenarios**:

1. **Given** a summary task with three child tasks, **When** all three children have actual start dates, **Then** the summary's actual start is the earliest of the three.
2. **Given** a summary task with three child tasks, **When** all three children have actual finish dates, **Then** the summary's actual finish is the latest of the three.
3. **Given** a summary task with three child tasks of which two are finished and one is in progress, **When** the summary is viewed, **Then** the summary shows an earliest actual start, no actual finish (because work is still ongoing), and a duration-weighted rolled-up % complete derived from the children's planned durations.
4. **Given** a summary task, **When** the PM tries to edit its % complete or actual dates directly, **Then** the system prevents direct editing — these values are derived, not entered.

---

### Edge Cases

- A task is marked 100% complete but has no actual finish recorded. The system flags this inconsistency on save (or accepts it but surfaces it as a data-quality warning).
- A task has an actual start in the future. The system warns but allows it (the PM may have legitimate reasons such as planned cutover dates).
- A task has actuals recorded, then the PM deletes the task from the current schedule. The actuals are deleted alongside the task; they do not persist as orphans (they are not part of any baseline because actuals are not baselined).
- A task is rebaselined (a new baseline version is set). The actuals on the task are not part of the new baseline snapshot — actuals are never baselined, period.
- The PM enters an actual start identical to the planned start. The system accepts the value; matching planned and actual is a normal case and is not a duplication concern.
- A non-leaf (summary) task is selected. The actuals fields are read-only for summary tasks (rollup-only) per US5.
- The PM enters a % complete on a task for which no actual start has been recorded. The system accepts the value; partial progress without a recorded start is a normal early-tracking state.
- Concurrent edits: two PMs save actuals for the same task within the same second. Last-write-wins is acceptable for this release; conflict-detection is not required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user with permission to edit a task to enter and update three actual-tracking values per task: percent complete (integer 0–100), actual start date, and actual finish date.
- **FR-002**: The actuals fields MUST be exposed in the existing task inspector panel — the same panel used to edit the task's name, duration, scheduling mode, and constraints — without requiring navigation to a separate view or modal.
- **FR-003**: Saving actuals MUST NOT modify the task's planned (current scheduled) start, planned finish, or planned duration.
- **FR-004**: Saving actuals MUST NOT modify any existing baseline snapshot for the task. Baselines remain immutable; actuals are stored alongside them, not within them.
- **FR-005**: The percent complete value MUST be constrained to integer values from 0 through 100. Inputs outside that range MUST be rejected with a clear validation error message (e.g., "% complete must be between 0 and 100"), the offending field MUST be highlighted, and no save MUST occur. Clamping to the 0–100 range is explicitly disallowed.
- **FR-006**: The system MUST refuse a save in which actual finish is earlier than actual start, with a clear error message identifying the offending field.
- **FR-007**: An unfinished task (actual finish is empty) MUST still be allowed to have a percent complete value strictly between 0 and 100 inclusive.
- **FR-008**: All actuals values, the planned values, and (if a baseline exists) the baseline values for a task MUST be retrievable together so the user can compare them on a single screen without cross-referencing.
- **FR-009**: When a task has no actuals recorded, the actuals fields MUST be visibly empty and labeled as "not yet recorded" — not zeroed-out or pre-populated from planned values.
- **FR-010**: Saving any combination of task-edit fields and actuals fields MUST be a single atomic save action from the user's perspective — no separate "save actuals" affordance exists.
- **FR-011**: Summary (non-leaf) tasks MUST display a derived view of their children's actuals: earliest actual start across children, latest actual finish across children once every child has finished, and a **duration-weighted** rolled-up percent complete across children. The weight for each child is its planned duration; the rolled-up percent complete equals `sum(child.percent_complete × child.planned_duration) / sum(child.planned_duration)`, rounded to the nearest integer. Direct entry of actuals on a summary task MUST be prevented.
- **FR-012**: Deleting a task MUST also delete its associated actuals records. No orphan actuals records may remain.
- **FR-013**: Setting a new baseline on a project MUST NOT include any actuals values in the new baseline snapshot. Actuals are never part of any baseline.
- **FR-014**: All actuals reads and writes MUST behave consistently across page reload, session restart, and tab switching — actuals are first-class persisted data, not session-only state.
- **FR-015**: The system MUST surface actuals in two places: (a) inside the task inspector, where actual % complete, actual start, and actual finish are displayed and edited alongside the planned and baseline values; and (b) on the Gantt, where a third visual track or bar is rendered in the same row as the baseline bar and the current-schedule bar, representing the actual start, actual finish, and progress. When a task has no actuals recorded, the Gantt actuals track for that task is omitted but the baseline and current bars render normally.

### Key Entities

- **Task actuals**: A per-task record holding three values — percent complete (0–100), actual start date, actual finish date — that capture what really happened, distinct from what was planned and from what was baselined. Lifecycle is bound to the task: created when first entered, deleted when the task is deleted.
- **Task (extended view)**: For the purposes of this feature, a task is conceptually three parallel data sets: the baseline snapshot (frozen plan, if any), the current scheduled values (latest plan), and the actuals. All three coexist; entering one never overwrites the other two.
- **Summary actuals (derived)**: A computed view on a non-leaf task that aggregates its descendants' actuals into earliest actual start, latest actual finish (when fully complete), and rolled-up percent complete. Not stored — always derived.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A PM can enter actuals (% complete, actual start, actual finish) on a single task in under 15 seconds from opening the inspector to seeing the values saved.
- **SC-002**: After entering actuals on at least 5 tasks in a project and reloading the page, 100% of the actuals values persist exactly as entered.
- **SC-003**: After entering actuals, the planned (current scheduled) start and finish values for the same task are unchanged in 100% of test cases.
- **SC-004**: After entering actuals, the v0 baseline snapshot for the same task is byte-for-byte unchanged in 100% of test cases.
- **SC-005**: Invalid combinations (actual finish before actual start; % complete outside 0–100) are rejected with a user-understandable error in 100% of attempts; zero invalid records exist in the system after these tests.
- **SC-006**: A PM can identify, for a single task, the baseline / scheduled / actual values side-by-side without leaving the task inspector — verified by a usability check that times the comparison at under 5 seconds.
- **SC-007**: At least 60% of in-progress projects have actuals recorded on at least 50% of started tasks within 30 days of release, indicating the input flow is friction-light enough to be used.
- **SC-008**: Summary-task rollup of % complete equals the duration-weighted aggregate of children (sum of child.% × child.planned_duration over sum of child.planned_duration) within ±1 percentage point in 100% of automated tests, including mixed in-progress and completed children.
- **SC-009**: On a project where every started task has actuals recorded, opening the Gantt shows three distinct visual tracks per task (baseline, current, actuals) without horizontal overflow on a 1280px-wide viewport.

## Assumptions

- The existing task data model has, or can hold, a percent-complete field as a first-class task attribute. (The current system already exposes a progress concept on tasks; this feature builds on it.)
- The existing task inspector UI is structured so that three additional fields (% complete, actual start, actual finish) can be added without redesigning the panel.
- "Permission to enter actuals" inherits from "permission to edit the task" — there is no separate actuals-only role in this release.
- Dates are recorded as calendar dates (no time-of-day component). This matches how planned dates are handled today.
- The Gantt rendering of actuals (a third visual track on the Gantt alongside baseline and current bars) is **required** in this release per Clarifications 2026-05-09 — promoted from "optional" to in scope.
- Summary-task rollup of % complete uses **duration-weighted aggregation** per Clarifications 2026-05-09. Cost-weighted rollup is out of scope; that variant becomes relevant in Phase 2 (EVM).
- Timesheets, rate cards, automatic % complete from time logs, and resource cost accruals are explicitly **not** in scope.
- EVM derivations (PV, EV, AC, SPI, CPI, EAC, ETC, VAC) are explicitly **not** in scope — they consume actuals in Phase 2.
- Concurrent-edit conflict detection on actuals is **not** in scope; last-write-wins is acceptable.
- Actuals are not versioned. Editing a previously saved actual overwrites the previous value; an audit log entry of the change is desirable but not strictly required for this release.
- Actuals are never part of any baseline snapshot, regardless of when the baseline is set.
