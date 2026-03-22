import { ok, err } from 'neverthrow'
import type { FilePickerAdapter, PickedFile } from './file-picker.interface'
import type { AsyncResult } from '../../lib/types'

function pickFileViaInput(accept: string[]): Promise<PickedFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input') as HTMLInputElement
    input.type = 'file'
    input.style.display = 'none'
    if (accept.length > 0) input.accept = accept.join(',')
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const data = await file.arrayBuffer()
      resolve({ name: file.name, data })
    }
    input.click()
  })
}

export function createWebFilePickerAdapter(): FilePickerAdapter {
  return {
    async pickFile(options: { accept?: string[] }): AsyncResult<PickedFile> {
      const accept = options.accept ?? []
      try {
        if (typeof showOpenFilePicker === 'function') {
          const [handle] = await showOpenFilePicker({
            multiple: false,
            types:
              accept.length > 0
                ? [{ description: 'Files', accept: { 'application/octet-stream': accept as `.${string}`[] } }]
                : undefined,
          })
          const file = await handle.getFile()
          const data = await file.arrayBuffer()
          return ok({ name: file.name, data })
        }
        // Fallback: <input type="file">
        const picked = await pickFileViaInput(accept)
        return ok(picked)
      } catch {
        return err('File pick cancelled or failed')
      }
    },

    async pickDirectory(): AsyncResult<string> {
      try {
        const handle = await showDirectoryPicker()
        return ok(handle.name)
      } catch {
        return err('Directory pick cancelled or failed')
      }
    },
  }
}
