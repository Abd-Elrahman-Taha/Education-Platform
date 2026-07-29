import { fakeApiCall, ApiResponse } from '../../../api/client';
import { mockDB } from '../../../services/db';
import { StudentDashboardData, ProgressTimelineData } from '../../../types';

export const studentApi = {
  getDashboard: (): Promise<ApiResponse<StudentDashboardData>> => {
    return fakeApiCall(() => mockDB.getStudentDashboard());
  },

  getProgressTimeline: (): Promise<ApiResponse<ProgressTimelineData>> => {
    return fakeApiCall(() => mockDB.getProgressTimeline());
  },
};
