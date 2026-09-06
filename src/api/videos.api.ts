import { apiClient } from './axios';
import {
  WatermarkTokenResponse,
  HeartbeatRequest,
  HeartbeatResponse,
} from '../types/api.types';

export const videosApi = {
  /**
   * Fetch 6-hour dynamic watermark token for video playback.
   */
  getWatermarkToken: async (lessonId: string): Promise<WatermarkTokenResponse> => {
    const response = await apiClient.get<WatermarkTokenResponse>(
      `/videos/${lessonId}/watermark-token`
    );
    return response.data;
  },

  /**
   * Send heartbeat progress tracking (every 10-30s).
   * WatchedSeconds must never decrease.
   * If IsLocked === true, video player must halt immediately.
   */
  sendHeartbeat: async (
    lessonId: string,
    data: HeartbeatRequest
  ): Promise<HeartbeatResponse> => {
    const response = await apiClient.post<HeartbeatResponse>(
      `/videos/${lessonId}/heartbeat`,
      data
    );
    return response.data;
  },
};
