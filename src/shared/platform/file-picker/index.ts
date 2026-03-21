import { Capacitor } from '@capacitor/core'
import { createWebFilePickerAdapter } from './file-picker.web'
import { createAndroidFilePickerAdapter } from './file-picker.android'
import type { FilePickerAdapter, PickedFile } from './file-picker.interface'

export type { FilePickerAdapter, PickedFile }

export const filePickerAdapter: FilePickerAdapter = Capacitor.isNativePlatform()
  ? createAndroidFilePickerAdapter()
  : createWebFilePickerAdapter()
