import { apiClient } from './axios';
import {
  UploadDocumentResponse,
  CreateAIGenerationRequest,
  CreateAIGenerationResponse,
  AIGenerationStatusResponse,
  AIGenerationStatusData,
} from '../types/api.types';

export const aiApi = {
  /**
   * Upload source document (PDF) for AI Question Generation.
   * Endpoint: POST /api/v1/files/document
   * Requires Admin or SuperAdmin role.
   */
  uploadDocument: async (
    file: File,
    purpose: string = 'AIGenerationDocument'
  ): Promise<UploadDocumentResponse['data']> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('Purpose', purpose);

    const response = await apiClient.post<UploadDocumentResponse>('/files/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60s timeout for large PDF uploads
    });

    const raw = response.data as any;
    return raw?.data || raw;
  },

  /**
   * Enqueue an AI MCQ Generation task.
   * Endpoint: POST /api/v1/ai/generations
   * Returns a generationId to poll for status.
   */
  createGeneration: async (
    data: CreateAIGenerationRequest
  ): Promise<CreateAIGenerationResponse['data']> => {
    const payload: Record<string, any> = {
      UploadId: data.UploadId,
      RequestedCount: Math.min(Math.max(Number(data.RequestedCount) || 10, 1), 50),
    };

    if (data.ExamId && typeof data.ExamId === 'string' && data.ExamId.trim()) {
      payload.ExamId = data.ExamId.trim();
    }

    if (data.Notes && typeof data.Notes === 'string' && data.Notes.trim()) {
      payload.Notes = data.Notes.trim();
    }

    if (data.Ideas && typeof data.Ideas === 'string' && data.Ideas.trim()) {
      payload.Ideas = data.Ideas.trim();
    }

    const response = await apiClient.post<CreateAIGenerationResponse>('/ai/generations', payload);
    const raw = response.data as any;
    return raw?.data || raw;
  },

  /**
   * Get the status and result of an AI Generation task.
   * Endpoint: GET /api/v1/ai/generations/:generationId
   */
  getGenerationStatus: async (
    generationId: string
  ): Promise<AIGenerationStatusData> => {
    const response = await apiClient.get<AIGenerationStatusResponse>(`/ai/generations/${generationId}`);
    const raw = response.data as any;
    return raw?.data || raw;
  },
};
