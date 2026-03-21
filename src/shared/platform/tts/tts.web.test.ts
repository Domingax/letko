import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TtsAdapter } from './tts.interface'

describe('TtsAdapter (web)', () => {
  let adapter: TtsAdapter

  beforeEach(async () => {
    vi.resetModules()
    const mockUtterance = vi.fn()
    vi.stubGlobal('SpeechSynthesisUtterance', mockUtterance)
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    })
    const { createWebTtsAdapter } = await import('./tts.web')
    adapter = createWebTtsAdapter()
  })

  it('isAvailable returns true when speechSynthesis exists', async () => {
    const result = await adapter.isAvailable()
    expect(result).toBe(true)
  })

  it('isAvailable returns false when speechSynthesis is absent', async () => {
    vi.resetModules()
    vi.stubGlobal('speechSynthesis', undefined)
    const { createWebTtsAdapter } = await import('./tts.web')
    const noSpeechAdapter = createWebTtsAdapter()
    const result = await noSpeechAdapter.isAvailable()
    expect(result).toBe(false)
  })

  it('speak returns ok when speechSynthesis is available', async () => {
    const result = await adapter.speak('hello', 'en')
    expect(result.isOk()).toBe(true)
  })

  it('speak returns err when speechSynthesis is absent', async () => {
    vi.resetModules()
    vi.stubGlobal('speechSynthesis', undefined)
    const { createWebTtsAdapter } = await import('./tts.web')
    const noSpeechAdapter = createWebTtsAdapter()
    const result = await noSpeechAdapter.speak('hello', 'en')
    expect(result.isErr()).toBe(true)
  })

  it('stop returns ok and calls cancel', async () => {
    const result = await adapter.stop()
    expect(result.isOk()).toBe(true)
    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
  })

  it('stop returns err when speechSynthesis is absent', async () => {
    vi.resetModules()
    vi.stubGlobal('speechSynthesis', undefined)
    const { createWebTtsAdapter } = await import('./tts.web')
    const noSpeechAdapter = createWebTtsAdapter()
    const result = await noSpeechAdapter.stop()
    expect(result.isErr()).toBe(true)
  })
})
