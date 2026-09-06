/**
 * Device UUID Management
 * Generates and retrieves a persistent UUID for the current browser/device.
 */

const DEVICE_UUID_KEY = 'device_uuid';

export function getDeviceUuid(): string {
  try {
    let deviceUuid = localStorage.getItem(DEVICE_UUID_KEY);
    if (!deviceUuid) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        deviceUuid = crypto.randomUUID();
      } else {
        // Fallback for older browsers
        deviceUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      localStorage.setItem(DEVICE_UUID_KEY, deviceUuid);
    }
    return deviceUuid;
  } catch {
    // If localStorage is unavailable (e.g. private mode blocked)
    return 'fallback-device-uuid-' + Date.now();
  }
}
