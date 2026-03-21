import { Browser } from '@capacitor/browser'
import { ok, err } from 'neverthrow'
import type { InAppBrowserAdapter } from './in-app-browser.interface'
import type { AsyncResult } from '../../lib/types'

export function createAndroidInAppBrowserAdapter(): InAppBrowserAdapter {
  return {
    async open(url: string): AsyncResult<void> {
      try {
        await Browser.open({ url })
        return ok(undefined)
      } catch {
        return err('Failed to open URL')
      }
    },
  }
}
