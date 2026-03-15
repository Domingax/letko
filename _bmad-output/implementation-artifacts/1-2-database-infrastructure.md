# Story 1.2: Database Infrastructure

Status: review

## Story

As a developer,
I want a SQLite database layer with Drizzle ORM and automatic migrations,
so that all subsequent features can persist data reliably on both web and Android without manual setup.

## Acceptance Criteria

1. **Given** the app starts on web **When** `main.tsx` runs **Then** Drizzle's `migrate()` executes automatically and the `lekto.db` file is created in the default OPFS storage location without errors
2. **Given** the app starts on Android **When** `main.tsx` runs **Then** the same migration runner executes via the Capacitor SQLite adapter and `lekto.db` is created without errors
3. **Given** a migration file exists in `src/shared/db/migrations/` **When** the app restarts **Then** the migration is applied exactly once and idempotent re-runs produce no errors
4. **Given** the Drizzle schema defines a column in snake_case (e.g. `word_key`) **When** the TypeScript type is generated via `drizzle-kit generate` **Then** the resulting TypeScript type uses camelCase (`wordKey`) automatically
5. **Given** the database infrastructure is in place **When** a developer runs `npm run db:generate` **Then** a new migration file is produced in `src/shared/db/migrations/`

## Tasks / Subtasks

