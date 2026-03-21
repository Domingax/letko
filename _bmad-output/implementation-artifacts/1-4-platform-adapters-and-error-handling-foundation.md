# Story 1.4: Platform Adapters & Error Handling Foundation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a platform abstraction layer and a unified error handling pattern,
so that all features can be written once and run correctly on both web and Android without platform-specific branching in business logic.

## Acceptance Criteria

1. **Given** the platform adapters are implemented **When** business logic calls `filesystemAdapter.readFile(path)` **Then** the correct web or Android implementation is invoked based on `Capacitor.isNativePlatform()` — never a direct Capacitor or browser API call from feature code

2. **Given** the four adapter interfaces exist (`filesystem`, `tts`, `secureStorage`, `filePicker`) **When** a developer adds a new platform capability **Then** they follow the established pattern: interface + `*.web.ts` + `*.android.ts` + `index.ts` runtime selector in `src/shared/platform/<capability>/`

3. **Given** `neverthrow` is installed **When** a fallible async operation is written in feature code **Then** it returns `Promise<Result<T, string>>` — never throws for expected failure modes

4. **Given** a platform adapter call fails (e.g. file not found) **When** the result is consumed in feature code **Then** the TypeScript compiler enforces handling both `ok` and `err` branches — the error case cannot be silently ignored

5. **Given** the adapters are in place **When** unit tests run for a feature that uses a platform adapter **Then** the adapter can be swapped with a mock via dependency injection without modifying feature code

## Tasks / Subtasks

