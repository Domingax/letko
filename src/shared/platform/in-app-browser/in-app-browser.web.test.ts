import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('InAppBrowserAdapter (web)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('open', vi.fn().mockReturnValue({}))
  })

  it('open returns ok when window.open succeeds', async () => {
    const { createWebInAppBrowserAdapter } = await import('./in-app-browser.web')
    const adapter = createWebInAppBrowserAdapter()
    const result = await adapter.open('https://example.com')
    expect(result.isOk()).toBe(true)
    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank')
  })

  it('open returns err when popup is blocked (window.open returns null)', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null))
    const { createWebInAppBrowserAdapter } = await import('./in-app-browser.web')
    const adapter = createWebInAppBrowserAdapter()
    const result = await adapter.open('https://example.com')
    expect(result.isErr()).toBe(true)
    if (result.isErr()) expect(result.error).toContain('Popup blocked')
  })

  it('open returns err when window.open throws', async () => {
    vi.stubGlobal('open', vi.fn().mockImplementation(() => { throw new Error('blocked') }))
    const { createWebInAppBrowserAdapter } = await import('./in-app-browser.web')
    const adapter = createWebInAppBrowserAdapter()
    const result = await adapter.open('https://example.com')
    expect(result.isErr()).toBe(true)
  })
})
