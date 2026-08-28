import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, PermissionsAndroid, Permission } from 'react-native';

// Safely obtain Notifications module (Expo Go SDK 53+ removed remote notifications on Android)
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (err) {
  console.warn('expo-notifications is not supported in this environment (e.g. Expo Go Android SDK 53+):', err);
}

export type PermissionStatusType = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface AppPermissionsStatus {
  gps: PermissionStatusType;
  nearbyDevices: PermissionStatusType;
  notifications: PermissionStatusType;
  sms: PermissionStatusType;
  phone: PermissionStatusType;
}

export class PermissionManager {
  /**
   * Check if running inside Expo Go client
   */
  static isExpoGo(): boolean {
    return (
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    );
  }

  /**
   * Check all permission statuses
   */
  static async checkAllPermissions(): Promise<AppPermissionsStatus> {
    const [gps, nearbyDevices, notifications, sms, phone] = await Promise.all([
      this.checkGPSPermission(),
      this.checkNearbyDevicesPermission(),
      this.checkNotificationsPermission(),
      this.checkSMSPermission(),
      this.checkPhonePermission(),
    ]);

    return {
      gps,
      nearbyDevices,
      notifications,
      sms,
      phone,
    };
  }

  /**
   * GPS / Location Permissions (Fully supported in Expo Go & Standalone)
   */
  static async checkGPSPermission(): Promise<PermissionStatusType> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status as PermissionStatusType;
    } catch {
      return 'undetermined';
    }
  }

  static async requestGPSPermission(): Promise<PermissionStatusType> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status as PermissionStatusType;
    } catch (e) {
      console.warn('Failed to request GPS permission:', e);
      return 'denied';
    }
  }

  static async getCurrentLocation() {
    const status = await this.checkGPSPermission();
    if (status !== 'granted') {
      const requested = await this.requestGPSPermission();
      if (requested !== 'granted') {
        throw new Error('Location permission not granted');
      }
    }
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }

  /**
   * Nearby Devices (Bluetooth & Nearby Scan) Permissions
   */
  static async checkNearbyDevicesPermission(): Promise<PermissionStatusType> {
    if (Platform.OS === 'android') {
      try {
        if (this.isExpoGo()) {
          // Expo Go uses fine location permission for nearby device scanning
          return await this.checkGPSPermission();
        }

        const apiLevel = Platform.Version;
        if (typeof apiLevel === 'number' && apiLevel >= 31) {
          const scanGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
          );
          const connectGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
          return scanGranted && connectGranted ? 'granted' : 'undetermined';
        } else {
          return await this.checkGPSPermission();
        }
      } catch {
        return 'undetermined';
      }
    } else if (Platform.OS === 'ios') {
      return 'granted';
    }
    return 'unavailable';
  }

  static async requestNearbyDevicesPermission(): Promise<PermissionStatusType> {
    if (Platform.OS === 'android') {
      try {
        if (this.isExpoGo()) {
          // In Expo Go, request location permission which provides nearby scanning capability
          return await this.requestGPSPermission();
        }

        const apiLevel = Platform.Version;
        if (typeof apiLevel === 'number' && apiLevel >= 31) {
          const results = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          ]);

          const allGranted =
            results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
            results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

          return allGranted ? 'granted' : 'denied';
        } else {
          return await this.requestGPSPermission();
        }
      } catch (e) {
        console.warn('Failed to request Bluetooth/Nearby permission:', e);
        return 'denied';
      }
    }
    return 'granted';
  }

  /**
   * Notifications Permissions (Supported in Development Builds & Expo Go where available)
   */
  static async checkNotificationsPermission(): Promise<PermissionStatusType> {
    if (!Notifications || !Notifications.getPermissionsAsync) {
      return 'unavailable';
    }
    try {
      const settings: any = await Notifications.getPermissionsAsync();
      const isGranted =
        settings?.granted ||
        settings?.status === 'granted' ||
        settings?.ios?.status === Notifications.IosAuthorizationStatus?.AUTHORIZED;
      return isGranted ? 'granted' : ((settings?.status as PermissionStatusType) || 'undetermined');
    } catch {
      return 'undetermined';
    }
  }

  static async requestNotificationsPermission(): Promise<PermissionStatusType> {
    if (!Notifications || !Notifications.requestPermissionsAsync) {
      return 'unavailable';
    }
    try {
      const settings: any = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      const isGranted = settings?.granted || settings?.status === 'granted';
      return isGranted ? 'granted' : 'denied';
    } catch (e) {
      console.warn('Failed to request notifications permission:', e);
      return 'denied';
    }
  }

  static async sendTestNotification(
    title: string = 'RescueNetAI',
    body: string = 'Rescue and alert notification channel is active!'
  ) {
    if (!Notifications || !Notifications.scheduleNotificationAsync) {
      throw new Error(
        'Notifications are disabled in Expo Go for Android SDK 53+. Please use a development build for notifications.'
      );
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * SMS Permissions & Operations (Supported in Expo Go via system composer & Standalone)
   */
  static async checkSMSPermission(): Promise<PermissionStatusType> {
    if (Platform.OS === 'android' && !this.isExpoGo()) {
      try {
        const readSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
        const sendSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
        return readSms && sendSms ? 'granted' : 'undetermined';
      } catch {
        return 'undetermined';
      }
    }
    const isAvailable = await SMS.isAvailableAsync();
    return isAvailable ? 'granted' : 'unavailable';
  }

  static async requestSMSPermission(): Promise<PermissionStatusType> {
    if (Platform.OS === 'android' && !this.isExpoGo()) {
      try {
        const permissions: Permission[] = [
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
        ];
        const results = await PermissionsAndroid.requestMultiple(permissions);
        const granted = results[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED;
        return granted ? 'granted' : 'denied';
      } catch (e) {
        console.warn('Failed to request SMS permission:', e);
        return 'denied';
      }
    }
    const isAvailable = await SMS.isAvailableAsync();
    return isAvailable ? 'granted' : 'unavailable';
  }

  static async composeSMS(phoneNumber: string, message: string) {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      return await SMS.sendSMSAsync([phoneNumber], message);
    } else {
      return await Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
    }
  }

  /**
   * Phone / Call Operations (Supported in Expo Go & Standalone)
   */
  static async checkPhonePermission(): Promise<PermissionStatusType> {
    if (Platform.OS === 'android' && !this.isExpoGo()) {
      try {
        const callGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
        return callGranted ? 'granted' : 'undetermined';
      } catch {
        return 'undetermined';
      }
    }
    return 'granted';
  }

  static async requestPhonePermission(): Promise<PermissionStatusType> {
    if (Platform.OS === 'android' && !this.isExpoGo()) {
      try {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
        return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
      } catch (e) {
        console.warn('Failed to request Phone permission:', e);
        return 'denied';
      }
    }
    return 'granted';
  }

  static async callPhone(phoneNumber: string) {
    return await Linking.openURL(`tel:${phoneNumber}`);
  }
}
