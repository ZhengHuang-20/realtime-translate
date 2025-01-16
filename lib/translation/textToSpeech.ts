// lib/translation/textToSpeech.ts
'use client';

// 预定义的优质声音映射
const PREFERRED_VOICES = {
  'en-US': {
    name: 'en-GB-Journey-D', // Use British male voice
    naturalness: 0.9,
    pitch: 1.0,
    speakingRate: 1.0
  },
  'zh-CN': {
    name: 'zh-CN-Standard-B', // Use Chinese male voice
    naturalness: 0.9,
    pitch: 1.0,
    speakingRate: 0.9
  },
  'ms-MY': {
    name: 'ms-MY-Standard-B', // Malay male voice
    naturalness: 0.8,
    pitch: 1.0,
    speakingRate: 0.9
  }
};

export function speakText(text: string, language: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const voiceSettings = PREFERRED_VOICES[language as keyof typeof PREFERRED_VOICES] || {};
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, ...voiceSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      const { audioUrl } = await response.json();

      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        resolve();
      };
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        reject(new Error('Audio playback failed: ' + error));
      };
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      reject(new Error('Failed to synthesize speech: ' + error));
    }
  });
}
