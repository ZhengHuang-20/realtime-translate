// hooks/useSpeechRecognition.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { SILENCE_THRESHOLD } from '@/lib/utils/constants';

export const useSpeechRecognition = (
  language: string,
  onTranscript: (text: string) => void,
  onTranscriptComplete?: () => void
) => {
  const recognition = useRef<any>(null);
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState(false);
  const currentTranscript = useRef<string>('');
  const isRecognitionActive = useRef(false);
  const shouldContinue = useRef(false);

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
      try {
        if (!isRecognitionActive.current) {
          shouldContinue.current = true;
          recognition.current.lang = language;
          currentTranscript.current = '';
          
          recognition.current.onresult = (event: any) => {
            const latest = event.results[event.results.length - 1];
            const transcript = latest[0].transcript;
            
            if (latest.isFinal) {
              if (silenceTimeout.current) {
                clearTimeout(silenceTimeout.current);
              }
              
              silenceTimeout.current = setTimeout(() => {
                currentTranscript.current = transcript;
                stopListening();
                onTranscript(transcript);
              }, SILENCE_THRESHOLD);
            }
          };

          recognition.current.onstart = () => {
            console.log('Recognition started');
            isRecognitionActive.current = true;
            setIsListening(true);
          };

          recognition.current.onend = () => {
            console.log('Recognition ended');
            isRecognitionActive.current = false;
            setIsListening(false);

            if (shouldContinue.current) {
              recognition.current?.start();
            }
          };

          recognition.current.start();
        } else {
          console.log('Recognition is already active');
        }
      } catch (error) {
        console.error('Error starting recognition:', error);
        isRecognitionActive.current = false;
        setIsListening(false);
      }
    }
  }, [language, onTranscript]);
  
  const stopListening = useCallback(() => {
    if (recognition.current) {
      shouldContinue.current = false;
      recognition.current.stop();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    currentTranscript.current = '';
    if (recognition.current) {
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
