import { fakeApiCall, ApiResponse } from '../../../api/client';
import { mockDB } from '../../../services/db';
import { ExamRecord, ExamStats } from '../../../types';

export const examsApi = {
  getExamHistory: (): Promise<ApiResponse<ExamRecord[]>> => {
    return fakeApiCall(() => mockDB.getExamHistory());
  },

  getExamStats: (): Promise<ApiResponse<ExamStats>> => {
    return fakeApiCall(() => mockDB.getExamStats());
  },
};
