export type UserRole = 'child' | 'elder';

export type FamilyRelation =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'grandfather'
  | 'grandmother'
  | 'spouse'
  | 'other';

export const RELATION_LABELS: Record<FamilyRelation, string> = {
  father: '爸爸',
  mother: '妈妈',
  son: '儿子',
  daughter: '女儿',
  grandfather: '爷爷',
  grandmother: '奶奶',
  spouse: '配偶',
  other: '其他',
};

export type ToneStyle =
  | 'warm_chatter'
  | 'warm_concise'
  | 'humorous'
  | 'gentle';

export const TONE_STYLE_LABELS: Record<ToneStyle, string> = {
  warm_chatter: '温暖唠叨型',
  warm_concise: '简洁实在型',
  humorous: '幽默风趣型',
  gentle: '温柔细腻型',
};

export interface XinyuUser {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  inviteCode: string;
  city: string;
  pushTime: string;
  voiceType: string;
  playbackSpeed: number;
  toneStyle: ToneStyle;
  partnerNickname: string;
  myPartnerTitle: string;
  myTitle: string;
  bio: string;
  gender: 'male' | 'female';
}

export interface FamilyMember {
  id: string;
  bindingId: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  city: string;
  relation: FamilyRelation;
  relationLabel: string;
  remarkName: string;
  boundAt: string;
  hasUnread: boolean;
  lastActiveAt: string;
  lastBroadcastAt: string;
  unreadReportCount: number;
}

export interface InviteCodeInfo {
  code: string;
  relation: FamilyRelation;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
}

export interface PrivacySettings {
  stepsEnabled: boolean;
  sleepEnabled: boolean;
  locationEnabled: boolean;
  ambientSoundEnabled: boolean;
  callDurationEnabled: boolean;
  heartRateEnabled: boolean;
}

export interface DailyData {
  id: string;
  userId: string;
  dataDate: string;
  steps: number;
  sleepHours: number;
  outingStatus: 'home' | 'out';
  locationType: 'park' | 'supermarket' | 'hospital' | 'company' | 'home';
  callDuration: number;
  moodIndex: number;
  activityData: ActivityHourData[];
}

export interface ActivityHourData {
  hour: number;
  steps: number;
  location: string;
}

export interface WeatherInfo {
  city: string;
  temperature: number;
  tempHigh: number;
  tempLow: number;
  weather: string;
  weatherIcon: string;
  airQuality: string;
  airQualityLevel: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy';
  wind: string;
  humidity: number;
}

export type BroadcastDirection = 'to_partner' | 'from_partner';

export interface Broadcast {
  id: string;
  userId: string;
  targetUserId: string;
  content: string;
  summary: string;
  broadcastDate: string;
  moodIndex: number;
  steps: number;
  sleepHours: number;
  weatherInfo: WeatherInfo;
  status: 'generated' | 'generating' | 'failed';
  direction: BroadcastDirection;
  toneStyle: ToneStyle;
  isRead: boolean;
  replyContent?: string;
  replyAudioUrl?: string;
  senderNickname?: string;
  senderAvatar?: string;
  relation?: FamilyRelation;
  createdAt: string;
}

export interface Recording {
  id: string;
  userId: string;
  category: 'health' | 'diet' | 'weather' | 'emotion' | 'general';
  presetText: string;
  audioUrl: string;
  duration: number;
  isRecorded: boolean;
  syncedToFamily: boolean;
  syncedAt?: string;
}

export interface GenerateBroadcastRequest {
  targetUserId: string;
  relation?: FamilyRelation;
  direction?: BroadcastDirection;
  toneStyle?: ToneStyle;
}

export interface GenerateBroadcastResponse {
  content: string;
  summary: string;
  broadcastId: string;
}

export interface ReplyBroadcastRequest {
  content: string;
  audioUrl?: string;
}

export interface CreateInviteCodeRequest {
  relation: FamilyRelation;
}

export interface RedeemInviteCodeRequest {
  code: string;
  relation: FamilyRelation;
}

export interface InitUserRequest {
  nickname: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  toneStyle?: ToneStyle;
  partnerNickname?: string;
  myPartnerTitle?: string;
  myTitle?: string;
  bio?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpdateUserRequest {
  nickname?: string;
  city?: string;
  pushTime?: string;
  voiceType?: string;
  playbackSpeed?: number;
  avatarUrl?: string;
  toneStyle?: ToneStyle;
  partnerNickname?: string;
  myPartnerTitle?: string;
  myTitle?: string;
  bio?: string;
  gender?: 'male' | 'female';
}

export interface UpdatePrivacyRequest {
  stepsEnabled?: boolean;
  sleepEnabled?: boolean;
  locationEnabled?: boolean;
  ambientSoundEnabled?: boolean;
  callDurationEnabled?: boolean;
  heartRateEnabled?: boolean;
}

export interface UpdateRemarkNameRequest {
  bindingId: string;
  remarkName: string;
}

export type MessageType = 'text' | 'voice' | 'image' | 'video';

export interface XinyuMessage {
  id: string;
  bindingId: string;
  senderUserId: string;
  receiverUserId: string;
  messageType: MessageType;
  content: string;
  fileUrl: string;
  duration: number;
  isReported: boolean;
  createdAt: string;
}

export interface MessageListResponse {
  items: XinyuMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SendTextMessageRequest {
  bindingId: string;
  receiverUserId: string;
  content: string;
}

export interface UploadMessageFileRequest {
  bindingId: string;
  receiverUserId: string;
  messageType: 'voice' | 'image' | 'video';
  content?: string;
  duration?: number;
}

export interface SendFileMessageRequest {
  bindingId: string;
  receiverUserId: string;
  messageType: 'voice' | 'image' | 'video';
  fileUrl: string;
  content?: string;
  duration?: number;
}

export interface UploadFileRequest {
  fileName: string;
  fileBase64: string;
  type: 'image' | 'voice' | 'video';
}

export interface UploadFileResponse {
  fileUrl: string;
}

export interface WeekStepsItem {
  date: string;
  steps: number;
}

export interface WeekSleepItem {
  date: string;
  hours: number;
}

export interface FamilyMemberDetail extends FamilyMember {
  dailyData: DailyData | null;
  weekSteps: WeekStepsItem[];
  weekSleep: WeekSleepItem[];
}

export interface SendThinkOfYouRequest {
  targetUserId: string;
  content: string;
  type?: 'text' | 'template';
}

export interface ThinkOfYouResponse {
  success: true;
  messageId: string;
}

export interface FestivalReminder {
  id: string;
  name: string;
  date: string;
  type: 'birthday' | 'festival' | 'anniversary';
  familyMemberId?: string;
}

export const RECORDING_CATEGORY_LABELS: Record<Recording['category'], string> = {
  health: '健康叮嘱',
  diet: '饮食提醒',
  weather: '天气关心',
  emotion: '情感表达',
  general: '通用',
};


