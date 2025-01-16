// lib/utils/constants.ts
import { Language } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { 
    code: 'en-US', 
    name: 'English', 
    voiceCode: 'en-US' 
  },
  { 
    code: 'zh-CN', 
    name: '中文', 
    voiceCode: 'zh-CN' 
  }
];

// 其他常量保持不变
export const SILENCE_THRESHOLD = 300; // 静音检测阈值（毫秒）
export const AUDIO_SAMPLE_RATE = 44100;
export const MAX_RECORDING_TIME = 60000; // 最大录音时间（毫秒）
