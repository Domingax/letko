import { Capacitor } from '@capacitor/core'
import { createWebInAppBrowserAdapter } from './in-app-browser.web'
import { createAndroidInAppBrowserAdapter } from './in-app-browser.android'
import type { InAppBrowserAdapter } from './in-app-browser.interface'

export type { InAppBrowserAdapter }

export const inAppBrowserAdapter: InAppBrowserAdapter = Capacitor.isNativePlatform()
  ? createAndroidInAppBrowserAdapter()
  : createWebInAppBrowserAdapter()
