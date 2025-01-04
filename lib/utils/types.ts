// lib/utils/types.ts
export interface Language {
    code: string;
    name: string;
    voiceCode?: string; // 用于语音合成
  }
  
  export interface TranslationResult {
    sourceText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    timestamp: number;
  }
  
  export interface AudioRecorderState {
    isRecording: boolean;
    isPaused: boolean;
    error?: string;
  }
  
  // lib/utils/constants.ts
  export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en-US', name: 'English', voiceCode: 'en-US' },
    { code: 'zh-CN', name: '中文', voiceCode: 'zh-CN' },
    { code: 'ja-JP', name: '日本語', voiceCode: 'ja-JP' },
    { code: 'ko-KR', name: '한국어', voiceCode: 'ko-KR' },
  ];
  
  export const SILENCE_THRESHOLD = 1500; // 静音检测阈值（毫秒）
  export const AUDIO_SAMPLE_RATE = 44100;
  export const MAX_RECORDING_TIME = 60000; // 最大录音时间（毫秒）