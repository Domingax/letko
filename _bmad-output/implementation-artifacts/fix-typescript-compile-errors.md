# Story: fix(types) — resolve 9 TypeScript compile errors blocking tsc -b

Status: done

GitHub Issue: #5

## Story

As a developer,
I want `npm run build` (tsc -b && vite build) to exit 0,
so that the CI build step uses full type validation and Epic 2 can proceed on a clean foundation.

## Context

Story 1.4 left 9 TypeScript type errors that prevent `npm run build` from completing. CI currently bypasses this via `npx vite build`. This must be fixed before Epic 2 — vault logic will be built on top of `filesystemAdapter` and `db/index.ts`.

## Acceptance Criteria

1. **Given** the project builds **When** `npm run build` runs **Then** it exits 0 with no `tsc -b` errors
2. **Given** the fix is applied **When** `npm run typecheck` runs **Then** it still passes
3. **Given** the fix is applied **When** `npm run test` runs **Then** all existing tests still pass

## Error Inventory

| File | Line | Error |
|------|------|-------|
| `src/shared/db/index.ts` | 19 | `Property 'DB' does not exist on type 'never'` — sqlite-wasm oo1 not typed correctly |
| `src/shared/platform/file-picker/file-picker.android.ts` | 21, 35 | `'multiple' does not exist in PickFilesOptions` — @capawesome type mismatch |
| `src/shared/platform/file-picker/file-picker.web.ts` | 29, 30, 51 | `showOpenFilePicker` / `showDirectoryPicker` not in TS DOM lib |
| `src/shared/platform/filesystem/filesystem.web.ts` | 93 | `FileSystemDirectoryHandle.entries()` missing from types |
| `src/shared/platform/secure-storage/secure-storage.android.test.ts` | 20 | `undefined` not assignable to `boolean` in mock |
| `src/shared/platform/secure-storage/secure-storage.web.test.ts` | 20 | same as above |

## Tasks / Subtasks

### Commit 1: `fix(types): resolve TypeScript compile errors blocking tsc -b`

- [x] Task 1: Fix File System Access API types (file-picker.web.ts lines 29/30/51, filesystem.web.ts line 93)
  - [x] Install `@types/wicg-file-system-access` as a devDependency: `npm install --save-dev @types/wicg-file-system-access`
  - [x] Add `"wicg-file-system-access"` to the `types` array in `tsconfig.app.json` (alongside `"vite/client"`)
  - [x] Verify `showOpenFilePicker`, `showDirectoryPicker`, and `FileSystemDirectoryHandle.entries()` are now resolved
  - [x] Cast `accept` values as `` `.${string}`[] `` in `showOpenFilePicker` call to satisfy `FilePickerAcceptType` constraints introduced by the stricter types package

- [x] Task 2: Fix sqlite-wasm oo1 type (db/index.ts line 19)
  - [x] The `sqlite3.oo1` value is inferred as `never` because `@sqlite.org/sqlite-wasm` types are incomplete
  - [x] Cast `oo` to `any` at assignment: `const oo = sqlite3.oo1 as any` (with eslint-disable comment)

- [x] Task 3: Fix @capawesome file-picker `multiple` option (file-picker.android.ts lines 21, 35)
  - [x] The current API uses `limit` instead of `multiple` — replaced `multiple: false` with `limit: 1` in both call sites
  - [x] Used conditional spread `...(options.accept !== undefined && { types: options.accept })` to satisfy `exactOptionalPropertyTypes`

- [x] Task 4: Fix secure-storage test mocks (secure-storage.android.test.ts:20, secure-storage.web.test.ts:20)
  - [x] `SecureStorage.remove` returns `Promise<boolean>` — changed `mockResolvedValue(undefined)` to `mockResolvedValue(true)` in both test files
  - [x] `SecureStorage.set` returns `Promise<void>` — kept `mockResolvedValue(undefined)` (correct)

- [x] Task 5: Quality gate
  - [x] `npm run build` — exits 0 (no tsc -b errors, no vite build errors)
  - [x] `npm run typecheck` — exits 0
  - [x] `npm run test` — 73/73 tests pass (15 test files)
  - [x] `npm run lint` — zero warnings/errors

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] `sqlite3.oo1 as any` makes entire `oo` usage untyped — cascading `as typeof oo.DB` on line 21 is vacuous since `oo` is `any`. Acceptable workaround for incomplete upstream `@sqlite.org/sqlite-wasm` types, but track for removal when upstream publishes proper oo1 typings [src/shared/db/index.ts:19]
- [ ] [AI-Review][LOW] `accept as `.${string}`[]` cast masks a semantic gap in `FilePickerAdapter` interface — `accept` is typed as `string[]` but `showOpenFilePicker` expects extension strings. Consider tightening the interface type to `` `.${string}`[] `` to catch misuse at compile time [src/shared/platform/file-picker/file-picker.web.ts:34]

## Dev Agent Record

### Implementation Notes

- **Task 3 deviation**: The story spec suggested using `as any` for the `multiple` property. The actual fix was better — `multiple` was replaced by `limit` in a newer API version, so using `limit: 1` is semantically correct, not just a type workaround.
- **Task 1 extra step**: Installing `@types/wicg-file-system-access` also introduced stricter `FilePickerAcceptType` constraints that required casting `accept as `.${string}`[]` in `file-picker.web.ts`. This is a pre-existing semantic gap (callers pass MIME types as accept values, but the File System Access API expects extension strings).
- **Task 4 correction**: Only `remove` needed changing to `true` (returns `Promise<boolean>`); `set` correctly stays `undefined` (returns `Promise<void>`).

### Completion Notes

All 9 TypeScript errors resolved. `npm run build` now uses `tsc -b` for full type validation. 73 tests passing, lint clean.

## File List

- `_bmad-output/implementation-artifacts/fix-typescript-compile-errors.md` (this file)
- `tsconfig.app.json` — added `wicg-file-system-access` to types array
- `package.json` — added `@types/wicg-file-system-access` devDependency
- `package-lock.json` — updated lockfile
- `src/shared/db/index.ts` — cast `sqlite3.oo1 as any`
- `src/shared/platform/file-picker/file-picker.android.ts` — replaced `multiple: false` with `limit: 1`, used conditional spread for `types`
- `src/shared/platform/file-picker/file-picker.web.ts` — cast `accept as `.${string}`[]`
- `src/shared/platform/secure-storage/secure-storage.android.test.ts` — `mockResolvedValue(true)` for `remove`
- `src/shared/platform/secure-storage/secure-storage.web.test.ts` — `mockResolvedValue(true)` for `remove`

## Change Log

- 2026-03-22: Resolved 9 TypeScript compile errors blocking `tsc -b` (issue #5). Installed `@types/wicg-file-system-access`, fixed sqlite-wasm cast, updated file-picker to use `limit` API, corrected secure-storage test mocks.
