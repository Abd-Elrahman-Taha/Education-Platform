import { fakeApiCall, ApiResponse } from '../../../api/client';
import { mockDB } from '../../../services/db';
import { AIMessage } from '../../../types';

export const aiApi = {
  getChatHistory: (lessonId: string): Promise<ApiResponse<AIMessage[]>> => {
    return fakeApiCall(() => mockDB.getAIChatHistory(lessonId));
  },

  sendMessage: (lessonId: string, text: string): Promise<ApiResponse<{ userMessage: AIMessage; botMessage: AIMessage }>> => {
    return fakeApiCall(() => mockDB.sendAIChatMessage(lessonId, text));
  },

  clearChat: (lessonId: string): Promise<ApiResponse<void>> => {
    return fakeApiCall(() => mockDB.clearAIChatHistory(lessonId));
  },
};
