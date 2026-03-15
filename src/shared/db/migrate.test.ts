import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok } from 'neverthrow'

const mockRun = vi.fn().mockResolvedValue(undefined)
const mockValues = vi.fn().mockResolvedValue([])

vi.mock('./index', () => ({
  getDb: vi.fn(() => ({ run: mockRun, values: mockValues })),
}))

describe('runMigrations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ok() on success', async () => {
    const { runMigrations } = await import('./migrate')
    const result = await runMigrations()
    expect(result).toEqual(ok(undefined))
  })

it('returns err() on migration failure', async () => {
    mockRun.mockRejectedValueOnce(new Error('migration failed'))
    const { runMigrations } = await import('./migrate')
    const result = await runMigrations()
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toBe('migration failed')
  })

  it('idempotent re-run returns ok() on second call', async () => {
    const { runMigrations } = await import('./migrate')
    const r1 = await runMigrations()
    const r2 = await runMigrations()
    expect(r1).toEqual(ok(undefined))
    expect(r2).toEqual(ok(undefined))
  })
})
