
export interface UserTheme {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  buttonBg: string;
  statusSuccess: string;
  statusDanger: string;
  statusWarning: string;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  upiId: string;
  qrCodeUrl: string;
  maintenanceMode: boolean;
}

export interface PromoBanner {
  imageUrl: string;
  linkUrl: string;
  enabled: boolean;
}

export interface AIAgent {
  id: string;
  name: string;
  instruction: string;
  apiKey?: string;
  icon: string;
  status: 'active' | 'maintenance';
  category: string;
}

export interface UserNotification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'system' | 'premium' | 'alert';
}

export interface UserSuggestion {
  id: string;
  user_uid: string;
  username: string;
  message: string;
  timestamp: string;
  replied: boolean;
}

export interface ChatProject {
  id: string;
  name: string;
  toolName: string;
  messages: Message[];
  lastUpdated: string;
  customInstructions?: string;
}

export interface User {
  uid: string;
  username: string;
  email: string;
  password?: string;
  premium: boolean;
  premium_plan?: string;
  premium_start_date?: string | null;
  premium_expiry_date?: string | null;
  isAdmin?: boolean;
  avatar?: string;
  remaining_ai_seconds: number;
  last_timer_reset?: string;
  theme?: UserTheme;
  created_at: string;
  last_login: string;
  total_usage_time: number;
  app_version: string;
  notifications?: { [key: string]: UserNotification };
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface PremiumPlan {
  id: string;
  plan_name: string;
  price: number;
  duration_days: number;
  benefits: string[];
  active: boolean;
  isPro: boolean;
  created_at: string;
}

export interface PremiumRequest {
  id: string;
  user_uid: string;
  user_email: string;
  plan_id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  isPro: boolean;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  request_time: string;
}
