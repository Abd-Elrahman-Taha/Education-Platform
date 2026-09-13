/**
 * Device UUID Management
 * Generates and retrieves a persistent UUID for the current browser/device.
 */

const DEVICE_UUID_KEY = 'device_uuid';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateV4UUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      const id = crypto.randomUUID();
      if (UUID_REGEX.test(id)) return id;
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceUuid(): string {
  try {
    let deviceUuid = localStorage.getItem(DEVICE_UUID_KEY);
    if (!deviceUuid || !UUID_REGEX.test(deviceUuid)) {
      deviceUuid = generateV4UUID();
      localStorage.setItem(DEVICE_UUID_KEY, deviceUuid);
    }
    return deviceUuid;
  } catch {
    return generateV4UUID();
  }
}
