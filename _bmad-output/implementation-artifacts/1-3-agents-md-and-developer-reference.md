# Story 1.3: AGENTS.md & Developer Reference

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an AI agent or new contributor,
I want a single authoritative reference file at the root of the repository,
so that I can understand all project conventions, architecture rules, and workflow protocols without reading multiple documents.

## Acceptance Criteria

1. **Given** `AGENTS.md` exists at the repository root **When** an AI agent starts a new session on this project **Then** reading `AGENTS.md` alone is sufficient to understand: FSD layer rules, naming conventions, error handling pattern, state management pattern, platform adapter pattern, commit conventions, and the Beads workflow

2. **Given** the FSD section of `AGENTS.md` **When** an agent reads it **Then** it finds: the layer hierarchy (app → pages → widgets → features → entities → shared), the unidirectional import rule with a correct and an incorrect example, and the barrel file convention

3. **Given** the Beads workflow section of `AGENTS.md` **When** an agent starts a new session **Then** the documented protocol instructs: (1) run `bd ready --json` to get the prioritized work queue, (2) run `bd update <id> --claim` before starting a task, (3) run `bd create "title"` for any work discovered mid-session

4. **Given** the Beads workflow section of `AGENTS.md` **When** an agent ends a session ("Land the Plane") **Then** the documented protocol instructs: (1) close completed issues, (2) file any remaining discovered work, (3) run `bd sync`, (4) `git push` — and notes that unpushed work blocks other agents

5. **Given** the TDD section of `AGENTS.md` **When** an agent begins implementing any feature code **Then** the documented protocol instructs: (1) write a failing test first, (2) write the minimum code to make it pass, (3) refactor — and explicitly prohibits writing implementation code before a failing test exists

6. **Given** the TDD section of `AGENTS.md` **When** an agent reads it **Then** it finds: the Red→Green→Refactor cycle, the rule that no production code is written without a prior failing test, and the co-location convention for test files (`*.test.ts` next to the source file)

7. **Given** the error handling section of `AGENTS.md` **When** an agent reads it **Then** it finds: the `Result<T, string>` pattern with a correct example, the rule against `throw` for expected failures, and the rule against `.then()/.catch()` chains in feature code

8. **Given** the state management section of `AGENTS.md` **When** an agent reads it **Then** it finds: the SQLite → Zustand hydration pattern, the optimistic update rule, the one-store-per-domain rule, and the prohibition against querying SQLite inside React components

## Tasks / Subtasks

