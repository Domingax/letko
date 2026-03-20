import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TtsAdapter } from './tts.interface'

vi.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: {
    speak: vi.fn(),
    stop: vi.fn(),
    getSupportedLanguages: vi.fn(),
  },
}))

describe('TtsAdapter (android)', () => {
  let adapter: TtsAdapter

  beforeEach(async () => {
    vi.resetAllMocks()
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
    vi.mocked(TextToSpeech.speak).mockResolvedValue(undefined)
    vi.mocked(TextToSpeech.stop).mockResolvedValue(undefined)
    vi.mocked(TextToSpeech.getSupportedLanguages).mockResolvedValue({ languages: ['en', 'fr'] })

    const { createAndroidTtsAdapter } = await import('./tts.android')
    adapter = createAndroidTtsAdapter()
  })

  it('isAvailable returns true when plugin responds', async () => {
    const result = await adapter.isAvailable()
    expect(result).toBe(true)
  })

  it('isAvailable returns false when plugin throws', async () => {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
    vi.mocked(TextToSpeech.getSupportedLanguages).mockRejectedValue(new Error('unavailable'))
    const result = await adapter.isAvailable()
    expect(result).toBe(false)
  })

  it('speak returns ok on success', async () => {
    const result = await adapter.speak('bonjour', 'fr')
    expect(result.isOk()).toBe(true)
  })

  it('speak returns err when plugin throws', async () => {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
    vi.mocked(TextToSpeech.speak).mockRejectedValue(new Error('tts error'))
    const result = await adapter.speak('hello', 'en')
    expect(result.isErr()).toBe(true)
  })

  it('stop returns ok on success', async () => {
    const result = await adapter.stop()
    expect(result.isOk()).toBe(true)
  })

  it('stop returns err when plugin throws', async () => {
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
    vi.mocked(TextToSpeech.stop).mockRejectedValue(new Error('stop error'))
    const result = await adapter.stop()
    expect(result.isErr()).toBe(true)
  })
})
