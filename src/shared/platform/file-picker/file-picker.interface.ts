import type { AsyncResult } from '../../lib/types'

export interface PickedFile {
  name: string
  data: ArrayBuffer
}

export interface FilePickerAdapter {
  pickFile(options: { accept?: string[] }): AsyncResult<PickedFile>
  pickDirectory(): AsyncResult<string>
}
