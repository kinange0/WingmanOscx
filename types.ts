
export type Intensity = 'soft' | 'medium' | 'bold';
export type UserState = 'confident' | 'shy' | 'unsure' | 'frustrated' | 'anxious' | 'mind-game' | 'attraction' | 'chaos';
export type VibeMode = 'smooth' | 'cold' | 'chaos' | 'warm';
export type IntelligenceModule = 'analyze' | 'reply' | 'ghost' | 'radar' | 'timing' | 'sos';
export type Theme = 'midnight' | 'lust' | 'neon' | 'stealth';

export interface MediaPart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export interface Message {
  /**
   * Role can be 'user', 'target' (her), 'user_input' (explicitly used in App.tsx), or 'model' (AI advice sent)
   */
  role: 'user' | 'target' | 'user_input' | 'model';
  content: string;
  timestamp: number;
  media?: MediaPart;
}

export interface CommunicationStats {
  interestLevel: number;
  energyRatio: string;
  investmentScore: number;
  vibeStatus: 'green' | 'yellow' | 'red';
  simpingRisk: 'low' | 'moderate' | 'high' | 'critical';
}

export interface Contact {
  id: string;
  name: string;
  notes: string;
  history: Message[];
  summary?: string; 
  suggestion?: string; 
  avatar?: string; 
  stats?: CommunicationStats;
  lastAdvice?: WingmanAdvice;
  // Strategic Intel
  starters?: string[];
  forbiddenWords?: string[];
  reminders?: string[];
  peakHours?: string;
  personalityType?: string;
  // Added psychoTraits to store behavioral grid data from AI analysis
  psychoTraits?: string[];
  emergencyLogs?: Array<{date: number, action: string, outcome: string}>;
}

export interface SuggestionReply {
  reply: string;
  why: string;
  vibe: 'calm' | 'playful' | 'bold';
  label: string;
  timingAdvice: string;
  voiceNotePrompt?: string;
  isRecommended?: boolean;
}

export interface WingmanAdvice {
  detailedSuggestions: SuggestionReply[];
  insight: string;
  subtext?: string;
  intent?: string;
  simpRadarStatus?: string;
  latencyAdvice?: string;
  realTalk?: string;
  cringeCheck?: string;
  detectedSignals?: string[];
  metrics?: {
    interest: number;
    investment: number;
  };
}

export interface AppState {
  contacts: Contact[];
  activeContactId: string | null;
  intensity: Intensity;
  userState: UserState;
  vibeMode: VibeMode;
  activeModule: IntelligenceModule;
  activeTheme: Theme;
  isGenerating: boolean;
  advice: WingmanAdvice | null;
}