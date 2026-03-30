import apiClient from './client';

interface AgreementResponse {
  agreed: boolean;
}

export const agreementApi = {
  agree: async (type: string): Promise<AgreementResponse> => {
    const response = await apiClient.post<AgreementResponse>(`/agreements/${type}`);
    return response.data;
  },

  check: async (type: string): Promise<boolean> => {
    const response = await apiClient.get<AgreementResponse>(`/agreements/${type}`);
    return response.data.agreed;
  },
};
