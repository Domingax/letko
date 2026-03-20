import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn(),
  },
}))

describe('InAppBrowserAdapter (android)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('open returns ok when Browser.open succeeds', async () => {
    const { Browser } = await import('@capacitor/browser')
    vi.mocked(Browser.open).mockResolvedValue(undefined)
    const { createAndroidInAppBrowserAdapter } = await import('./in-app-browser.android')
    const adapter = createAndroidInAppBrowserAdapter()
    const result = await adapter.open('https://example.com')
    expect(result.isOk()).toBe(true)
    expect(Browser.open).toHaveBeenCalledWith({ url: 'https://example.com' })
  })

  it('open returns err when Browser.open throws', async () => {
    const { Browser } = await import('@capacitor/browser')
    vi.mocked(Browser.open).mockRejectedValue(new Error('plugin error'))
    const { createAndroidInAppBrowserAdapter } = await import('./in-app-browser.android')
    const adapter = createAndroidInAppBrowserAdapter()
    const result = await adapter.open('https://example.com')
    expect(result.isErr()).toBe(true)
  })
})
