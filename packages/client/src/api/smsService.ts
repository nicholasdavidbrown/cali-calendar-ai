import apiClient from './client';

export interface SMSResponse {
  success: boolean;
  message: string;
  messageSid?: string;
  sentTo?: string;
  messageStyle?: string;
}

export interface SMSStatusResponse {
  success: boolean;
  status: {
    configured: boolean;
    phoneNumberSet: boolean;
    phoneNumber: string | null;
    lastSmsSent: string | null;
    ready: boolean;
  };
}

export interface SmsHistoryEntry {
  id: string;
  message: string;
  sentAt: string;
  recipientPhone: string;
  recipientName?: string;
  messageStyle: string;
  eventCount: number;
}

export interface SMSHistoryResponse {
  success: boolean;
  count: number;
  history: SmsHistoryEntry[];
}

/**
 * Send a test SMS with calendar summary to the authenticated user
 */
export const sendTestSMS = async (): Promise<SMSResponse> => {
  const response = await apiClient.post<SMSResponse>('/api/v1/sms/send-test');
  return response.data;
};

/**
 * Check SMS service configuration status
 */
export const getSMSStatus = async (): Promise<SMSStatusResponse> => {
  const response = await apiClient.get<SMSStatusResponse>('/api/v1/sms/status');
  return response.data;
};

/**
 * Get SMS history for the authenticated user
 */
export const getSMSHistory = async (limit: number = 50): Promise<SMSHistoryResponse> => {
  const response = await apiClient.get<SMSHistoryResponse>(`/api/v1/sms/history?limit=${limit}`);
  return response.data;
};
