# Story 1.1: Project Scaffold & Core Tooling

Status: ready-for-dev

## Story

As a developer,
I want a fully initialized project with the correct stack and FSD structure,
so that I can start building features immediately without any setup friction.

## Acceptance Criteria

1. **Given** the repository is cloned on a fresh machine **When** the developer runs `npm install && npm run dev` **Then** the Vite dev server starts and the app loads in the browser without errors
2. **Given** the project is initialized **When** a developer inspects the source structure **Then** the FSD directory tree exists (`src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared/ui`, `src/shared/db`, `src/shared/platform`, `src/shared/lib`) each with an `index.ts` barrel file
3. **Given** the project is initialized **When** TypeScript compilation runs (`npm run typecheck`) **Then** it completes with zero errors in strict mode
4. **Given** the project is initialized **When** the linter runs (`npm run lint`) **Then** it completes with zero errors or warnings
5. **Given** the project is initialized **When** Capacitor CLI runs `npx cap sync` **Then** the Android platform is present and syncs without errors
6. **Given** shadcn/ui is initialized **When** a developer imports a shadcn component (e.g. `Button`) **Then** it renders correctly in the browser with Tailwind styles applied

## Tasks / Subtasks

- [ ] Task 1: Initialize Vite React-TS project (AC: #1)
  - [ ] Run `npm create vite@latest letko -- --template react-ts`
  - [ ] Verify `npm install && npm run dev` works
  - [ ] Set `appId: "com.letko.app"` and `webDir: "dist"` in capacitor config

- [ ] Task 2: Create FSD directory structure (AC: #2)
  - [ ] Create all FSD directories: `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared/ui`, `src/shared/db`, `src/shared/platform`, `src/shared/lib`
  - [ ] Add `index.ts` barrel file in each directory (export placeholder `{}` if empty)
  - [ ] Add `src/shared/stores/` with `index.ts` for Zustand stores

- [ ] Task 3: Configure TypeScript strict mode (AC: #3)
  - [ ] Set `"strict": true` in `tsconfig.json`
  - [ ] Add `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`
  - [ ] Add `npm run typecheck` script: `"typecheck": "tsc --noEmit"`
  - [ ] Verify zero errors

- [ ] Task 4: Configure ESLint (AC: #4)
  - [ ] Install and configure ESLint with TypeScript support
  - [ ] Add `npm run lint` script: `"lint": "eslint src --max-warnings 0"`
  - [ ] Verify zero errors/warnings

- [ ] Task 5: Initialize Capacitor and add Android platform (AC: #5)
  - [ ] Install `@capacitor/core` and `@capacitor/cli`
  - [ ] Run `npx cap init letko com.letko.app --web-dir dist`
  - [ ] Run `npx cap add android`
  - [ ] Build once (`npm run build`) then `npx cap sync` to verify Android platform is present

- [ ] Task 6: Initialize shadcn/ui with Tailwind CSS v4 (AC: #6)
  - [ ] Run `npx shadcn@latest init`
  - [ ] Verify a Button component can be imported and renders with Tailwind styles
  - [ ] Confirm `src/components/ui/` (shadcn default) aliased correctly — see note below about shadcn path alias

- [ ] Task 7: Install core dependencies
  - [ ] `npm install neverthrow zustand react-router-dom`
  - [ ] `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom`
  - [ ] Create `vitest.config.ts` (extend vite config, set `environment: 'jsdom'`)
  - [ ] Add `npm run test` and `npm run test:coverage` scripts

- [ ] Task 8: Configure commit tooling
  - [ ] Install `husky`, `commitlint`, `commitizen`, `@commitlint/config-conventional`
  - [ ] Run `npx husky init`
  - [ ] Create `.commitlintrc.js` with `extends: ['@commitlint/config-conventional']`
  - [ ] Create `.czrc` with `{ "path": "cz-conventional-changelog" }`
  - [ ] Add `git cz` alias or note in README

- [ ] Task 9: Create vite.config.ts with path aliases and COOP/COEP headers
  - [ ] Add `@` alias pointing to `src/`
  - [ ] Configure dev server with COOP/COEP headers (required for SQLite WASM + OPFS)

- [ ] Task 10: Write minimal smoke test (verify test pipeline works)
  - [ ] Create `src/app/App.test.tsx` that imports `App` and asserts it renders without throwing
  - [ ] Run `npm run test` and confirm it passes

## Dev Notes

### Tech Stack — Exact Versions to Use

| Technology | Version | Notes |
|---|---|---|
| Node.js | 18+ | Minimum for husky v9 |
| TypeScript | 5.x (latest) | Strict mode required |
| React | 19.x | |
| Vite | 6.x | react-ts template |
| Tailwind CSS | v4 | **Major breaking change vs v3** — see below |
| shadcn/ui | latest | `npx shadcn@latest init` |
| Capacitor | 6.x | `@capacitor/core`, `@capacitor/cli` |
| Zustand | 5.x | |
| neverthrow | latest | |
| React Router | v7.x | |
| Vitest | 2.x | |
| @tanstack/react-virtual | v3 | Install now as dependency, used in Epic 4 |

### ⚠️ Tailwind CSS v4 — Critical Differences from v3

Tailwind CSS v4 is a **major breaking change**. Do NOT follow v3 tutorials or docs:

- **No `tailwind.config.ts` file** — configuration moves entirely into CSS using `@theme` directive
- Import in CSS: `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Theming with CSS custom properties under `@theme { }` block
- shadcn/ui init with `--legacy-peer-deps` may be needed if peer dep conflicts arise
- The `npx shadcn@latest init` command should auto-detect Tailwind v4 and configure accordingly

### FSD Directory Structure (Mandatory)

Create this exact structure. Every directory MUST have an `index.ts` barrel file:

```
src/
├── app/
│   └── index.ts           ← routing, providers, global CSS entry
├── pages/
│   └── index.ts
├── widgets/
│   └── index.ts
├── features/
│   └── index.ts
├── entities/
│   └── index.ts
└── shared/
    ├── ui/
    │   └── index.ts       ← shadcn components re-exported here
    ├── db/
    │   └── index.ts       ← Drizzle schema + migrations (empty for now)
    ├── platform/
    │   └── index.ts       ← platform adapters (empty for now)
    ├── stores/
    │   └── index.ts       ← Zustand stores (empty for now)
    └── lib/
        └── index.ts       ← utils, types, constants (empty for now)
```

**FSD Import Rule (MUST enforce):** Import direction is unidirectional only:
```
pages → widgets → features → entities → shared
```
Never import "upward" (e.g., `shared` must never import from `features`).

### Naming Conventions (Strict — Enforced via Lint)

- React components: **PascalCase** (`BookListItem.tsx`, `TranslationPanel.tsx`)
- All other files: **kebab-case** (`import-book.ts`, `use-vault.ts`, `drizzle.config.ts`)
- Test files: same name + `.test` suffix, **co-located** with source (`import-book.test.ts`)
- Functions/variables: **camelCase** (`importBook`, `wordKey`)
- Types/interfaces: **PascalCase** (`BookEntity`, `VocabEntry`)
- Zustand stores: `use[Domain]Store` (`useReaderStore`, `useVaultStore`)
- Platform adapters: `[capability]Adapter` (`filesystemAdapter`, `ttsAdapter`)
- Constants: **SCREAMING_SNAKE_CASE** (`MAX_VOCAB_ENTRIES`, `DEFAULT_FONT_SIZE`)
- SQLite columns: **snake_case** → TypeScript: **camelCase** (Drizzle handles mapping)

**NEVER** create `__tests__/` directories. Tests are always co-located.

### Configuration Files to Create

All of these must exist after Story 1.1 is complete:

```
letko/
├── vite.config.ts              ← Vite, path aliases (@→src/), COOP/COEP headers
├── tsconfig.json               ← TypeScript strict mode
├── tsconfig.app.json           ← App-specific tsconfig (from Vite template)
├── tsconfig.node.json          ← Node tooling tsconfig (from Vite template)
├── capacitor.config.ts         ← appId: "com.letko.app", webDir: "dist"
├── vitest.config.ts            ← extends vite.config, jsdom environment
├── eslint.config.js            ← TypeScript ESLint rules
├── .commitlintrc.js            ← extends @commitlint/config-conventional
├── .czrc                       ← { "path": "cz-conventional-changelog" }
└── .husky/
    └── commit-msg              ← npx --no commitlint --edit $1
```

**NOT yet needed** (added in later stories):
- `drizzle.config.ts` — Story 1.2
- `playwright.config.ts` — Story 1.5
- `sonar-project.properties` — Story 1.5
- `tailwind.config.ts` — Does NOT exist in Tailwind v4

### vite.config.ts — Required Headers for SQLite WASM

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
```

These headers are **mandatory** for SQLite WASM + OPFS (used in Story 1.2). Setting them now avoids refactoring.

### Capacitor Setup — Key Details

```bash
npm install @capacitor/core @capacitor/cli
npx cap init letko com.letko.app --web-dir dist
npx cap add android
npm run build   # must build before cap sync
npx cap sync
```

**`capacitor.config.ts` content:**
```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.letko.app',
  appName: 'letko',
  webDir: 'dist',
}

export default config
```

**Android requirements** (developer machine):
- Android SDK installed (Android Studio recommended)
- Java 17 (Capacitor 6 requirement)
- `ANDROID_HOME` environment variable set

### shadcn/ui — Path Alias Note

shadcn/ui by default installs components to `src/components/ui/`. For this project, these should be re-exported through `src/shared/ui/index.ts` to follow FSD conventions. During init, point the component path to `src/shared/ui` if the CLI supports it, or place in `src/components/ui/` and re-export from `src/shared/ui/index.ts`.

### Error Handling Pattern (Must Use Everywhere from Day 1)

The `neverthrow` library is the standard error handling approach:

```typescript
import { ok, err, Result } from 'neverthrow'

// ✅ Correct
async function doSomething(): Promise<Result<string, string>> {
  return ok('result')
}

// ❌ Never throw for expected failures
```

This pattern must be established in Story 1.1 so all subsequent stories follow it. At minimum, add `neverthrow` as a dependency now.

### Commit Format (Conventional Commits — Enforced by commitlint)

```
feat: add vault setup screen
fix: resolve OPFS initialization on Firefox
docs: update AGENTS.md with testing patterns
chore: update Capacitor to v6.1
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

### What NOT to Build in This Story

The following belong to later stories — do NOT implement them here:
- Database schema or Drizzle migrations → Story 1.2
- Platform adapters (filesystem, TTS, etc.) → Story 1.4
- Error handling utilities beyond installing neverthrow → Story 1.4
- CI/CD GitHub Actions workflows → Story 1.5
- Any UI screens or features → Epic 2+
- AGENTS.md or developer docs → Story 1.3

### Project Structure Notes

- This is a **Vite React-TS SPA** with Capacitor for Android — not an Ionic project, not a Capacitor + Ionic project
- Do NOT use `@ionic/react` or any Ionic components — pure React + shadcn/ui only
- The project name is `letko` (lowercase), package ID is `com.letko.app`
- Target web output: `dist/` (Vite default)
- The app is **offline-first by design** — no SSR, no server-side rendering

### References

- Full technical stack: [Source: `_bmad-output/planning-artifacts/architecture.md` — Technical Stack section]
- FSD directory structure: [Source: `_bmad-output/planning-artifacts/architecture.md` — Code Structure section]
- Capacitor initialization commands: [Source: `_bmad-output/planning-artifacts/architecture.md` — Tooling/Scaffolding section]
- COOP/COEP headers requirement: [Source: `_bmad-output/planning-artifacts/architecture.md` — GitHub Pages Deployment section]
- CI/CD pipeline overview: [Source: `_bmad-output/planning-artifacts/architecture.md` — CI/CD section]
- Naming conventions: [Source: `_bmad-output/planning-artifacts/architecture.md` — Naming Patterns section]
- Error handling (neverthrow): [Source: `_bmad-output/planning-artifacts/architecture.md` — Error Handling section]
- Story acceptance criteria: [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.1]
- Product vision and platform targets: [Source: `_bmad-output/planning-artifacts/prd.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
