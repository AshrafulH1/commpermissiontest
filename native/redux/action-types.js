// @flow

import type { Orientations } from 'react-native-orientation-locker';

import { saveMessagesActionType } from 'lib/actions/message-actions';
import type { Shape } from 'lib/types/core';
import type { BaseAction } from 'lib/types/redux-types';

import type { AndroidNotificationActions } from '../push/reducer';
import type { DeviceCameraInfo } from '../types/camera';
import type { ConnectivityInfo } from '../types/connectivity';
import type { GlobalThemeInfo } from '../types/themes';
import type { DimensionsInfo } from './dimensions-updater.react';
import type { AppState } from './state-types';

export const resetUserStateActionType = 'RESET_USER_STATE';
export const recordNotifPermissionAlertActionType =
  'RECORD_NOTIF_PERMISSION_ALERT';
export const recordAndroidNotificationActionType =
  'RECORD_ANDROID_NOTIFICATION';
export const clearAndroidNotificationsActionType =
  'CLEAR_ANDROID_NOTIFICATIONS';
export const rescindAndroidNotificationActionType =
  'RESCIND_ANDROID_NOTIFICATION';
export const updateDimensionsActiveType = 'UPDATE_DIMENSIONS';
export const updateConnectivityActiveType = 'UPDATE_CONNECTIVITY';
export const updateThemeInfoActionType = 'UPDATE_THEME_INFO';
export const updateDeviceCameraInfoActionType = 'UPDATE_DEVICE_CAMERA_INFO';
export const updateDeviceOrientationActionType = 'UPDATE_DEVICE_ORIENTATION';
export const updateThreadLastNavigatedActionType =
  'UPDATE_THREAD_LAST_NAVIGATED';
export const setStoreLoadedActionType = 'SET_STORE_LOADED';
export const setReduxStateActionType = 'SET_REDUX_STATE';

export const backgroundActionTypes: Set<string> = new Set([
  saveMessagesActionType,
  recordAndroidNotificationActionType,
  rescindAndroidNotificationActionType,
]);

export type Action =
  | BaseAction
  | AndroidNotificationActions
  | {
      +type: 'SET_REDUX_STATE',
      +payload: { +state: AppState, +hideFromMonitor: boolean },
    }
  | {
      +type: 'SET_CUSTOM_SERVER',
      +payload: string,
    }
  | {
      +type: 'RECORD_NOTIF_PERMISSION_ALERT',
      +payload: { +time: number },
    }
  | { +type: 'RESET_USER_STATE' }
  | {
      +type: 'UPDATE_DIMENSIONS',
      +payload: Shape<DimensionsInfo>,
    }
  | {
      +type: 'UPDATE_CONNECTIVITY',
      +payload: ConnectivityInfo,
    }
  | {
      +type: 'UPDATE_THEME_INFO',
      +payload: Shape<GlobalThemeInfo>,
    }
  | {
      +type: 'UPDATE_DEVICE_CAMERA_INFO',
      +payload: Shape<DeviceCameraInfo>,
    }
  | {
      +type: 'UPDATE_DEVICE_ORIENTATION',
      +payload: Orientations,
    }
  | {
      +type: 'UPDATE_THREAD_LAST_NAVIGATED',
      +payload: { +threadID: string, +time: number },
    }
  | {
      +type: 'SET_STORE_LOADED',
    };
