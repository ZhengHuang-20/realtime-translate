// hooks/useAudioRecorder.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioRecorderState } from '@/lib/utils/types';

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
  });
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const mediaStream = useRef<MediaStream | null>(null);
  
  // 清理资源的函数
  const cleanupResources = useCallback(() => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    audioChunks.current = [];
  }, []);
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);
  
  const startRecording = useCallback(async () => {
    try {
      // 先清理之前可能存在的资源
      cleanupResources();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onerror = (event) => {
        setState(prev => ({ ...prev, error: '录音过程中出错' }));
        console.error('MediaRecorder error:', event);
        stopRecording();
      };
      
      mediaRecorder.current.start();
      setState({ isRecording: true, isPaused: false });
    } catch (error) {
      setState(prev => ({ ...prev, error: '无法启动录音' }));
      console.error('Recording error:', error);
      cleanupResources();
    }
  }, [cleanupResources]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && state.isRecording) {
      try {
        mediaRecorder.current.stop();
        setState({ isRecording: false, isPaused: false });
      } catch (error) {
        console.error('Error stopping recording:', error);
      } finally {
        cleanupResources();
      }
    }
  }, [state.isRecording, cleanupResources]);
  
  return {
    state,
    startRecording,
    stopRecording,
    audioChunks: audioChunks.current,
    mediaStream: mediaStream.current,
  };
};