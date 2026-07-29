import { fakeApiCall, ApiResponse } from '../../../api/client';
import { mockDB } from '../../../services/db';
import { TeacherMessage } from '../../../types';

export const messagesApi = {
  getStudentMessages: (lessonId?: string): Promise<ApiResponse<TeacherMessage[]>> => {
    return fakeApiCall(() => {
      if (lessonId) {
        return mockDB.getMessagesForLesson(lessonId);
      }
      return mockDB.getTeacherMessages().filter(m => m.studentId === 'u_student_demo');
    });
  },

  sendStudentMessage: (lessonId: string, text: string, attachmentUrl?: string): Promise<ApiResponse<TeacherMessage>> => {
    return fakeApiCall(() => mockDB.sendStudentMessage(lessonId, text, attachmentUrl));
  },

  getTeacherMessages: (): Promise<ApiResponse<TeacherMessage[]>> => {
    return fakeApiCall(() => mockDB.getTeacherMessages());
  },

  replyTeacherMessage: (messageId: string, replyText: string): Promise<ApiResponse<TeacherMessage>> => {
    return fakeApiCall(() => mockDB.replyTeacherMessage(messageId, replyText));
  },
};
