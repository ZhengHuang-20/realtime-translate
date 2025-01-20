// lib/translation/textToSpeech.ts
'use client';

// 优化预定义的声音映射，移除不支持的参数
const PREFERRED_VOICES = {
  'en-US': {
    name: 'en-GB-Neural2-B', // 使用更现代的神经网络声音
    naturalness: 0.9
  },
  'zh-CN': {
    name: 'zh-CN-Neural2-B', // 使用更现代的神经网络声音
    naturalness: 0.9
  },
  'ms-MY': {
    name: 'ms-MY-Standard-B',
    naturalness: 0.8
  }
};

export function speakText(text: string, language: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const voiceSettings = PREFERRED_VOICES[language as keyof typeof PREFERRED_VOICES] || {};
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          language,
          name: voiceSettings.name,
          naturalness: voiceSettings.naturalness
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      const { audioUrl } = await response.json();
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        reject(new Error('Audio playback failed'));
      };

      await audio.play();
    } catch (error) {
      reject(new Error('Failed to synthesize speech'));
    }
  });
}
