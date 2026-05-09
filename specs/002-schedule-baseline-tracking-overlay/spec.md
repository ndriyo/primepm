# Feature Specification: Schedule Baseline & Tracking Gantt Overlay

**Feature Branch**: `002-schedule-baseline-tracking-overlay`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "Add immutable, versioned schedule baselines and a tracking Gantt overlay that compares baseline bars against current schedule bars per task."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Project manager sets the original baseline (v0) and freezes the plan (Priority: P1)

A PM has finished planning a project schedule (tasks, dependencies, dates, durations, costs, resource assignments, calendar). Before execution starts, the PM clicks "Set baseline" on the project schedule. The system captures a frozen, immutable snapshot of the entire schedule — labeled v0, stamped with the PM's identity and the current timestamp, and given an optional rationale text the PM can fill in. From this point on, the original plan is locked in evidence; no edit can erase what was committed.

**Why this priority**: Without v0, there is nothing to track against. Every other capability in this feature (overlay, variance, future EVM, future change-request workflow) depends on the existence of a frozen original plan. The PRD's strategic thesis ("baseline integrity built in by default") starts here.

**Independent Test**: Open a project that has a planned schedule, click "Set baseline", confirm the dialog, and verify that a baseline labeled v0 now exists for the project with timestamp, user, and rationale captured. Modify the schedule afterward and confirm v0 remains byte-for-byte identical.

**Acceptance Scenarios**:

1. **Given** a project with a planned schedule and no existing baseline, **When** the PM clicks "Set baseline" and confirms, **Then** a baseline labeled v0 is created containing a complete frozen snapshot of the current schedule (tasks, dependencies, dates, durations, costs, resources, assignments, calendar, settings).
2. **Given** a project with a v0 baseline, **When** the PM modifies any task's dates, durations, dependencies, or resources afterward, **Then** v0 remains unchanged and is still retrievable in its original form.
3. **Given** the "Set baseline" confirmation dialog, **When** the PM optionally enters a rationale ("Approved by steering committee 2026-05-08"), **Then** that rationale is stored alongside v0 and visible whenever v0 is later viewed.
4. **Given** a baseline has been set, **When** any user attempts to edit or delete v0 directly, **Then** the system refuses the operation and explains that baselines are immutable by design.

---

### User Story 2 - PM sees the tracking overlay comparing current schedule against baseline (Priority: P1)

After setting a baseline, the PM modifies the schedule (tasks slip, durations grow, dependencies change). When the PM opens the Gantt view, each task bar is now drawn alongside its baseline bar — visually paired so the PM can see at a glance where the current plan has drifted from the baseline. Tasks whose current dates differ from baseline are visually distinguished (color, pattern, or marker) so variance jumps out without reading numbers.

**Why this priority**: This is the visible payoff of having set a baseline. Without it, the baseline is just data sitting in storage — the user cannot see drift. P1 because the PRD bundles overlay together with baseline as the unit of value for Phase 1.

**Independent Test**: With a project that has v0 set, modify several tasks (push dates, change durations), open the Gantt view, and visually verify both baseline bars and current bars render in the same row per task with a clear visual distinction where they differ.

**Acceptance Scenarios**:

1. **Given** a project with v0 baseline and a current schedule that differs from v0, **When** the PM opens the Gantt view, **Then** each task bar is drawn alongside its baseline bar in the same row, with both visible simultaneously.
2. **Given** a task whose current dates are identical to its baseline dates, **When** rendered on the tracking Gantt, **Then** no variance marker is shown for that task.
3. **Given** a task whose current dates have shifted from baseline, **When** rendered on the tracking Gantt, **Then** a clear visual variance indicator (color, pattern, or marker) is applied so the slip is obvious without reading the dates.
4. **Given** a project that has no baseline yet, **When** the PM opens the Gantt view, **Then** the view looks identical to today's Gantt (no overlay, no toggle visible) — the feature is invisible until a baseline exists.
5. **Given** a task that exists in the current schedule but did not exist in v0 (added after baselining), **When** rendered on the tracking Gantt, **Then** the task is shown with no baseline bar and is marked as "added since baseline".
6. **Given** a task that existed in v0 but was deleted from the current schedule, **When** the PM views the tracking Gantt, **Then** the task is shown with only its baseline bar and marked as "removed since baseline".

---

### User Story 3 - PM creates a rebaseline (v1, v2, ...) while preserving v0 (Priority: P2)

A formal scope or schedule change has been approved. The PM creates a new baseline (v1) capturing the current schedule. The original v0 is preserved unchanged; v1 takes its place as the "latest" baseline by default. The PM can later create v2, v3, and so on — each version stored permanently and retrievable.

**Why this priority**: Real projects rebaseline. Without versioning, the first baseline becomes a stale reference no one trusts and gets ignored. P2 because v0 alone delivers value initially; multi-version support is essential by end of Phase 1 but not strictly required for the very first demo.

