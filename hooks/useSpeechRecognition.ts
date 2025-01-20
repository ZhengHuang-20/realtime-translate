// hooks/useSpeechRecognition.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { SILENCE_THRESHOLD } from '@/lib/utils/constants';

export const useSpeechRecognition = (
  language: string,
  onTranscript: (text: string) => void,
  onTranscriptComplete?: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef<any>(null);
  const isRecognitionActive = useRef(false);
  const shouldContinue = useRef(true);
  const currentTranscript = useRef('');
  const silenceTimeout = useRef<NodeJS.Timeout>();
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
      }
    }
    return () => {
      stopListening();
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognition.current && isRecognitionActive.current) {
      shouldContinue.current = false;
      recognition.current.stop();
      isRecognitionActive.current = false;
      setIsListening(false);
      logger.performance('speech-recognition-session', startTime.current);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognition.current) {
      logger.error('Speech recognition not supported');
      return;
    }

    try {
      if (!isRecognitionActive.current) {
        startTime.current = Date.now();
        logger.info('Starting speech recognition');
        shouldContinue.current = true;
        recognition.current.lang = language;
        currentTranscript.current = '';

        recognition.current.onresult = (event: any) => {
          const latest = event.results[event.results.length - 1];
          const transcript = latest[0].transcript;
          
          if (transcript.trim()) {
            logger.info('Transcript received:', { transcript });
            
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
          }
        };

        recognition.current.onstart = () => {
          logger.info('Recognition started');
          isRecognitionActive.current = true;
          setIsListening(true);
        };

        recognition.current.onend = () => {
          logger.info('Recognition ended');
          isRecognitionActive.current = false;
          setIsListening(false);

          if (shouldContinue.current) {
            setTimeout(() => {
              recognition.current?.start();
            }, 100);
          }
        };

        recognition.current.onerror = (event: any) => {
          logger.error('Recognition error:', event.error);
          isRecognitionActive.current = false;
          setIsListening(false);
        };

        recognition.current.start();
      } else {
        logger.info('Recognition is already active');
      }
    } catch (error) {
      logger.error('Error starting recognition:', error);
      isRecognitionActive.current = false;
      setIsListening(false);
    }
  }, [language, onTranscript, stopListening]);

  return {
    isListening,
    startListening,
    stopListening,
  };
};
