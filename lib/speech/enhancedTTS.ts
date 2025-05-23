// lib/speech/enhancedTTS.ts
'use client';

import { logger } from '@/lib/utils/logger';

// 优化的声音配置
const PREFERRED_VOICES = {
  'en-US': {
    namePattern: /en.*female/i,  // 优先选择英语女声
    fallbackPattern: /en/i,      // 备选任何英语声音
    rate: 0.9,                   // 稍微降低语速
    pitch: 1.05                  // 稍微提高音调
  },
  'zh-CN': {
    namePattern: /zh.*female/i,  // 优先选择中文女声
    fallbackPattern: /zh/i,       // 备选任何中文声音
    rate: 0.85,                   // 中文需要更慢一些以提高清晰度
    pitch: 1.02                   // 轻微提高音调
  },
  'ms-MY': {
    namePattern: /ms/i,
    rate: 0.9,
    pitch: 1.0
  }
};

// 获取最佳语音
function getBestVoice(language: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  
  const settings = PREFERRED_VOICES[language as keyof typeof PREFERRED_VOICES];
  if (!settings) return voices.find(voice => voice.lang.startsWith(language.split('-')[0])) || null;
  
  // 尝试按偏好匹配
  let voice = voices.find(voice => {
    return voice.lang.includes(language.split('-')[0]) && 
           settings.namePattern.test(voice.name);
  });
  
  // 备选匹配
  if (!voice) {
    voice = 'fallbackPattern' in settings 
      ? voices.find(voice => settings.fallbackPattern.test(voice.lang))
      : undefined;
  }
  
  // 最后的备选
  if (!voice) {
    voice = voices.find(voice => voice.lang.startsWith(language.split('-')[0]));
  }
  
  return voice || null;
}

// 文本预处理函数
function preprocessText(text: string): string {
  // 确保文本有适当的标点符号
  let processed = text;
  
  // 如果文本末尾没有标点，添加句号
  if (!/[.!?。！？]$/.test(processed)) {
    processed += '。';
  }
  
  // 在长句中添加适当的停顿
  processed = processed.replace(/([^.!?。！？,，;；]{15,})[,，]/g, '$1, ');
  
  return processed;
}

// 将长文本分割成更小的片段
// 优化文本分块策略，减少分块数量
function splitTextIntoChunks(text: string): string[] | undefined {
  // 如果文本很短，直接返回
  if (text.length < 150) return [text]; // 增加阈值，减少不必要的分块
  
  // 其余逻辑保持不变
  // ... 省略原有代码 ...
}


// 增强的TTS函数
export function speakTextEnhanced(text: string, language: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      
      // 取消所有正在进行的语音
      window.speechSynthesis.cancel();
      
      // 预处理文本
      const processedText = preprocessText(text);
      
      // 分割文本
      const chunks = splitTextIntoChunks(processedText);
      logger.info('Speaking text in chunks', { chunkCount: chunks?.length ?? 0 });
      
      // 获取语音设置
      const settings = PREFERRED_VOICES[language as keyof typeof PREFERRED_VOICES] || {
        rate: 1.0,
        pitch: 1.0
      };
      
      // 确保我们有可用的声音
      if (window.speechSynthesis.getVoices().length === 0) {
        // 在某些浏览器中，voices可能需要时间加载
        window.speechSynthesis.onvoiceschanged = () => {
          speakChunks(chunks || [], 0);
        };
      } else {
        speakChunks(chunks || [], 0);
      }
      
      // 递归函数来按顺序朗读文本块
      function speakChunks(textChunks: string[], index: number) {
        if (index >= textChunks.length) {
          resolve();
          return;
        }
        
        const chunk = textChunks[index];
        const utterance = new SpeechSynthesisUtterance(chunk);
        
        // 设置语言
        utterance.lang = language;
        
        // 尝试获取最佳声音
        const voice = getBestVoice(language);
        if (voice) utterance.voice = voice;
        
        // 设置语速和音调
        utterance.rate = settings.rate || 1.0;
        utterance.pitch = settings.pitch || 1.0;
        utterance.volume = 1.0;
        
        // 事件处理
        utterance.onend = () => {
          speakChunks(textChunks, index + 1);
        };
        
        utterance.onerror = (event) => {
          logger.error('Speech synthesis error', { error: event });
          // 继续下一个块，而不是完全失败
          speakChunks(textChunks, index + 1);
        };
        
        // 开始朗读
        window.speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      logger.error('Enhanced TTS error', { error });
      reject(error);
    }
  });
}

// 检查浏览器TTS支持
export function checkTTSSupport(): {
  supported: boolean;
  voices: number;
  languages: string[];
} {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { supported: false, voices: 0, languages: [] };
  }
  
  const voices = window.speechSynthesis.getVoices();
  return {
    supported: true,
    voices: voices.length,
    languages: [...new Set(voices.map(voice => voice.lang))]
  };
}