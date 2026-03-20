import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { ok, err } from 'neverthrow'
import type { SecureStorageAdapter } from './secure-storage.interface'
import type { AsyncResult } from '../../lib/types'

const GENERIC_ERROR = 'Secure storage operation failed'

export function createAndroidSecureStorageAdapter(): SecureStorageAdapter {
  return {
    async get(key: string): AsyncResult<string> {
      try {
        const value = await SecureStorage.get(key)
        if (value === null) return err(GENERIC_ERROR)
        return ok(String(value))
      } catch {
        return err(GENERIC_ERROR)
      }
    },

    async set(key: string, value: string): AsyncResult<void> {
      try {
        await SecureStorage.set(key, value)
        return ok(undefined)
      } catch {
        return err(GENERIC_ERROR)
      }
    },

    async remove(key: string): AsyncResult<void> {
      try {
        await SecureStorage.remove(key)
        return ok(undefined)
      } catch {
        return err(GENERIC_ERROR)
      }
    },
  }
}