- [x] Task 1: Replace AGENTS.md with the comprehensive developer reference (AC: #1)
  - [x] Read the current `AGENTS.md` to understand the existing Beads integration and git branching sections
  - [x] Create the new `AGENTS.md` at the repo root, replacing the current file entirely
  - [x] The file must be self-contained — an agent reading ONLY this file has everything needed

- [x] Task 2: Write the FSD section (AC: #2)
  - [x] Document the layer hierarchy: `app → pages → widgets → features → entities → shared`
  - [x] State the unidirectional import rule clearly
  - [x] Include a correct import example: `import { importBook } from '@/features/importBook'`
  - [x] Include an incorrect import example: `import { parseEpub } from '@/features/importBook/lib/parseEpub'`
  - [x] Document the barrel file convention: every slice exposes `index.ts` as its public API
  - [x] Document the segment convention (ui/, model/, api/, lib/, config/ — always a folder, even for single files)
  - [x] Include the actual FSD directory tree from architecture (showing existing slices)

- [x] Task 3: Write the naming conventions section (AC: #1)
  - [x] File naming: PascalCase for React components, kebab-case for everything else, `.test.ts` suffix co-located
  - [x] Code naming: camelCase for functions/variables, PascalCase for types/interfaces, `use[Domain]Store` for Zustand, `[capability]Adapter` for platform adapters, SCREAMING_SNAKE_CASE for constants
  - [x] Database: snake_case columns in SQLite, Drizzle auto-maps to camelCase TS types — never manually alias

- [x] Task 4: Write the error handling section (AC: #7)
  - [x] Document the `Result<T, string>` pattern using `neverthrow` with a correct code example
  - [x] State: use `throw` only for unrecoverable programmer errors (violated invariants)
  - [x] State: never `throw` for expected failures (network offline, file not found, invalid key)
  - [x] State: never use `.then()/.catch()` chains — always `async/await`
  - [x] State: errors display inline where the action was triggered, never toasts overlaying reading content

- [x] Task 5: Write the state management section (AC: #8)
  - [x] Document the SQLite → Zustand hydration pattern (SQLite is source of truth, Zustand is UI state)
  - [x] State the optimistic update rule: update Zustand immediately, persist to SQLite in background
  - [x] State the one-store-per-domain rule: `useReaderStore`, `useVaultStore`, `useAppStore` — never one global store
  - [x] State the prohibition: never query SQLite inside React components — always read from Zustand
  - [x] Include correct and incorrect code examples for hydration and component usage
  - [x] Document loading states: use React local state (`useState`), not Zustand — loading is UI-local

- [x] Task 6: Write the platform adapter section (AC: #1)
  - [x] Document the adapter pattern: interface + two implementations (web + Android) in `shared/platform/`
  - [x] Show the directory structure: `shared/platform/[capability]/index.ts + interface + web + android`
  - [x] State the runtime selection via `Capacitor.isNativePlatform()`
  - [x] State the architectural boundary: no feature or widget imports from `@capacitor/*` directly
  - [x] List the five boundaries: platform, database, secure storage, AI, vault

- [x] Task 7: Write the TDD section (AC: #5, #6)
  - [x] Document the Red→Green→Refactor cycle
  - [x] State explicitly: no production code is written without a prior failing test
  - [x] State the co-location convention: `*.test.ts` next to the source file
  - [x] Document testing tools: Vitest + React Testing Library (unit), Playwright (E2E web), Maestro (E2E Android)
  - [x] Note: tests run in Vitest with jsdom; platform-specific code (SQLite WASM, Capacitor) must be mocked

- [x] Task 8: Write the commit conventions and Beads workflow section (AC: #3, #4)
  - [x] Preserve and refine the existing Beads workflow content from current AGENTS.md
  - [x] Document Conventional Commits: `feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major
  - [x] Document the git branching convention: every new piece of work MUST start on a dedicated branch from `main` — `story/<story-key>` or `fix/<short-description>`
  - [x] State explicitly: never commit directly to `main` — always branch, implement, then merge/PR back
  - [x] Document the session start protocol: `bd ready --json` → `bd update <id> --claim`
  - [x] Document the session end ("Land the Plane") protocol: close issues → file remaining work → `bd sync` → `git push`
  - [x] Note: unpushed work blocks other agents

- [x] Task 9: Write the Drizzle ORM convention (AC: #1)
  - [x] State: always use Drizzle's typed query builder (e.g. `db.insert(table).values(...).onConflictDoNothing()`) instead of raw `sql` template literals when the ORM provides an equivalent method
  - [x] State: Unix timestamps as integers — never Date objects in SQLite
  - [x] Reference the existing schema location: `src/shared/db/schema.ts`

- [x] Task 10: Write the Clean Code principles section (AC: #1)
  - [x] Single responsibility: each function does one thing at one level of abstraction
  - [x] Expressive naming: names reveal intent — `parseEpubIntoTokens()` not `process()`
  - [x] No boolean arguments: split the function instead
  - [x] Command Query Separation: a function either does or returns, never both
  - [x] DRY Rule of Three: first time write it, second time note it, third time abstract it
  - [x] No magic numbers: all constants named in `shared/lib/constants.ts`

- [x] Task 11: Validate and run quality checks (AC: all)
  - [x] Verify every acceptance criterion is satisfied by re-reading the file
  - [x] Run `npm run lint` — zero warnings
  - [x] Run `npm run typecheck` — zero errors (no TS files changed, but verify no regressions)
  - [x] Run `npm run test` — all existing tests still pass

## Dev Notes

### What This Story Is

This is a **documentation-only** story. The deliverable is a single file: `AGENTS.md` at the repo root. No TypeScript, no components, no tests to write (beyond verifying existing ones still pass).

The current `AGENTS.md` already has a Beads integration section and basic git branching/commit conventions. This story **replaces the entire file** with a comprehensive developer reference that covers all architecture conventions.

### Content Sources

All content for `AGENTS.md` comes from the architecture document. The dev agent must distill — not copy verbatim — the following sections into concise, actionable reference material:

| AGENTS.md Section | Architecture Source |
|---|---|
| FSD Layer Rules | Lines 147-167, 263-274, 710-723 |
| Naming Conventions | Lines 241-259 |
| Error Handling | Lines 325-347, 349-351 |
| State Management | Lines 169-174, 367-399, 404-427 |
| Platform Adapters | Lines 300-320, 725-743 |
| Clean Code | Lines 432-446 |
| Enforcement Rules | Lines 449-470 |
| Commit Conventions | Lines 225-232 |
| CI/CD Overview | Lines 194-218 |

Source: `_bmad-output/planning-artifacts/architecture.md`

### File Structure Guidance

The `AGENTS.md` file should be organized in this order:

1. **Project Overview** — one-liner: what Lekto is, tech stack summary
2. **FSD Architecture** — layer hierarchy, import rule, barrel files, segment convention, directory tree
3. **Naming Conventions** — files, code, database
4. **Error Handling** — Result<T> pattern, throw rules, async/await
5. **State Management** — SQLite → Zustand, hydration, optimistic updates, loading states
6. **Platform Adapters** — adapter pattern, boundaries
7. **TDD Protocol** — Red→Green→Refactor, co-location, testing tools
8. **Drizzle ORM** — typed queries, timestamps, schema location
9. **Clean Code** — principles summary
10. **Commit Conventions** — Conventional Commits, branching
11. **Beads Workflow** — session start, mid-session discovery, landing the plane
12. **Enforcement Checklist** — anti-patterns to reject (quick-scan list)

### Critical Rules for the Dev Agent

- **DO NOT copy architecture.md verbatim** — distill into concise, actionable reference. An agent reads this in seconds, not minutes.
- **Include code examples** for FSD imports (correct + incorrect), Result<T> usage, Zustand hydration (correct + incorrect), and platform adapter selection.
- **Keep each section short** — bullet points and code blocks, not prose paragraphs.
- **Preserve the existing Beads workflow content** — it's already correct. Refine and integrate, don't lose it.
- **Preserve the existing git branching convention** — it's already correct.
- **Preserve the existing Drizzle ORM convention** — refine and integrate into the Drizzle section.
- The shadcn components live in `src/components/ui/` (NOT `src/shared/ui/`) — this was established in story 1.1.
- The `<!-- BEGIN BEADS INTEGRATION -->` / `<!-- END BEADS INTEGRATION -->` markers in the current file should be removed — the new file is a single cohesive document.

### What NOT to Build

- No TypeScript code changes
- No new components, features, or modules
- No test files (just run existing tests to verify no regressions)
- No changes to any config files
- No CI/CD pipeline files (that's story 1.5)

### Previous Story Learnings (1.1 + 1.2)

- **Vite 7** (not Vite 6) — mention in tech stack summary
- **Capacitor 8** (not Capacitor 6) — mention in tech stack summary
- **React 19**, **TypeScript ~5.9.3** (strict mode with `noUncheckedIndexedAccess`)
- **shadcn components in `src/components/ui/`** (not `src/shared/ui/`)
- **ESLint `--max-warnings 0`** — any lint warning fails CI
- **Test files co-located** with source (no `__tests__/` directories)
- **`neverthrow`** is the Result type library already installed
- **`buttonVariants` pattern** — if exporting both components and non-component values from the same file, split to avoid React Fast Refresh lint errors
- **`drizzle-orm` v0.45.1**, **`drizzle-kit` v0.31.9** — currently installed versions
- **Custom migration runner** — uses `import.meta.glob` to bundle SQL at build time (NOT drizzle's built-in migrator which needs Node.js fs)

### Git Intelligence

Recent commits follow Conventional Commits format:
- `feat: story 1.2 — database infrastructure`
- `chore(ai): add project scope agent skills (react and shadcn)`
- `feat: story 1.1 — project scaffold and core tooling`

Expected commit for this story: `docs: story 1.3 — AGENTS.md developer reference`

### References

- Epic/story acceptance criteria: [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.3]
- FSD architecture rules: [Source: `_bmad-output/planning-artifacts/architecture.md` — FSD structure, Barrel files, Segment Convention]
- Naming conventions: [Source: `_bmad-output/planning-artifacts/architecture.md` — Naming Patterns]
- Error handling pattern: [Source: `_bmad-output/planning-artifacts/architecture.md` — Error handling]
- State management: [Source: `_bmad-output/planning-artifacts/architecture.md` — State Management Patterns]
- Platform adapters: [Source: `_bmad-output/planning-artifacts/architecture.md` — Platform adapter structure, Architectural Boundaries]
- Clean Code principles: [Source: `_bmad-output/planning-artifacts/architecture.md` — Clean Code Principles]
- Enforcement rules: [Source: `_bmad-output/planning-artifacts/architecture.md` — Enforcement Guidelines]
- Commit conventions: [Source: `_bmad-output/planning-artifacts/architecture.md` — Conventions & Versioning]
- CI/CD pipelines: [Source: `_bmad-output/planning-artifacts/architecture.md` — CI/CD section]
- Current AGENTS.md: [Source: `AGENTS.md` — existing Beads workflow, git branching, Drizzle convention]
- Previous story files: [Source: `_bmad-output/implementation-artifacts/1-1-*.md`, `1-2-*.md`]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No debug issues encountered. Documentation-only story with no code changes.

### Completion Notes List

- Replaced the entire `AGENTS.md` with a comprehensive 401-line developer reference document
- Distilled content from `architecture.md` into concise, actionable sections with code examples
- Preserved and refined existing Beads workflow, git branching, and Drizzle ORM conventions
- Removed `<!-- BEGIN/END BEADS INTEGRATION -->` markers — file is now a single cohesive document
- Included correct/incorrect code examples for: FSD imports, Result<T> usage, Zustand hydration, platform adapter selection, loading states
- Added Enforcement Checklist as quick-scan anti-pattern list
- Noted shadcn components location at `src/components/ui/` (not `src/shared/ui/`)
- Referenced correct versions: React 19, TypeScript ~5.9.3, Vite 7, Capacitor 8
- All 8 acceptance criteria verified satisfied
- All quality gates passed: lint (0 warnings), typecheck (0 errors), tests (16/16 passing)

### Change Log

- 2026-03-19: Complete rewrite of AGENTS.md as comprehensive developer reference (Story 1.3)

### File List

- `AGENTS.md` — complete rewrite (replaced entire file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated 1-2 to done, 1-3 to review
