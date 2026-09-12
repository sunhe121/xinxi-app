import axios from 'axios';
import type {
  XinyuUser,
  DailyData,
  WeatherInfo,
  Broadcast,
  Recording,
  FamilyMember,
  FamilyMemberDetail,
  PrivacySettings,
  GenerateBroadcastRequest,
  GenerateBroadcastResponse,
  CreateInviteCodeRequest,
  RedeemInviteCodeRequest,
  InitUserRequest,
  UpdatePrivacyRequest,
  UpdateRemarkNameRequest,
  UploadFileRequest,
  UploadFileResponse,
  SendTextMessageRequest,
  SendFileMessageRequest,
  MessageListResponse,
  XinyuMessage,
  UpdateUserRequest,
  SendThinkOfYouRequest,
  ThinkOfYouResponse,
} from '@shared/api.interface';
const TOKEN_KEY = 'xinxi_token';

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

const request = axios.create({
  baseURL: '/',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.endsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export interface AuthResponse {
  token: string;
  user: XinyuUser;
}

export const authApi = {
  async register(nickname: string, password: string, gender?: string): Promise<AuthResponse> {
    const res = await request.post('/api/xinyu/auth/register', { nickname, password, gender });
    return res.data;
  },

  async login(nickname: string, password: string): Promise<AuthResponse> {
    const res = await request.post('/api/xinyu/auth/login', { nickname, password });
    return res.data;
  },

  logout(): void {
    clearToken();
  },
};

export const usersApi = {
  async getCurrentUser(): Promise<XinyuUser | null> {
    const res = await request.get('/api/xinyu/users/me');
    return res.data;
  },

  async initUser(data: InitUserRequest): Promise<XinyuUser> {
    const res = await request.post('/api/xinyu/users/init', data);
    return res.data;
  },

  async updateUser(data: Partial<XinyuUser>): Promise<XinyuUser> {
    const res = await request.patch('/api/xinyu/users/me', data);
    return res.data;
  },

  async getProfile(): Promise<XinyuUser | null> {
    const res = await request.get('/api/xinyu/users/me');
    return res.data;
  },

  async updateProfile(data: UpdateUserRequest): Promise<XinyuUser> {
    const res = await request.patch('/api/xinyu/users/me', data);
    return res.data;
  },
};

export const familyApi = {
  async getFamilyList(): Promise<FamilyMember[]> {
    const res = await request.get('/api/xinyu/family');
    return res.data;
  },

  async getActiveInviteCode(): Promise<{ code: string; expiresAt: string; relation: string } | null> {
    const res = await request.get('/api/xinyu/family/invite-code');
    return res.data;
  },

  async createInviteCode(data: CreateInviteCodeRequest): Promise<{ code: string; expiresAt: string; relation: string }> {
    const res = await request.post('/api/xinyu/family/invite-code', data);
    return res.data;
  },

  async redeemInviteCode(data: RedeemInviteCodeRequest): Promise<FamilyMember> {
    const res = await request.post('/api/xinyu/family/redeem', data);
    return res.data;
  },

  async removeFamily(bindingId: string): Promise<void> {
    await request.delete(`/api/xinyu/family/${bindingId}`);
  },

  async getMemberDetail(userId: string): Promise<FamilyMemberDetail> {
    const res = await request.get(`/api/xinyu/family/${userId}/detail`);
    return res.data;
  },

  async updateRemarkName(bindingId: string, remarkName: string): Promise<void> {
    await request.patch(`/api/xinyu/family/${bindingId}/remark`, { bindingId, remarkName } as UpdateRemarkNameRequest);
  },
};

export const messagesApi = {
  async getMessages(bindingId: string, cursor?: string, limit = 30): Promise<MessageListResponse> {
    let url = `/api/xinyu/messages?bindingId=${bindingId}&limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    const res = await request.get(url);
    return res.data;
  },

  async sendTextMessage(data: SendTextMessageRequest): Promise<XinyuMessage> {
    const res = await request.post('/api/xinyu/messages/text', data);
    return res.data;
  },

  async sendFileMessage(data: SendFileMessageRequest): Promise<XinyuMessage> {
    const res = await request.post('/api/xinyu/messages/file', data);
    return res.data;
  },

  async sendThinkOfYou(
    targetUserId: string,
    content: string,
    type: 'text' | 'template' = 'text',
  ): Promise<ThinkOfYouResponse> {
    const res = await request.post('/api/xinyu/messages/think-of-you', {
      targetUserId,
      content,
      type,
    } satisfies SendThinkOfYouRequest);
    return res.data;
  },
};

export const uploadApi = {
  async uploadFile(data: UploadFileRequest): Promise<UploadFileResponse> {
    const res = await request.post('/api/xinyu/upload', data);
    return res.data;
  },
};

export const privacyApi = {
  async getSettings(): Promise<PrivacySettings> {
    const res = await request.get('/api/xinyu/privacy');
    return res.data;
  },

  async updateSettings(data: UpdatePrivacyRequest): Promise<PrivacySettings> {
    const res = await request.patch('/api/xinyu/privacy', data);
    return res.data;
  },
};

export const dailyDataApi = {
  async getTodayData(userId?: string): Promise<DailyData> {
    const url = userId
      ? `/api/xinyu/daily-data/today?userId=${userId}`
      : '/api/xinyu/daily-data/today';
    const res = await request.get(url);
    return res.data;
  },

  async getWeekData(userId?: string): Promise<DailyData[]> {
    const url = userId
      ? `/api/xinyu/daily-data/week?userId=${userId}`
      : '/api/xinyu/daily-data/week';
    const res = await request.get(url);
    return res.data;
  },
};

export const weatherApi = {
  async getWeather(city?: string): Promise<WeatherInfo> {
    const url = city
      ? `/api/xinyu/weather?city=${encodeURIComponent(city)}`
      : '/api/xinyu/weather';
    const res = await request.get(url);
    return res.data;
  },
};

export const broadcastsApi = {
  async getList(
    page = 1,
    pageSize = 20,
    targetUserId?: string,
  ): Promise<{ items: Broadcast[]; total: number }> {
    let url = `/api/xinyu/broadcasts?page=${page}&pageSize=${pageSize}`;
    if (targetUserId) url += `&targetUserId=${targetUserId}`;
    const res = await request.get(url);
    return res.data;
  },

  async getInbox(
    page = 1,
    pageSize = 20,
    familyUserId?: string,
  ): Promise<{ items: Broadcast[]; total: number }> {
    let url = `/api/xinyu/broadcasts/inbox?page=${page}&pageSize=${pageSize}`;
    if (familyUserId) url += `&familyUserId=${familyUserId}`;
    const res = await request.get(url);
    return res.data;
  },

  async getById(id: string): Promise<Broadcast> {
    const res = await request.get(`/api/xinyu/broadcasts/${id}`);
    return res.data;
  },

  async generate(data: GenerateBroadcastRequest): Promise<GenerateBroadcastResponse> {
    const res = await request.post('/api/xinyu/broadcasts/generate', data);
    return res.data;
  },

  async markAsRead(id: string): Promise<Broadcast> {
    const res = await request.patch(`/api/xinyu/broadcasts/${id}/read`);
    return res.data;
  },

  async reply(
    id: string,
    data: { content: string; audioUrl?: string },
  ): Promise<Broadcast> {
    const res = await request.post(`/api/xinyu/broadcasts/${id}/reply`, data);
    return res.data;
  },
};

export const recordingsApi = {
  async getList(category?: string): Promise<Recording[]> {
    const url = category
      ? `/api/xinyu/recordings?category=${category}`
      : '/api/xinyu/recordings';
    const res = await request.get(url);
    return res.data;
  },

  async save(
    id: string,
    data: { audioUrl: string; duration: number },
  ): Promise<Recording> {
    const res = await request.patch(`/api/xinyu/recordings/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await request.delete(`/api/xinyu/recordings/${id}`);
  },

  async syncToFamily(): Promise<void> {
    await request.post('/api/xinyu/recordings/sync-to-family');
  },
};