- [x] Task 1: Install missing platform packages (AC: #1, #2)
  - [x] Run `npm install @capacitor/filesystem @capacitor/browser @aparajita/capacitor-secure-storage`
  - [x] Run `npm install @capawesome/capacitor-file-picker` (or equivalent — see Dev Notes)
  - [x] Verify `neverthrow ^8.2.0` is already present in package.json (it is — no action needed)
  - [x] Run `npx cap sync` to register new plugins with Android project

- [x] Task 2: Implement `shared/lib/types.ts` — Result type utilities (AC: #3, #4)
  - [x] Create `src/shared/lib/types.ts` exporting `Result<T, E = string>`, `AsyncResult<T, E = string>` re-exported from `neverthrow`
  - [x] Export convenience type aliases: `type Result<T, E = string> = import('neverthrow').Result<T, E>`
  - [x] Update `src/shared/lib/index.ts` barrel to export from `types.ts`
  - [x] Write `src/shared/lib/types.test.ts` with a trivial usage test to confirm compiler enforcement (skipped — pure type re-exports; compiler enforcement validated via `tsc --noEmit`)

- [x] Task 3: Implement `filesystem` adapter (AC: #1, #2, #5)
  - [x] Create `src/shared/platform/filesystem/filesystem.interface.ts` with `FilesystemAdapter` interface
  - [x] Interface must include: `readFile(path: string): AsyncResult<string>`, `writeFile(path: string, data: string): AsyncResult<void>`, `deleteFile(path: string): AsyncResult<void>`, `mkdir(path: string): AsyncResult<void>`, `readdir(path: string): AsyncResult<string[]>`, `exists(path: string): AsyncResult<boolean>`
  - [x] Create `src/shared/platform/filesystem/filesystem.web.ts` — uses File System Access API / OPFS. All operations return `Result<T, string>` — never throw
  - [x] Create `src/shared/platform/filesystem/filesystem.android.ts` — wraps `@capacitor/filesystem` Filesystem plugin. All operations return `Result<T, string>`
  - [x] Create `src/shared/platform/filesystem/index.ts` — runtime selector via `Capacitor.isNativePlatform()`
  - [x] Write `src/shared/platform/filesystem/filesystem.web.test.ts` using a mock for the File System Access API
  - [x] Write `src/shared/platform/filesystem/filesystem.android.test.ts` with Capacitor.Filesystem mocked via `vi.mock`

- [x] Task 4: Implement `tts` adapter (AC: #1, #2, #5)
  - [x] Create `src/shared/platform/tts/tts.interface.ts` with `TtsAdapter` interface
  - [x] Interface: `speak(text: string, language: string): AsyncResult<void>`, `stop(): AsyncResult<void>`, `isAvailable(): Promise<boolean>`
  - [x] Create `src/shared/platform/tts/tts.web.ts` — uses `window.speechSynthesis` (Web Speech API). If unavailable, `isAvailable()` returns `false` — no error thrown
  - [x] Create `src/shared/platform/tts/tts.android.ts` — wraps `@capacitor-community/text-to-speech` (compatible Capacitor 8+). If plugin unavailable, degrade gracefully
  - [x] Create `src/shared/platform/tts/index.ts` — runtime selector
  - [x] Write `src/shared/platform/tts/tts.web.test.ts` — mock `window.speechSynthesis`
  - [x] Write `src/shared/platform/tts/tts.android.test.ts` — mock Capacitor plugin

- [x] Task 5: Implement `secure-storage` adapter (AC: #1, #2, #5)
  - [x] Create `src/shared/platform/secure-storage/secure-storage.interface.ts` with `SecureStorageAdapter` interface
  - [x] Interface: `get(key: string): AsyncResult<string>`, `set(key: string, value: string): AsyncResult<void>`, `remove(key: string): AsyncResult<void>`
  - [x] Create `src/shared/platform/secure-storage/secure-storage.web.ts` — uses `@aparajita/capacitor-secure-storage` web implementation (encrypted localStorage). Value must NEVER appear in logs or errors
  - [x] Create `src/shared/platform/secure-storage/secure-storage.android.ts` — uses `@aparajita/capacitor-secure-storage` Android Keystore. Value must NEVER appear in logs or errors
  - [x] Create `src/shared/platform/secure-storage/index.ts` — runtime selector
  - [x] **CRITICAL:** Error messages for this adapter must never include the stored value. On failure, return generic `err('Secure storage operation failed')` — never interpolate the value
  - [x] Write `src/shared/platform/secure-storage/secure-storage.web.test.ts` — mock the plugin
  - [x] Write `src/shared/platform/secure-storage/secure-storage.android.test.ts` — mock the plugin

- [x] Task 6: Implement `file-picker` adapter (AC: #1, #2, #5)
  - [x] Create `src/shared/platform/file-picker/file-picker.interface.ts` with `FilePickerAdapter` interface
  - [x] Interface: `pickFile(options: { accept?: string[] }): AsyncResult<PickedFile>` where `PickedFile = { name: string; data: ArrayBuffer }`
  - [x] Interface: `pickDirectory(): AsyncResult<string>` — returns a URI/path usable by the filesystem adapter
  - [x] Create `src/shared/platform/file-picker/file-picker.web.ts` — uses `showOpenFilePicker` / `showDirectoryPicker` with `<input type="file">` fallback
  - [x] Create `src/shared/platform/file-picker/file-picker.android.ts` — uses `@capawesome/capacitor-file-picker` for files and directories (content:// URI)
  - [x] Create `src/shared/platform/file-picker/index.ts` — runtime selector
  - [x] Write `src/shared/platform/file-picker/file-picker.web.test.ts` — mock File System Access API
  - [x] Write `src/shared/platform/file-picker/file-picker.android.test.ts` — mock plugin

- [x] Task 7: Implement `in-app-browser` adapter — GAP-03 resolution (AC: #1, #2, #5)
  - [x] Create `src/shared/platform/in-app-browser/in-app-browser.interface.ts` with `InAppBrowserAdapter` interface
  - [x] Interface: `open(url: string): AsyncResult<void>`
  - [x] Create `src/shared/platform/in-app-browser/in-app-browser.web.ts` — uses `window.open(url, '_blank')`. If blocked by browser, return `err('Popup blocked — open manually')`
  - [x] Create `src/shared/platform/in-app-browser/in-app-browser.android.ts` — uses `@capacitor/browser` plugin (`Browser.open({ url })`)
  - [x] Create `src/shared/platform/in-app-browser/index.ts` — runtime selector
  - [x] Write `src/shared/platform/in-app-browser/in-app-browser.web.test.ts` — mock `window.open`
  - [x] Write `src/shared/platform/in-app-browser/in-app-browser.android.test.ts` — mock `@capacitor/browser`

- [x] Task 8: Update `shared/platform/index.ts` barrel (AC: #1, #2)
  - [x] Export all five adapters from `src/shared/platform/index.ts`: `filesystemAdapter`, `ttsAdapter`, `secureStorageAdapter`, `filePickerAdapter`, `inAppBrowserAdapter`

- [x] Task 9: Verify dependency injection pattern in tests (AC: #5)
  - [x] Each adapter test must demonstrate the mock-injection pattern: pass a mock implementing the interface, verify business logic uses only the interface contract
  - [x] No test should import from the platform-specific implementation files — always import the interface only

- [x] Task 10: Run quality gates (AC: all)
  - [x] `npm run lint` — zero warnings (ESLint `--max-warnings 0`)
  - [x] `npm run typecheck` — zero errors (TypeScript strict mode + `noUncheckedIndexedAccess`)
  - [x] `npm run test` — all tests pass (73/73)

## Dev Notes

### What This Story Delivers

Five platform adapter implementations + a formalized `Result<T>` type layer. These are the **fundamental guardrails** that every subsequent story depends on. All future feature code routes platform calls through these adapters — no exceptions.

The `src/shared/platform/index.ts` barrel file currently exists as a placeholder comment: `// Platform adapters (populated in Story 1.4)`. Replace its content with actual exports.

The `src/shared/lib/index.ts` currently exports `{}`. Add `types.ts` to it.

### Project Structure Notes

**Alignment with architecture:**

```
src/shared/platform/
├── filesystem/
│   ├── index.ts                       ← exports filesystemAdapter
│   ├── filesystem.interface.ts
│   ├── filesystem.web.ts
│   └── filesystem.android.ts
├── tts/
│   ├── index.ts
│   ├── tts.interface.ts
│   ├── tts.web.ts
│   └── tts.android.ts
├── secure-storage/
│   ├── index.ts
│   ├── secure-storage.interface.ts
│   ├── secure-storage.web.ts
│   └── secure-storage.android.ts
├── file-picker/
│   ├── index.ts
│   ├── file-picker.interface.ts
│   ├── file-picker.web.ts
│   └── file-picker.android.ts
├── in-app-browser/
│   ├── index.ts
│   ├── in-app-browser.interface.ts
│   ├── in-app-browser.web.ts
│   └── in-app-browser.android.ts
└── index.ts                           ← barrel: exports all five adapters
```

**shadcn components location:** `src/components/ui/` — NOT `src/shared/ui/`. Do not confuse the two.

**No new stores needed.** Platform adapters are stateless utilities — no Zustand store is introduced in this story.

**No new SQLite schema.** This story touches only `shared/platform/` and `shared/lib/`.

### Package Decisions

The following packages are NOT yet in `package.json` and must be installed:

| Package | Adapter | Purpose |
|---|---|---|
| `@capacitor/filesystem` | filesystem.android | Read/write files on Android (scoped storage + SAF) |
| `@capacitor/browser` | in-app-browser.android | Open external URLs in Capacitor WebView |
| `@aparajita/capacitor-secure-storage` | secure-storage.web + android | Android Keystore / encrypted localStorage |
| `@capawesome/capacitor-file-picker` | file-picker.android | SAF file picker returning content:// URIs |

Already installed (no action needed):
- `neverthrow ^8.2.0` — Result<T> pattern
- `@capacitor/core ^8.2.0` — `Capacitor.isNativePlatform()` runtime selector

**For TTS Android:** Check if `@capacitor-community/text-to-speech` is the right plugin. At time of writing it requires Capacitor 6+; with Capacitor 8 in use, verify compatibility before installing. If incompatible, implement a thin Capacitor plugin wrapper around Android's `TextToSpeech` API, or use a community alternative. The `isAvailable()` method must return `false` (not throw) if TTS is unavailable — the UI hides the button, no error shown (per NFR24).

### Error Handling Pattern — Critical Rules

All adapter methods return `Promise<Result<T, string>>` (AsyncResult). Key rules:

```typescript
import { ok, err, Result } from 'neverthrow'

// ✅ Correct adapter implementation
async function readFile(path: string): Promise<Result<string, string>> {
  try {
    const content = await someNativeApi.read(path)
    return ok(content)
  } catch (e) {
    return err(`Failed to read file: ${path}`)
    // ❌ Never: return err(`Failed to read file: ${path}, error: ${String(e)}`) for secure-storage
  }
}

// ✅ Correct consumer — compiler enforces both branches
const result = await filesystemAdapter.readFile(path)
if (result.isErr()) {
  // handle inline — never re-throw
  return err(result.error)
}
const content = result.value
```

**`throw` is ONLY permitted** for unrecoverable programmer errors (violated invariants, impossible states). Network offline, file not found, plugin unavailable — all return `err(...)`.

**Secure storage special rule:** error messages must NEVER include the key value or any retrieved value. Always use generic error strings.

### Dependency Injection Pattern for Tests

The dependency injection pattern that satisfies AC #5:

```typescript
// ✅ Correct — feature accepts adapter via parameter (or closure)
async function saveApiKey(
  key: string,
  storage: SecureStorageAdapter  // ← injectable
): Promise<Result<void, string>> {
  return storage.set('ai_api_key', key)
}

// In test — swap with mock, no modification to feature code
const mockStorage: SecureStorageAdapter = {
  get: vi.fn().mockResolvedValue(ok('test-value')),
  set: vi.fn().mockResolvedValue(ok(undefined)),
  remove: vi.fn().mockResolvedValue(ok(undefined)),
}
const result = await saveApiKey('sk-test', mockStorage)
expect(result.isOk()).toBe(true)
```

This pattern means no test ever calls `Capacitor.isNativePlatform()` — the runtime selector in `index.ts` is bypassed entirely during unit tests.

### TDD Protocol — Mandatory

Per AGENTS.md: write a failing test first, then write minimum code to make it pass, then refactor.

For each adapter:
1. Write the interface file
2. Write the test file (imports interface, uses mock of underlying API)
3. Run test — it should fail (interface exists but implementation does not)
4. Write implementation — tests pass
5. Refactor if needed

No implementation file is written before a failing test exists.

### Vitest Configuration Notes

Tests run in Vitest with `jsdom`. Platform-specific APIs must be mocked:
- `window.speechSynthesis` — mock in `tts.web.test.ts` via `vi.stubGlobal`
- `window.open` — mock in `in-app-browser.web.test.ts` via `vi.stubGlobal`
- `showOpenFilePicker`, `showDirectoryPicker` — mock via `vi.stubGlobal` in `file-picker.web.test.ts`
- Capacitor plugins — mock via `vi.mock('@capacitor/filesystem')`, `vi.mock('@capacitor/browser')`, etc.

Test co-location rule: `*.test.ts` files live next to the source file (same directory).

### Architectural Boundaries — Hard Rules

From architecture.md (Architectural Boundaries section):

- **Platform boundary:** `shared/platform/` is the ONLY location where Capacitor APIs are called. No feature or widget may import from `@capacitor/*` directly.
- **Secure storage boundary:** `shared/platform/secure-storage/` is the ONLY location where API keys are read or written. Keys must never pass through any other layer.
- **InAppBrowser boundary:** `shared/platform/in-app-browser/` is the ONLY location for opening external URLs. No feature may call `window.open()` or `@capacitor/browser` directly.
- **Vault boundary:** `shared/platform/filesystem/` is the ONLY location for vault folder operations.

These boundaries are enforced in code review. Any direct Capacitor API call outside `shared/platform/` is rejected.

### Previous Story Learnings (1.1, 1.2, 1.3)

- **Vite 7** (not Vite 6), **Capacitor 8** (not Capacitor 6) — use these versions in any documentation
- **TypeScript ~5.9.3** with strict mode AND `noUncheckedIndexedAccess` — all array accesses return `T | undefined`; adapt adapter implementations accordingly
- **ESLint `--max-warnings 0`** — zero lint warnings allowed. If a lint rule conflicts with a pattern, fix the pattern, not the rule
- **`buttonVariants` pattern** — if exporting both component and non-component values from the same TSX file, split into separate files to avoid React Fast Refresh lint warnings
- **neverthrow** is already installed at v8.2.0 — use the `ok`, `err`, `Result` named exports directly
- **Test files co-located** — no `__tests__/` directories
- **`drizzle-orm v0.45.1`** and **`drizzle-kit v0.31.9`** — do not update these in this story

### Git Intelligence

Recent commits:
- `docs: story 1.3 — AGENTS.md developer reference`
- `feat: story 1.2 — database infrastructure`
- `feat: story 1.1 — project scaffold and core tooling`

Expected commit for this story: `feat: story 1.4 — platform adapters and error handling foundation`

Branch: `story/1-4-platform-adapters-and-error-handling-foundation` (from main)

### References

- Story acceptance criteria: [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.4]
- Platform adapter structure: [Source: `_bmad-output/planning-artifacts/architecture.md` — Structure Patterns § Platform adapter structure]
- Architectural boundaries: [Source: `_bmad-output/planning-artifacts/architecture.md` — Architectural Boundaries]
- Error handling pattern: [Source: `_bmad-output/planning-artifacts/architecture.md` — Format Patterns § Error handling]
- GAP-03 (InAppBrowser): [Source: `_bmad-output/planning-artifacts/architecture.md` — Critical Gaps with Resolutions]
- Security constraints (API keys): [Source: `_bmad-output/planning-artifacts/architecture.md` — Security; NFR7, NFR8]
- TTS degradation: [Source: `_bmad-output/planning-artifacts/epics.md` — NFR24]
- Enforcement guidelines: [Source: `_bmad-output/planning-artifacts/architecture.md` — Enforcement Guidelines]
- Previous story file: [Source: `_bmad-output/implementation-artifacts/1-3-agents-md-and-developer-reference.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Installed `@capacitor/filesystem`, `@capacitor/browser`, `@aparajita/capacitor-secure-storage`, `@capawesome/capacitor-file-picker`, `@capacitor-community/text-to-speech` (verified Capacitor 8+ compatible). All synced via `npx cap sync`.
- `src/shared/lib/types.ts` re-exports `Result<T, E>` and `AsyncResult<T, E>` from neverthrow. No runtime test (pure types); compiler enforcement validated via `tsc --noEmit`.
- Five adapters implemented with interface + web + android + runtime selector: filesystem, tts, secure-storage, file-picker, in-app-browser.
- Secure storage error messages use a fixed generic string — no key or value interpolation.
- Web filesystem handles `.` and empty path segments as root directory (resolveDir fix).
- File picker web falls back to `<input type="file">` when `showOpenFilePicker` is absent.
- Android file picker returns `err` on empty files array (user cancellation), not only on throw.
- `window.speechSynthesis` availability checked via `!!window.speechSynthesis` (not `in` operator) to correctly detect when stubbed to `undefined`.
- 73 tests, 15 test files — all pass. Zero lint warnings. Zero TypeScript errors.

### File List

- `src/shared/lib/types.ts`
- `src/shared/lib/index.ts`
- `src/shared/platform/index.ts`
- `src/shared/platform/filesystem/filesystem.interface.ts`
- `src/shared/platform/filesystem/filesystem.web.ts`
- `src/shared/platform/filesystem/filesystem.android.ts`
- `src/shared/platform/filesystem/filesystem.web.test.ts`
- `src/shared/platform/filesystem/filesystem.android.test.ts`
- `src/shared/platform/filesystem/index.ts`
- `src/shared/platform/tts/tts.interface.ts`
- `src/shared/platform/tts/tts.web.ts`
- `src/shared/platform/tts/tts.android.ts`
- `src/shared/platform/tts/tts.web.test.ts`
- `src/shared/platform/tts/tts.android.test.ts`
- `src/shared/platform/tts/index.ts`
- `src/shared/platform/secure-storage/secure-storage.interface.ts`
- `src/shared/platform/secure-storage/secure-storage.web.ts`
- `src/shared/platform/secure-storage/secure-storage.android.ts`
- `src/shared/platform/secure-storage/secure-storage.web.test.ts`
- `src/shared/platform/secure-storage/secure-storage.android.test.ts`
- `src/shared/platform/secure-storage/index.ts`
- `src/shared/platform/file-picker/file-picker.interface.ts`
- `src/shared/platform/file-picker/file-picker.web.ts`
- `src/shared/platform/file-picker/file-picker.android.ts`
- `src/shared/platform/file-picker/file-picker.web.test.ts`
- `src/shared/platform/file-picker/file-picker.android.test.ts`
- `src/shared/platform/file-picker/index.ts`
- `src/shared/platform/in-app-browser/in-app-browser.interface.ts`
- `src/shared/platform/in-app-browser/in-app-browser.web.ts`
- `src/shared/platform/in-app-browser/in-app-browser.android.ts`
- `src/shared/platform/in-app-browser/in-app-browser.web.test.ts`
- `src/shared/platform/in-app-browser/in-app-browser.android.test.ts`
- `src/shared/platform/in-app-browser/index.ts`
- `package.json`
- `package-lock.json`
