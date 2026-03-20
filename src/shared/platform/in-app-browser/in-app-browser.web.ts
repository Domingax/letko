import { ok, err } from 'neverthrow'
import type { InAppBrowserAdapter } from './in-app-browser.interface'
import type { AsyncResult } from '../../lib/types'

export function createWebInAppBrowserAdapter(): InAppBrowserAdapter {
  return {
    async open(url: string): AsyncResult<void> {
      try {
        const win = window.open(url, '_blank')
        if (win === null) return err('Popup blocked — open manually')
        return ok(undefined)
      } catch {
        return err('Failed to open URL')
      }
    },
  }
}
