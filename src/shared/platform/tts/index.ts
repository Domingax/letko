import { Capacitor } from '@capacitor/core'
import { createWebTtsAdapter } from './tts.web'
import { createAndroidTtsAdapter } from './tts.android'
import type { TtsAdapter } from './tts.interface'

export type { TtsAdapter }

export const ttsAdapter: TtsAdapter = Capacitor.isNativePlatform()
  ? createAndroidTtsAdapter()
  : createWebTtsAdapter()
