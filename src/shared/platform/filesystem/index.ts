import { Capacitor } from '@capacitor/core'
import { createWebFilesystemAdapter } from './filesystem.web'
import { createAndroidFilesystemAdapter } from './filesystem.android'
import type { FilesystemAdapter } from './filesystem.interface'

export type { FilesystemAdapter }

export const filesystemAdapter: FilesystemAdapter = Capacitor.isNativePlatform()
  ? createAndroidFilesystemAdapter()
  : createWebFilesystemAdapter()
