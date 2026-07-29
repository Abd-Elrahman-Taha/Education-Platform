import { fakeApiCall, ApiResponse } from '../../../api/client';
import { mockDB } from '../../../services/db';
import { SystemNotification } from '../../../types';

export const notificationsApi = {
  getNotifications: (userId: string): Promise<ApiResponse<SystemNotification[]>> => {
    return fakeApiCall(() => mockDB.getNotifications(userId));
  },

  markAsRead: (id: string): Promise<ApiResponse<void>> => {
    return fakeApiCall(() => mockDB.markNotificationAsRead(id));
  },

  markAllAsRead: (userId: string): Promise<ApiResponse<void>> => {
    return fakeApiCall(() => mockDB.markAllNotificationsAsRead(userId));
  },
};
