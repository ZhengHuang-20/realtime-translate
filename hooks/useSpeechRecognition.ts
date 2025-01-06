// hooks/useSpeechRecognition.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { SILENCE_THRESHOLD } from '@/lib/utils/constants';

export const useSpeechRecognition = (
  language: string,
  onTranscript: (text: string) => void
) => {
  const recognition = useRef<any>(null);
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState(false);
  const currentTranscript = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
    }
    
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);
  
  const startListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.lang = language;
      currentTranscript.current = ''; // 重置当前转录内容
      
      recognition.current.onresult = (event: any) => {
        const latest = event.results[event.results.length - 1];
        const transcript = latest[0].transcript;
        
        // 只处理最新的一段语音
        if (latest.isFinal) {
          // 如果没有正在进行的计时器，创建新的计时器
          if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current);
          }
          
          silenceTimeout.current = setTimeout(() => {
            currentTranscript.current = transcript;
            onTranscript(transcript);
          }, SILENCE_THRESHOLD);
        }
      };
      
      recognition.current.start();
      setIsListening(true);
    }
  }, [language, onTranscript]);
  
  const stopListening = useCallback(() => {
    if (recognition.current) {
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
      }
      recognition.current.stop();
      setIsListening(false);
      currentTranscript.current = ''; // 清除转录内容
    }
  }, []);

  const clearTranscript = useCallback(() => {
    currentTranscript.current = '';
    if (recognition.current) {
      // 重新启动识别以清除缓存
      recognition.current.abort();
      recognition.current.start();
    }
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    clearTranscript,
  };
};
