import type { AsyncResult } from '../../lib/types'

export interface InAppBrowserAdapter {
  open(url: string): AsyncResult<void>
}
