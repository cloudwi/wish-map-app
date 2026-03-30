import apiClient from './client';

export type ReportTargetType = 'COMMENT' | 'RESTAURANT';
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'FALSE_INFO' | 'OTHER';

interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description?: string;
}

interface ReportResponse {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description: string | null;
  createdAt: string;
}

export const reportApi = {
  create: async (request: CreateReportRequest): Promise<ReportResponse> => {
    const response = await apiClient.post<ReportResponse>('/reports', request);
    return response.data;
  },
};
