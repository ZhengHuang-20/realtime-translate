// hooks/useAudioRecorder.ts
import { useState, useRef, useCallback } from 'react';
import type { AudioRecorderState } from '@/lib/utils/types';

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
  });
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      mediaRecorder.current.start();
      setState({ isRecording: true, isPaused: false });
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to start recording' }));
      console.error('Recording error:', error);
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && state.isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setState({ isRecording: false, isPaused: false });
    }
  }, [state.isRecording]);
  
  return {
    state,
    startRecording,
    stopRecording,
    audioChunks: audioChunks.current,
  };
};