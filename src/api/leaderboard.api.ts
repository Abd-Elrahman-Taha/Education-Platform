import { apiClient } from './axios';
import {
  LeaderboardResponse,
  MyRankResponse,
} from '../types/api.types';

export interface GetLeaderboardParams {
  educationStage: 'Primary' | 'Preparatory' | 'Secondary' | 'University' | string;
  grade: string;
  page?: number;
  limit?: number;
}

export const leaderboardApi = {
  /**
   * Get Global Leaderboard filtered by academic stage and grade.
   * Endpoint: GET /api/v1/leaderboard
   * Query: educationStage (required), grade (required), page, limit
   * Roles: Any authenticated
   */
  getLeaderboard: async (params: GetLeaderboardParams): Promise<LeaderboardResponse> => {
    const response = await apiClient.get<LeaderboardResponse>('/leaderboard', {
      params,
    });
    return response.data;
  },

  /**
   * Get authenticated student's rank and competition statistics.
   * Endpoint: GET /api/v1/leaderboard/my-rank
   * Roles: Student
   */
  getMyRank: async (): Promise<MyRankResponse> => {
    const response = await apiClient.get<MyRankResponse>('/leaderboard/my-rank');
    return response.data;
  },
};