- [x] Task 1: Install Drizzle ORM and SQLite driver dependencies (AC: #4, #5)
  - [x] Install runtime deps: `npm install drizzle-orm @sqlite.org/sqlite-wasm @capacitor-community/sqlite`
  - [x] Install dev dep: `npm install -D drizzle-kit`
  - [x] Add `"db:generate": "drizzle-kit generate"` to `package.json` scripts

- [x] Task 2: Define Drizzle schema (AC: #4)
  - [x] Create `src/shared/db/schema.ts` with all 6 tables using Drizzle's `sqliteTable` helper
  - [x] Tables: `languages`, `books`, `sections`, `tokens`, `vocabulary`, `reading_progress` — see Dev Notes for full column spec
  - [x] All column names: snake_case; TypeScript types will be camelCase automatically via Drizzle inference
  - [x] `books.language` and `vocabulary.language` are FKs referencing `languages.code`
  - [x] `readingProgress` uses `sectionId` (FK → `sections.id`) + `tokenIndex` (positional integer) — not raw section index
  - [x] `vocabulary` uses a composite PK `(word_key, language)` via Drizzle's `primaryKey()`
  - [x] Add required indexes: `tokens(section_id, index)`, `vocabulary(language)`, `books(language)`, composite PK on vocabulary
  - [x] Add seed function `src/shared/db/seed-languages.ts` that `INSERT OR IGNORE`s the ISO 639-1 language list — see Dev Notes
  - [x] Write unit test `src/shared/db/schema.test.ts` verifying all 6 tables and their key columns are defined

- [x] Task 3: Configure drizzle-kit and generate initial migration (AC: #5)
  - [x] Create `drizzle.config.ts` at repo root — see Dev Notes for content
  - [x] Run `npm run db:generate` to produce the initial migration file in `src/shared/db/migrations/`
  - [x] Verify the generated SQL in `src/shared/db/migrations/` reflects the 6-table schema

- [x] Task 4: Create platform-aware database instance (AC: #1, #2)
  - [x] Replace `src/shared/db/index.ts` stub with the platform-aware db factory — see Dev Notes for implementation
  - [x] Web path: initialize `@sqlite.org/sqlite-wasm` with OPFS, wrap with `drizzle-orm/sqlite-proxy`
  - [x] Android path: use `@capacitor-community/sqlite` plugin, wrap with `drizzle-orm/sqlite-proxy` (drizzle-orm/capacitor-sqlite not available in v0.45.1; SQLiteConnection wrapped via proxy callback)
  - [x] Export a single async `initDb(): Promise<DrizzleDb>` function; export the `DrizzleDb` type
  - [x] **Do NOT export a module-level db singleton** — db must be initialized async before use

- [x] Task 5: Create migration runner (AC: #1, #2, #3)
  - [x] Create `src/shared/db/migrate.ts` — see Dev Notes for implementation
  - [x] Import migration files via Vite `import.meta.glob` (for web bundle compatibility)
  - [x] Call Drizzle's `migrate()` with the bundled migration SQL
  - [x] Return `Result<void, string>` (neverthrow) — never throw across module boundaries
  - [x] Write unit test `src/shared/db/migrate.test.ts` verifying migrate() is called exactly once and idempotent re-runs return `ok()`

- [x] Task 6: Wire database initialization into app startup (AC: #1, #2)
  - [x] Update `src/main.tsx` to call `initDb()`, `runMigrations()`, then `seedLanguages()` before rendering the React root
  - [x] On migration failure, render a minimal error message (do not crash silently)
  - [x] The db instance is passed into app context or stored in a module-level variable in `src/shared/db/index.ts` after initialization

- [x] Task 7: Export barrel and run full validation (AC: all)
  - [x] Update `src/shared/db/index.ts` barrel to re-export `initDb`, `DrizzleDb` type, `schema`, `migrate`, and `seedLanguages`
  - [x] Run `npm run typecheck` — zero errors
  - [x] Run `npm run lint` — zero warnings
  - [x] Run `npm run test` — all tests pass (including smoke test from story 1.1)

## Dev Notes

### Packages to Install

```bash
# Runtime
npm install drizzle-orm @sqlite.org/sqlite-wasm @capacitor-community/sqlite

# Dev (migration generator)
npm install -D drizzle-kit
```

**Version context (story 1.1 established):**
- TypeScript: ~5.9.3 (strict mode)
- Vite: ^7.3.1 (NOT Vite 6 — story 1.1 upgraded to Vite 7 for peer dep compatibility)
- Capacitor: ^8.2.0 (NOT Capacitor 6 — story 1.1 upgraded to Capacitor 8)
- React: ^19.2.4
- Vitest: ^4.1.0

Verify drizzle-orm peer deps are compatible with the above. If any conflict, prefer drizzle-orm latest stable.

### Drizzle Schema (`src/shared/db/schema.ts`)

Create all 6 tables using Drizzle's `sqliteTable`. All column names are `snake_case`; Drizzle infers camelCase TypeScript types automatically — **never manually alias column names**.

```typescript
import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core'

// Lookup table — pre-seeded with ISO 639-1 codes via seed-languages.ts
export const languages = sqliteTable('languages', {
  code: text('code').primaryKey(),   // ISO 639-1: 'en', 'fr', 'es', 'de', 'zh', 'ja', …
  name: text('name').notNull(),      // 'English', 'French', 'Spanish', …
})

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),                  // UUID
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  language: text('language').notNull().references(() => languages.code),
  coverPath: text('cover_path'),
  createdAt: integer('created_at').notNull(),   // Unix timestamp (seconds)
}, (table) => [
  index('books_language_idx').on(table.language),
])

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  index: integer('index').notNull(),
  title: text('title'),
})

export const tokens = sqliteTable('tokens', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  index: integer('index').notNull(),
  type: text('type').notNull(),                 // 'word' | 'punctuation' | 'whitespace'
  text: text('text').notNull(),
  wordKey: text('word_key'),                    // null for non-word tokens
}, (table) => [
  index('tokens_section_idx').on(table.sectionId, table.index),
])

export const vocabulary = sqliteTable('vocabulary', {
  wordKey: text('word_key').notNull(),
  language: text('language').notNull().references(() => languages.code),
  status: integer('status').notNull().default(0), // 0=Unknown..4=Mastered, 5=Known
  translation: text('translation'),
  notes: text('notes'),
  updatedAt: integer('updated_at').notNull(),   // Unix timestamp (seconds)
}, (table) => [
  primaryKey({ columns: [table.wordKey, table.language] }),
  index('vocabulary_language_idx').on(table.language),
])

export const readingProgress = sqliteTable('reading_progress', {
  bookId: text('book_id').primaryKey().references(() => books.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  tokenIndex: integer('token_index').notNull(),  // ordinal position within the section
  updatedAt: integer('updated_at').notNull(),    // Unix timestamp (seconds)
})
```

**Critical rules:**
- Use `integer` for all timestamps (Unix seconds) — **never `Date` objects in SQLite**
- `vocabulary` has a composite PK `(word_key, language)` declared via Drizzle's `primaryKey()` — not a single column PK
- `tokens.word_key` is nullable (non-word tokens like punctuation/whitespace have no word key)
- `readingProgress.sectionId` is a FK to `sections.id` (which section) — `tokenIndex` is the ordinal position *within* that section
- `readingProgress.bookId` is already the PK (implicitly indexed in SQLite) — no separate index needed
- `books.language` and `vocabulary.language` are FKs to `languages.code` — never store raw language strings in other tables

### Language Seed Data (`src/shared/db/seed-languages.ts`)

The `languages` table is static and must be populated before any user data is written. Use `INSERT OR IGNORE` for idempotency (safe to run on every startup):

```typescript
import { sql } from 'drizzle-orm'
import { ok, err } from 'neverthrow'
import type { Result } from 'neverthrow'
import { getDb } from './index'

const SEED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
]

export async function seedLanguages(): Promise<Result<void, string>> {
  try {
    const db = getDb()
    for (const lang of SEED_LANGUAGES) {
      await db.run(
        sql`INSERT OR IGNORE INTO languages (code, name) VALUES (${lang.code}, ${lang.name})`
      )
    }
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
```

> This list covers the languages most likely needed for an MVP. It is intentionally small — additional languages can be added via a future migration. Epic 7 (FR39) will use this table to populate the language picker in Settings.

### `drizzle.config.ts` (repo root)

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/shared/db/schema.ts',
  out: './src/shared/db/migrations',
  dialect: 'sqlite',
})
```

### Platform-Aware DB Instance (`src/shared/db/index.ts`)

The db factory must detect the platform at runtime via `Capacitor.isNativePlatform()`.

**Web path — `@sqlite.org/sqlite-wasm` + OPFS:**

```typescript
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import * as schema from './schema'

async function createWebDb(): Promise<SqliteRemoteDatabase<typeof schema>> {
  const sqlite3 = await sqlite3InitModule()

  // OPFS requires COOP/COEP headers — already configured in vite.config.ts
  const oo = sqlite3.oo1
  const DbClass = 'OpfsDb' in oo ? oo.OpfsDb : oo.DB
  const rawDb = new (DbClass as typeof oo.DB)('/lekto.db', 'ct')

  return drizzle(
    async (sql, params, method) => {
      const stmt = rawDb.prepare(sql)
      try {
        if (method === 'run') {
          stmt.bind(params).stepReset()
          return { rows: [] }
        }
        const rows: unknown[][] = []
        stmt.bind(params)
        while (stmt.step()) {
          rows.push(stmt.get([]))
        }
        stmt.reset()
        return { rows }
      } finally {
        stmt.finalize()
      }
    },
    { schema },
  )
}
```

**Android path — `@capacitor-community/sqlite`:**

```typescript
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { drizzle } from 'drizzle-orm/capacitor-sqlite'
import * as schema from './schema'

async function createAndroidDb() {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const connection = await sqlite.createConnection(
    'lekto',
    false,
    'no-encryption',
    1,
    false,
  )
  await connection.open()
  return drizzle(connection, { schema })
}
```

**Exported factory:**

```typescript
import { Capacitor } from '@capacitor/core'

export type DrizzleDb = Awaited<ReturnType<typeof createWebDb>>

let _db: DrizzleDb | null = null

export async function initDb(): Promise<DrizzleDb> {
  if (_db) return _db
  _db = Capacitor.isNativePlatform()
    ? await createAndroidDb() as unknown as DrizzleDb
    : await createWebDb()
  return _db
}

export function getDb(): DrizzleDb {
  if (!_db) throw new Error('DB not initialized — call initDb() first')
  return _db
}
```

> **Note:** If the `drizzle-orm/capacitor-sqlite` API has changed, check the Drizzle docs for the current Capacitor SQLite driver. The above is based on `drizzle-orm` v0.36+. The `SQLiteConnection` API may differ in newer releases.

### Migration Runner (`src/shared/db/migrate.ts`)

**Why not `drizzle-orm/sqlite-proxy/migrator`?**

`migrate()` from `drizzle-orm/sqlite-proxy/migrator` cannot be used here for two reasons:

1. Its `MigrationConfig` only accepts `migrationsFolder: string` — it calls `readMigrationFiles()` internally which reads from the Node.js filesystem. This is unavailable in the browser/WASM context.
2. Its actual signature is `migrate(db, callback, config)` — the callback receives raw SQL strings to execute, and the config still expects a folder path.

**Actual implementation: custom migration runner**

Instead, migration tracking is reimplemented manually using Vite's `import.meta.glob` to bundle the SQL files and the drizzle journal at build time. The runner replicates what drizzle does internally:

- Creates a `__drizzle_migrations` tracking table via `db.run()`
- Reads the last applied migration timestamp via `db.values()`
- Applies pending statements via `db.run(sql.raw(query))` — no separate raw executor needed

The drizzle journal (`migrations/meta/_journal.json`) drives the ordering and breakpoint parsing, matching drizzle-kit's output format exactly.

```typescript
import { sql } from 'drizzle-orm'
import { ok, err } from 'neverthrow'
import type { Result } from 'neverthrow'
import { getDb } from './index'

const MIGRATIONS_TABLE = '__drizzle_migrations'

const migrationFiles = import.meta.glob('./migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const journalFiles = import.meta.glob('./migrations/meta/_journal.json', {
  import: 'default',
  eager: true,
}) as Record<string, Journal>

type Journal = { entries: JournalEntry[] }
type JournalEntry = { when: number; tag: string; breakpoints: boolean }
type Migration = { statements: string[]; createdAt: number; tag: string }

function parseSqlStatements(rawSql: string, breakpoints: boolean): string[] {
  if (!breakpoints) return [rawSql.trim()].filter(Boolean)
  return rawSql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean)
}

function entryToMigration(entry: JournalEntry): Migration {
  const fileKey = Object.keys(migrationFiles).find((k) => k.includes(entry.tag))
  const rawSql = fileKey ? (migrationFiles[fileKey] ?? '') : ''
  return {
    statements: parseSqlStatements(rawSql, entry.breakpoints),
    createdAt: entry.when,
    tag: entry.tag,
  }
}

function loadMigrations(): Migration[] {
  const journal = Object.values(journalFiles)[0]
  return journal ? journal.entries.map(entryToMigration) : []
}

async function createMigrationsTable(): Promise<void> {
  await getDb().run(sql`
    CREATE TABLE IF NOT EXISTS \`${sql.raw(MIGRATIONS_TABLE)}\` (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `)
}

async function fetchLastAppliedAt(): Promise<number | undefined> {
  const rows = await getDb().values<[number, string, number]>(
    sql`SELECT id, hash, created_at FROM \`${sql.raw(MIGRATIONS_TABLE)}\` ORDER BY created_at DESC LIMIT 1`,
  )
  return rows[0]?.[2]
}

function recordMigrationQuery(tag: string, createdAt: number): string {
  return `INSERT INTO \`${MIGRATIONS_TABLE}\` ("hash", "created_at") VALUES('${tag}', '${createdAt}')`
}

function collectPendingQueries(migrations: Migration[], lastAppliedAt: number | undefined): string[] {
  return migrations
    .filter((m) => lastAppliedAt === undefined || lastAppliedAt < m.createdAt)
    .flatMap((m) => [...m.statements, recordMigrationQuery(m.tag, m.createdAt)])
}

export async function runMigrations(): Promise<Result<void, string>> {
  try {
    await createMigrationsTable()
    const lastAppliedAt = await fetchLastAppliedAt()
    const pendingQueries = collectPendingQueries(loadMigrations(), lastAppliedAt)
    for (const query of pendingQueries) {
      await getDb().run(sql.raw(query))
    }
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
```

### `src/main.tsx` — Startup Sequence

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDb } from '@/shared/db'
import { runMigrations } from '@/shared/db/migrate'
import { seedLanguages } from '@/shared/db/seed-languages'

async function start() {
  await initDb()

  const migrations = await runMigrations()
  if (migrations.isErr()) {
    document.getElementById('root')!.innerHTML =
      `<p style="color:red;padding:1rem">Database migration failed: ${migrations.error}</p>`
    return
  }

  const seed = await seedLanguages()
  if (seed.isErr()) {
    document.getElementById('root')!.innerHTML =
      `<p style="color:red;padding:1rem">Database seed failed: ${seed.error}</p>`
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
```

### File Structure After This Story

```
src/shared/db/
├── index.ts            ← platform-aware db factory (initDb, getDb, DrizzleDb type)
├── schema.ts           ← 6 Drizzle tables + indexes
├── migrate.ts          ← runMigrations() using Result<void, string>
├── seed-languages.ts   ← seedLanguages() — idempotent INSERT OR IGNORE
└── migrations/
    └── 0000_*.sql      ← generated by drizzle-kit (committed to repo)

drizzle.config.ts       ← repo root
```

### Testing Strategy

Tests run in **Vitest with jsdom** (as configured in story 1.1). The db modules cannot be tested end-to-end in jsdom (no real SQLite WASM). Use mocks/stubs:

**`schema.test.ts`** — verify schema structure (pure Drizzle, no DB connection needed):
```typescript
import { describe, it, expect } from 'vitest'
import { languages, books, sections, tokens, vocabulary, readingProgress } from './schema'

describe('Drizzle schema', () => {
  it('exports all 6 tables', () => {
    expect(languages).toBeDefined()
    expect(books).toBeDefined()
    expect(sections).toBeDefined()
    expect(tokens).toBeDefined()
    expect(vocabulary).toBeDefined()
    expect(readingProgress).toBeDefined()
  })
  it('vocabulary has wordKey and language columns', () => {
    expect(Object.keys(vocabulary)).toContain('wordKey')
    expect(Object.keys(vocabulary)).toContain('language')
  })
  it('readingProgress has sectionId FK (not sectionIndex)', () => {
    expect(Object.keys(readingProgress)).toContain('sectionId')
    expect(Object.keys(readingProgress)).not.toContain('sectionIndex')
  })
  it('books has language FK column', () => {
    expect(Object.keys(books)).toContain('language')
  })
})
```

**`migrate.test.ts`** — mock `getDb` and `migrate`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok } from 'neverthrow'

vi.mock('./index', () => ({ getDb: vi.fn() }))
vi.mock('drizzle-orm/sqlite-proxy/migrator', () => ({ migrate: vi.fn().mockResolvedValue(undefined) }))

describe('runMigrations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ok() on success', async () => {
    const { runMigrations } = await import('./migrate')
    const result = await runMigrations()
    expect(result).toEqual(ok(undefined))
  })

  it('returns err() on migration failure', async () => {
    const { migrate } = await import('drizzle-orm/sqlite-proxy/migrator')
    vi.mocked(migrate).mockRejectedValueOnce(new Error('migration failed'))
    const { runMigrations } = await import('./migrate')
    const result = await runMigrations()
    expect(result.isErr()).toBe(true)
  })
})
```

### Previous Story Learnings (1.1 → 1.2)

- **Vite 7 installed** (not Vite 6): All Vite plugin peer dep constraints must match `vite@^7`. If `@sqlite.org/sqlite-wasm` ships a Vite plugin, verify it supports Vite 7.
- **Capacitor 8 installed** (not Capacitor 6): `@capacitor-community/sqlite` must be compatible with Capacitor 8. Check its peerDependencies.
- **COOP/COEP headers are already in `vite.config.ts`** — these are required for `@sqlite.org/sqlite-wasm` OPFS and are already set. Do NOT add them again.
- **shadcn components are in `src/components/ui/`** (not `src/shared/ui/`) — this is intentional per story 1.1 completion notes.
- **`src/shared/db/index.ts` exists** with just `export {}` — replace its entire contents in Task 4.
- **ESLint is configured with `--max-warnings 0`** — any lint warning fails CI. Keep code clean.
- **TypeScript strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`** — be precise with optional types; `undefined` checks are required for array access.
- **`buttonVariants` was split** into a separate file to avoid React Fast Refresh lint errors — follow the same pattern if exporting both components and non-component values from the same file.
- **Test files are co-located** with source (no `__tests__/` directories).

### Vault Path Scope Note

Story 1.2 creates the database in the **default storage location** for each platform:
- Web: OPFS root (`/lekto.db`)
- Android: App private storage (managed by `@capacitor-community/sqlite`)

The full vault relocation feature (user picks a folder, cloud sync, etc.) is **Epic 2 (FR30–34)**. Do NOT implement vault path selection here. The path `/lekto.db` is the placeholder; Epic 2 will make this configurable.

### What NOT to Build in This Story

- Vault setup screen, VaultSetupScreen component → Epic 2
- Zustand store hydration from SQLite → Epic 2+
- Platform adapters beyond the DB driver → Story 1.4
- Platform filesystem adapter → Story 1.4
- CI/CD pipelines → Story 1.5
- AGENTS.md → Story 1.3
- Any UI screens or features → Epic 2+

### References

- Schema tables and data model: [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Model section]
- SQLite driver selection: [Source: `_bmad-output/planning-artifacts/architecture.md` — GAP-01 resolution]
- DB indexes: [Source: `_bmad-output/planning-artifacts/architecture.md` — GAP-03 resolution]
- State management pattern (SQLite → Zustand): [Source: `_bmad-output/planning-artifacts/architecture.md` — State Management section]
- Date/time storage as Unix integer: [Source: `_bmad-output/planning-artifacts/architecture.md` — Naming Patterns section]
- Story acceptance criteria: [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.2]
- COOP/COEP headers (already set): [Source: story 1.1 Dev Notes — vite.config.ts]
- Error handling (neverthrow Result<T>): [Source: `_bmad-output/planning-artifacts/architecture.md` — Error Handling section]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `drizzle-orm/capacitor-sqlite` does not exist in drizzle-orm v0.45.1. Android path implemented using `drizzle-orm/sqlite-proxy` with `@capacitor-community/sqlite` `SQLiteConnection` wrapped via proxy callback pattern.

### Completion Notes List

- Installed drizzle-orm@0.45.1, @sqlite.org/sqlite-wasm@3.51.2-build7, @capacitor-community/sqlite@8.0.1, drizzle-kit@0.31.9
- Schema defines all 6 tables with correct FKs, indexes, composite PK on vocabulary, and snake_case columns (Drizzle infers camelCase TS types)
- `drizzle-kit generate` produced `src/shared/db/migrations/0000_handy_christian_walker.sql` with all 6 tables
- Both web (sqlite-wasm + OPFS) and Android (capacitor-sqlite via proxy) paths implemented in `initDb()`
- Migration runner uses `import.meta.glob` to bundle SQL at build time; returns `Result<void, string>` via neverthrow
- `main.tsx` exports `start()` (enables unit testing); calls `initDb()` → `runMigrations()` → `seedLanguages()` before React render; errors rendered inline without crashing
- 16 tests pass across 5 test files; zero typecheck errors; zero lint warnings

### File List

- `package.json` (modified — added drizzle-orm, @sqlite.org/sqlite-wasm, @capacitor-community/sqlite, drizzle-kit; added db:generate script)
- `drizzle.config.ts` (new)
- `src/shared/db/schema.ts` (new)
- `src/shared/db/schema.test.ts` (new)
- `src/shared/db/index.ts` (modified — replaced stub with platform-aware factory + barrel re-exports)
- `src/shared/db/index.test.ts` (new)
- `src/shared/db/migrate.ts` (new)
- `src/shared/db/migrate.test.ts` (new)
- `src/shared/db/seed-languages.ts` (new)
- `src/shared/db/migrations/0000_handy_christian_walker.sql` (new — generated by drizzle-kit)
- `src/main.tsx` (modified — async start() with initDb/runMigrations/seedLanguages)
- `src/main.test.tsx` (new)

### Change Log

- 2026-03-15: Story created by create-story workflow
- 2026-03-15: Schema revised — added `languages` lookup table with ISO 639-1 seed data; `books.language` and `vocabulary.language` now FK to `languages.code`; added `books_language_idx` and `vocabulary_language_idx` indexes; `readingProgress` changed from `sectionIndex` (positional int) to `sectionId` (FK → `sections.id`) for referential integrity
- 2026-03-15: Story implemented — full database infrastructure in place; all 7 tasks complete; 16 tests passing
