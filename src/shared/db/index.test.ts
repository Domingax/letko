import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset module state between tests (the _db singleton must be fresh)
beforeEach(() => {
  vi.resetModules()
})

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn().mockReturnValue(false) },
}))

vi.mock('drizzle-orm/sqlite-proxy', () => ({
  drizzle: vi.fn().mockReturnValue({ _tag: 'mock-drizzle-db' }),
}))

vi.mock('@sqlite.org/sqlite-wasm', () => ({
  default: vi.fn().mockResolvedValue({
    oo1: {
      DB: class MockDB {
        prepare() {
          return {
            bind: () => ({ stepReset: () => {} }),
            step: () => false,
            get: () => [],
            reset: () => {},
            finalize: () => {},
          }
        }
      },
    },
  }),
}))

vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {},
  SQLiteConnection: vi.fn().mockImplementation(() => ({
    createConnection: vi.fn().mockResolvedValue({
      open: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue({}),
      query: vi.fn().mockResolvedValue({ values: [] }),
    }),
  })),
}))

describe('initDb', () => {
  it('returns ok with a DrizzleDb instance on first call (web path)', async () => {
    const { initDb } = await import('./index')
    const result = await initDb()
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBeDefined()
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    const { initDb } = await import('./index')
    const r1 = await initDb()
    const r2 = await initDb()
    expect(r1._unsafeUnwrap()).toBe(r2._unsafeUnwrap())
  })
})

describe('getDb', () => {
  it('throws if called before initDb', async () => {
    const { getDb } = await import('./index')
    expect(() => getDb()).toThrow('DB not initialized')
  })

  it('returns the db instance after initDb', async () => {
    const { initDb, getDb } = await import('./index')
    await initDb()
    const db = getDb()
    expect(db).toBeDefined()
  })
})
