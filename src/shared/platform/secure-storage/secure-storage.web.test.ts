import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SecureStorageAdapter } from './secure-storage.interface'

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('SecureStorageAdapter (web)', () => {
  let adapter: SecureStorageAdapter

  beforeEach(async () => {
    vi.resetAllMocks()
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage')
    vi.mocked(SecureStorage.get).mockResolvedValue('stored-value')
    vi.mocked(SecureStorage.set).mockResolvedValue(undefined)
    vi.mocked(SecureStorage.remove).mockResolvedValue(undefined)

    const { createWebSecureStorageAdapter } = await import('./secure-storage.web')
    adapter = createWebSecureStorageAdapter()
  })

  it('get returns ok with stored value', async () => {
    const result = await adapter.get('my-key')
    expect(result.isOk()).toBe(true)
    if (result.isOk()) expect(result.value).toBe('stored-value')
  })

  it('get returns err without leaking key in error message', async () => {
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage')
    vi.mocked(SecureStorage.get).mockRejectedValue(new Error('not found'))
    const result = await adapter.get('secret-key')
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).not.toContain('secret-key')
      expect(result.error).toBe('Secure storage operation failed')
    }
  })

  it('set returns ok on success', async () => {
    const result = await adapter.set('my-key', 'my-value')
    expect(result.isOk()).toBe(true)
  })

  it('set returns err without leaking value in error message', async () => {
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage')
    vi.mocked(SecureStorage.set).mockRejectedValue(new Error('quota exceeded'))
    const result = await adapter.set('key', 'super-secret-value')
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).not.toContain('super-secret-value')
      expect(result.error).toBe('Secure storage operation failed')
    }
  })

  it('remove returns ok on success', async () => {
    const result = await adapter.remove('my-key')
    expect(result.isOk()).toBe(true)
  })

  it('remove returns err without leaking key in error message', async () => {
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage')
    vi.mocked(SecureStorage.remove).mockRejectedValue(new Error('not found'))
    const result = await adapter.remove('secret-key')
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).not.toContain('secret-key')
      expect(result.error).toBe('Secure storage operation failed')
    }
  })
})
