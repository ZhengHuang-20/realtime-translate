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

// 优化配置参数
export const SILENCE_THRESHOLD = 500; // 增加到800ms，减少空识别
export const AUDIO_SAMPLE_RATE = 44100;
export const MAX_RECORDING_TIME = 60000;
export const AUDIO_CACHE_TIME = 3600000; // 1小时音频缓存
export const MAX_CACHE_SIZE = 100; // 最大缓存条目数

export const PREFERRED_VOICES = {
  'en-US': {
    namePattern: /English/i,
    fallbackPattern: /en-US/i,
    rate: 1.0,
    pitch: 1.0
  },
  'zh-CN': {
    namePattern: /中文/i,
    fallbackPattern: /zh-CN/i,
    rate: 1.0,
    pitch: 1.0
  }
};
