import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PermissionManager, AppPermissionsStatus, PermissionStatusType } from '@/services/permissions/permissionManager';

export function usePermissions() {
  const [permissions, setPermissions] = useState<AppPermissionsStatus>({
    gps: 'undetermined',
    nearbyDevices: 'undetermined',
    notifications: 'undetermined',
    sms: 'undetermined',
    phone: 'undetermined',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await PermissionManager.checkAllPermissions();
      setPermissions(status);
    } catch (e) {
      console.warn('Failed to refresh permissions:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();

    // Re-check permissions whenever app comes back to foreground (e.g., from system settings)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshPermissions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshPermissions]);

  const requestGPS = async () => {
    const result = await PermissionManager.requestGPSPermission();
    setPermissions((prev) => ({ ...prev, gps: result }));
    return result;
  };

  const requestNearbyDevices = async () => {
    const result = await PermissionManager.requestNearbyDevicesPermission();
    setPermissions((prev) => ({ ...prev, nearbyDevices: result }));
    return result;
  };

  const requestNotifications = async () => {
    const result = await PermissionManager.requestNotificationsPermission();
    setPermissions((prev) => ({ ...prev, notifications: result }));
    return result;
  };

  const requestSMS = async () => {
    const result = await PermissionManager.requestSMSPermission();
    setPermissions((prev) => ({ ...prev, sms: result }));
    return result;
  };

  const requestPhone = async () => {
    const result = await PermissionManager.requestPhonePermission();
    setPermissions((prev) => ({ ...prev, phone: result }));
    return result;
  };

  return {
    permissions,
    isLoading,
    refreshPermissions,
    requestGPS,
    requestNearbyDevices,
    requestNotifications,
    requestSMS,
    requestPhone,
  };
}
