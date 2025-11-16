import {
  ConversationCreate,
  ConversationResponse,
  ConversationDetail,
  UtteranceCreate,
  UtteranceResponse,
  CompromiseResponse,
  SummaryResponse,
  SessionHistoryItem,
  ImpactMetrics,
  DebateQualityMetrics,
  TimelinePoint,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Conversation APIs
export const conversationAPI = {
  create: (data: ConversationCreate) =>
    fetchAPI<ConversationResponse>('/api/conversation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (conversationId: string) =>
    fetchAPI<ConversationDetail>(`/api/conversation/${conversationId}`),

  addUtterance: (conversationId: string, data: UtteranceCreate) =>
    fetchAPI<UtteranceResponse>(`/api/conversation/${conversationId}/utterance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateSummary: (conversationId: string) =>
    fetchAPI<SummaryResponse>(`/api/conversation/${conversationId}/summary`, {
      method: 'POST',
    }),
};

// Compromise API
export const compromiseAPI = {
  generate: (conversationId: string) =>
    fetchAPI<CompromiseResponse>(`/api/compromise/${conversationId}`, {
      method: 'POST',
    }),
};

// Analytics APIs
export const analyticsAPI = {
  getSessions: () => fetchAPI<SessionHistoryItem[]>('/api/analytics/sessions'),

  getImpact: () => fetchAPI<ImpactMetrics>('/api/analytics/impact'),

  getTimeline: (conversationId: string) =>
    fetchAPI<TimelinePoint[]>(`/api/analytics/conversation/${conversationId}/timeline`),

  getQuality: (conversationId: string) =>
    fetchAPI<DebateQualityMetrics>(`/api/analytics/conversation/${conversationId}/quality`),
};
