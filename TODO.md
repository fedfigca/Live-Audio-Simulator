# TODO / Roadmap

This file is the canonical roadmap for Live Audio Simulator. It is the single source of truth for major features, accessibility work, and release milestones. Agents and contributors should use this file when planning work or opening PRs that affect feature scope.

---

## Top priorities (short-term)

- Accessibility CLI (Text-based input for visually impaired users)
  - Goal: Add a keyboard-first, screen-reader friendly text CLI inside the app that allows users to perform common actions (place devices, connect/disconnect, view device details, run diagnostics).
  - Acceptance criteria: Commands can be entered and produce accessible textual results; the UI is navigable via keyboard; basic VoiceOver/NVDA walkthrough documented.

- Virtual audio flow (device-level signal routing)
  - Goal: Implement a virtual audio graph representing connections between devices so signal flow can be visualized and simulated.
  - MVP: Event-driven simulation that computes routing and simple level meters (no real audio output required initially).
  - Acceptance criteria: Users can connect devices, inspect signal path, and see meters that update with simulated signal activity.

- Problem generator (exercises for students)
  - Goal: Generate scenarios/problems of varying complexity (mispatched devices, silent channels, mismatched impedances) for learners to diagnose and fix.
  - Acceptance criteria: A problem spec format exists; UI can present a challenge, validate a student's solution, and reveal the canonical answer. Support 3 difficulty tiers (easy / medium / hard).

---

## Secondary priorities (medium-term)

- Real-time virtual audio playback via WebAudio (AudioWorklet / AudioGraph integration).
- Export/import stage snapshots and problem sets (.las-export).
- Basic scoring / hints system for generated problems.
- Accessibility audits and automated keyboard/screenreader test cases.

---

## Long-term

- LMS integration and user progress tracking.
- Multi-user collaborative stages and shared problem sessions.
- A library of curated exam-style problem sets and instructor tools.

---

## Milestones (proposal)

- v0.1.x: Mobile drag fallback + preview (current)
- v0.2.0: Virtual audio flow MVP + basic CLI accessibility
- v0.3.0: Problem generator + exercise UI
- v1.0.0: LMS integration, scoring, persistent accounts

---

## How to contribute / edit this roadmap

- Keep entries short and actionable. Add acceptance criteria where possible.
- When adding a new task, reference the milestone it targets and add rough priority (P0/P1/P2).
- Update this file via PR; major scope changes should include a short rationale.

---

Notes

- This file is the single canonical roadmap for the project. The project agent will reference `TODO.md` as the authoritative plan for feature work and prioritization.
