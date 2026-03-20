import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { ok, err } from 'neverthrow'
import type { TtsAdapter } from './tts.interface'
import type { AsyncResult } from '../../lib/types'

export function createAndroidTtsAdapter(): TtsAdapter {
  return {
    async isAvailable(): Promise<boolean> {
      try {
        await TextToSpeech.getSupportedLanguages()
        return true
      } catch {
        return false
      }
    },

    async speak(text: string, language: string): AsyncResult<void> {
      try {
        await TextToSpeech.speak({ text, lang: language, rate: 1.0, pitch: 1.0, volume: 1.0, category: 'ambient' })
        return ok(undefined)
      } catch {
        return err('TTS speak failed')
      }
    },

    async stop(): AsyncResult<void> {
      try {
        await TextToSpeech.stop()
        return ok(undefined)
      } catch {
        return err('TTS stop failed')
      }
    },
  }
}
