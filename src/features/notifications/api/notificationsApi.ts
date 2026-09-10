import { ApiResponse } from '../../../api/client';
import { SystemNotification } from '../../../types';

export const notificationsApi = {
  getNotifications: async (_userId: string): Promise<ApiResponse<SystemNotification[]>> => {
    return {
      data: [],
      status: 200,
      message: 'Success',
    };
  },

  markAsRead: async (_id: string): Promise<ApiResponse<void>> => {
    return {
      data: undefined,
      status: 200,
      message: 'Success',
    };
  },

  markAllAsRead: async (_userId: string): Promise<ApiResponse<void>> => {
    return {
      data: undefined,
      status: 200,
      message: 'Success',
    };
  },
};
