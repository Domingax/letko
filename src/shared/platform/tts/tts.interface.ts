import type { AsyncResult } from '../../lib/types'

export interface TtsAdapter {
  speak(text: string, language: string): AsyncResult<void>
  stop(): AsyncResult<void>
  isAvailable(): Promise<boolean>
}
