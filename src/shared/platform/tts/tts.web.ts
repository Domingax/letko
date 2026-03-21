import { ok, err } from 'neverthrow'
import type { TtsAdapter } from './tts.interface'
import type { AsyncResult } from '../../lib/types'

export function createWebTtsAdapter(): TtsAdapter {
  return {
    async isAvailable(): Promise<boolean> {
      return typeof window !== 'undefined' && !!window.speechSynthesis
    },

    async speak(text: string, language: string): AsyncResult<void> {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return err('TTS not available')
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = language
        window.speechSynthesis.speak(utterance)
        return ok(undefined)
      } catch {
        return err('TTS speak failed')
      }
    },

    async stop(): AsyncResult<void> {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return err('TTS not available')
      }
      try {
        window.speechSynthesis.cancel()
        return ok(undefined)
      } catch {
        return err('TTS stop failed')
      }
    },
  }
}