**Independent Test**: Set v0, modify schedule, set v1 with rationale, confirm both v0 and v1 are listed in the baseline history, both retrievable, both immutable, and v1 is now treated as the default reference.

**Acceptance Scenarios**:

1. **Given** a project with v0 baseline and modifications since, **When** the PM clicks "Set baseline" again with a rationale, **Then** a new baseline v1 is created with its own timestamp, user, and rationale; v0 remains unchanged.
2. **Given** multiple baseline versions exist (v0, v1, v2), **When** the PM opens the baseline history view, **Then** all versions are listed in chronological order with their timestamps, creators, and rationales.
3. **Given** multiple baseline versions exist, **When** the latest baseline (default reference) is determined, **Then** it is the most recently created baseline.
4. **Given** any historical baseline (e.g., v0), **When** the PM selects it from the baseline history, **Then** the full snapshot for that version is retrievable in the same fidelity as the day it was set.

---

### User Story 4 - PM compares current schedule against any baseline version they choose (Priority: P2)

The PM wants to see how the current schedule compares to v0 (the original commitment) rather than v1 (the most recent rebaseline). A toggle in the Gantt header lets them switch which baseline version is the reference for the overlay. The selection is preserved while they are looking at the project but does not change the underlying default.

**Why this priority**: The strategic value of preserving v0 forever is that stakeholders can ask "how far have we drifted from the original?" — answering that requires the user to be able to switch the reference. P2 because the overlay against the latest baseline (US2) is the more common day-to-day need.

**Independent Test**: With a project that has v0, v1, and v2 set, open the Gantt view, toggle the baseline reference between versions, and confirm the overlay re-renders against the chosen baseline within the typical Gantt re-render time.

**Acceptance Scenarios**:

1. **Given** a project with at least two baseline versions, **When** the PM opens the Gantt view, **Then** a baseline-version selector is visible in the Gantt header.
2. **Given** the baseline-version selector, **When** the PM selects v0, **Then** the tracking overlay re-renders to compare current schedule against v0.
3. **Given** the baseline-version selector, **When** the PM selects "latest", **Then** the overlay tracks against whichever baseline is the most recent.
4. **Given** a project with only one baseline version (v0), **When** the PM opens the Gantt view, **Then** the selector is hidden or disabled — there is nothing to switch between.

---

### User Story 5 - Baseline events appear in the project audit history (Priority: P3)

Every baseline action — initial v0, each rebaseline — is recorded in the project's audit history as an event with timestamp, user, and rationale. PMOs and reviewers can later see exactly when the plan was committed to and by whom.

**Why this priority**: Governance evidence. Phase 3 will surface this audit history as a first-class view; Phase 1 only needs to ensure the events are written so they are available later. P3 because it is a non-visible-now write that can ship without a dedicated UI.

**Independent Test**: Set v0, set v1, then query the project's audit log and confirm two baseline-set events are present with the correct user, timestamp, and rationale.

**Acceptance Scenarios**:

1. **Given** a baseline-set action completes, **When** the audit log is later inspected, **Then** an event is present recording the baseline version, the user who created it, the timestamp, and the rationale text.

---

### Edge Cases

- A user clicks "Set baseline" but cancels the confirmation dialog — no baseline is created and the schedule is unchanged.
- A user clicks "Set baseline" twice quickly. Only one baseline is created; duplicate clicks are ignored or de-duplicated.
- The PM tries to set a baseline on a project with zero tasks. The system either refuses (preferred — there is nothing to baseline) or creates an empty baseline that is honest about its emptiness.
- A task in the current schedule has been moved under a different summary parent since baseline. The overlay still pairs it correctly using a stable task identifier, not the task's tree position.
- A task was renamed since baseline. The baseline bar still appears alongside the current bar; the displayed name follows the current task name with the baseline name available on hover.
- The current calendar (working days, holidays) differs from the baseline calendar. The baseline bars are rendered using the baseline's own calendar; the current bars use the current calendar. The comparison is honest about that difference.
- Two users modify the schedule concurrently and one of them sets a baseline mid-edit. The baseline captures whatever schedule state is committed at the moment "Set baseline" is invoked; in-flight uncommitted edits are not part of the snapshot.
- A baseline is set, then the project is restored from a backup that pre-dates the baseline. The baseline must be linked to the project in such a way that this anomaly is detectable, not silent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Set baseline" action on the project schedule, available to users with permission to edit the schedule.
- **FR-002**: When "Set baseline" is invoked, the system MUST present a confirmation dialog that captures an optional rationale text and requires explicit confirmation before committing.
- **FR-003**: On confirmation, the system MUST capture a complete frozen snapshot of the current schedule, including: tasks (with their dates, durations, costs, scheduling mode, constraints, progress), dependencies (with type and lag), resources, assignments, calendar (working days and holidays), and schedule settings (display order, collapsed state).
- **FR-004**: Each baseline MUST store: a version label (v0, v1, v2, ...), the creator's user identity, the creation timestamp, the optional rationale text, and the full snapshot.
- **FR-005**: Once committed, baselines MUST be immutable. The system MUST refuse any operation that would modify or delete an existing baseline's data.
- **FR-006**: A project MUST be able to hold an unbounded number of baseline versions over time, with v0 always retrievable regardless of how many later versions exist.
- **FR-007**: The Gantt view MUST render the tracking overlay (baseline bar paired with current bar per task) whenever at least one baseline exists for the project.
- **FR-008**: Tasks whose current dates differ from the active baseline's dates MUST be visually distinguished (e.g., color, pattern, or marker) on the Gantt so variance is obvious without reading numbers.
- **FR-009**: Tasks whose current dates exactly match the active baseline's dates MUST NOT show a variance indicator.
- **FR-010**: A task that exists in the current schedule but was not present in the active baseline MUST be visibly marked as "added since baseline" on the Gantt.
- **FR-011**: A task that existed in the active baseline but is no longer in the current schedule MUST still be shown on the Gantt with its baseline bar and marked as "removed since baseline".
- **FR-012**: The Gantt view MUST provide a control to switch the active baseline reference between any of the project's baseline versions, including a "latest" option.
- **FR-013**: When only one baseline version exists for a project, the baseline-version selector MUST be hidden or disabled.
- **FR-014**: When no baseline exists for a project, the Gantt view MUST render exactly as it does today, with no overlay and no baseline-version selector visible.
- **FR-015**: The system MUST record every baseline-set event in the project audit log, including baseline version, user, timestamp, and rationale.
- **FR-016**: The baseline history MUST be viewable as a list ordered chronologically, showing version, timestamp, creator, and rationale for each entry.
- **FR-017**: Task identity MUST be preserved across baseline and current schedule using a stable identifier independent of display name or tree position, so that renames and reparenting do not break the pairing.
- **FR-018**: Setting a baseline MUST be atomic — either the entire snapshot is captured successfully or no baseline is created, never a partial snapshot.

