import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FilePickerAdapter } from './file-picker.interface'

describe('FilePickerAdapter (web)', () => {
  let adapter: FilePickerAdapter

  beforeEach(async () => {
    vi.resetModules()

    const mockFileData = new ArrayBuffer(8)
    const mockFile = {
      name: 'book.epub',
      arrayBuffer: vi.fn().mockResolvedValue(mockFileData),
    }
    const mockFileHandle = {
      getFile: vi.fn().mockResolvedValue(mockFile),
    }

    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([mockFileHandle]))
    vi.stubGlobal('showDirectoryPicker', vi.fn().mockResolvedValue({ name: 'my-vault' }))

    const { createWebFilePickerAdapter } = await import('./file-picker.web')
    adapter = createWebFilePickerAdapter()
  })

  it('pickFile returns ok with file name and data', async () => {
    const result = await adapter.pickFile({ accept: ['.epub'] })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.name).toBe('book.epub')
      expect(result.value.data).toBeInstanceOf(ArrayBuffer)
    }
  })

  it('pickFile returns err when user cancels (AbortError)', async () => {
    const abortError = new DOMException('The user aborted', 'AbortError')
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockRejectedValue(abortError))
    const { createWebFilePickerAdapter } = await import('./file-picker.web')
    const cancelAdapter = createWebFilePickerAdapter()
    const result = await cancelAdapter.pickFile({})
    expect(result.isErr()).toBe(true)
  })

  it('pickDirectory returns ok with directory name', async () => {
    const result = await adapter.pickDirectory()
    expect(result.isOk()).toBe(true)
    if (result.isOk()) expect(result.value).toBe('my-vault')
  })

  it('pickDirectory returns err when user cancels', async () => {
    const abortError = new DOMException('The user aborted', 'AbortError')
    vi.stubGlobal('showDirectoryPicker', vi.fn().mockRejectedValue(abortError))
    const { createWebFilePickerAdapter } = await import('./file-picker.web')
    const cancelAdapter = createWebFilePickerAdapter()
    const result = await cancelAdapter.pickDirectory()
    expect(result.isErr()).toBe(true)
  })

  it('pickFile falls back to input[type=file] when showOpenFilePicker is absent', async () => {
    vi.resetModules()
    vi.stubGlobal('showOpenFilePicker', undefined)

    const mockBuffer = new ArrayBuffer(4)
    const mockFileObj = { name: 'fallback.epub', arrayBuffer: vi.fn().mockResolvedValue(mockBuffer) }

    // Simulate a file input that resolves immediately with a file
    const mockInput = {
      accept: '',
      style: { display: '' },
      click: vi.fn().mockImplementation(function (this: typeof mockInput) {
        // Trigger onchange asynchronously
        setTimeout(() => {
          if (this.onchange) (this as { onchange?: (e: Event) => void }).onchange?.({} as Event)
        }, 0)
      }),
      onchange: null as ((e: Event) => void) | null,
      files: [mockFileObj],
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockInput as unknown as HTMLElement)

    const { createWebFilePickerAdapter } = await import('./file-picker.web')
    const fallbackAdapter = createWebFilePickerAdapter()
    const result = await fallbackAdapter.pickFile({ accept: ['.epub'] })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) expect(result.value.name).toBe('fallback.epub')
  })
})
