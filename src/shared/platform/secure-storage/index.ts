import { Capacitor } from '@capacitor/core'
import { createWebSecureStorageAdapter } from './secure-storage.web'
import { createAndroidSecureStorageAdapter } from './secure-storage.android'
import type { SecureStorageAdapter } from './secure-storage.interface'

export type { SecureStorageAdapter }

export const secureStorageAdapter: SecureStorageAdapter = Capacitor.isNativePlatform()
  ? createAndroidSecureStorageAdapter()
  : createWebSecureStorageAdapter()