### Key Entities

- **Baseline version**: A frozen, immutable record of a project's schedule at a point in time. Identified by version label (v0, v1, ...), tied to a project, owns a creator, a timestamp, a rationale, and a complete schedule snapshot.
- **Schedule snapshot**: The serialized contents of a baseline — tasks, dependencies, resources, assignments, calendar, and settings — captured atomically. Conceptually equivalent to "everything that defines the schedule at this moment."
- **Baseline reference (active)**: The baseline version currently being used as the comparison source for the tracking Gantt overlay. Selected per-user-session via the Gantt header control; defaults to "latest".
- **Baseline event**: An audit-log entry recording the act of setting a baseline. Carries baseline version, user, timestamp, and rationale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A PM can set a baseline on a project schedule in under 30 seconds (open project → click "Set baseline" → enter rationale → confirm → see baseline recorded).
- **SC-002**: After setting v0, modifying the schedule, and refreshing the page, v0 returns byte-for-byte the same snapshot it had at creation — verified across at least 5 distinct test projects.
- **SC-003**: On the tracking Gantt, a user can identify which tasks have slipped versus baseline within 5 seconds of opening the view, without reading any dates — relying purely on visual variance indicators.
- **SC-004**: After setting v1 on a project that already has v0, both versions remain retrievable and viewable; v0 is identical to its original state in 100% of test cases.
- **SC-005**: Switching the baseline reference in the Gantt header re-renders the overlay against the chosen version within 1 second on a project of 100 tasks.
- **SC-006**: A PMO reviewer can produce, from the audit log, a complete chronological list of every baseline event on a project (including who set it and why) in under 1 minute.
- **SC-007**: For a project with no baseline, opening the Gantt feels indistinguishable from the pre-feature experience — confirmed by user-experience review.
- **SC-008**: A baseline-set action either fully succeeds or leaves no trace; zero partial snapshots exist in the system after 100 simulated failure-during-save tests.

## Assumptions

- The current schedule data model (tasks, dependencies, resources, assignments, calendar, settings) is the canonical input to a baseline snapshot — the same shape the system already serializes when persisting schedules today.
- Tasks already have a stable identifier independent of display name and tree position; the baseline relies on this for pairing.
- A project's audit log facility already exists and accepts arbitrary event types with user, timestamp, and free-form payload.
- "Permission to set a baseline" inherits from "permission to edit the project schedule" — there is no separate baseline-setting role in this release.
- The Gantt rendering layer can accept a parallel data series (baseline) and render it in the same row as the current series without a fundamental restructure.
- "Baseline version" labels are auto-generated as v0, v1, v2, ...; users do not name baselines manually in this release.
- The change-request workflow that will eventually gate rebaselines is **not** in scope for this release. Any user with edit permission can set a baseline freely; controls move to Phase 3.
- Variance metrics (SV, SPI, CV, CPI), S-curves, and EVM derivations are **not** in scope — they consume the baseline data in Phase 2.
- Portfolio-level baseline rollups across projects are **not** in scope.
- Baselines do not capture actuals (% complete, actual start/finish). Actuals are a separate feature; see spec 003.
