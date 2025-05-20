// hooks/useSpeechRecognition.ts
import { useState, useRef, useCallback, useEffect } from 'react';
// 假设你的 logger 和常量路径如下
// import { logger } from '@/lib/utils/logger';
// import { SILENCE_THRESHOLD } from '@/lib/utils/constants';

// --- Mocking logger and SILENCE_THRESHOLD for standalone example ---
const SILENCE_THRESHOLD = 2500; // 默认静默阈值 (毫秒)
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  performance: (label: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`[PERF] ${label}: ${duration}ms`);
  },
};
// --- End Mocking ---

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = (
  language: string, // 识别语言，例如 "zh-CN" 或 "en-US"
  onTranscript: (text: string) => void // 识别到最终文本后的回调函数
) => {
  const [isListening, setIsListening] = useState(false); // 是否正在监听的状态
  const recognition = useRef<any>(null); // SpeechRecognition 实例的引用
  const isRecognitionActive = useRef(false); // 识别引擎是否真的处于活动状态的引用
  const shouldContinue = useRef(true); // 是否应该在 onend 后继续识别的标志
  const currentTranscript = useRef(''); // 当前累积的识别文本片段
  const silenceTimeoutId = useRef<NodeJS.Timeout | null>(null); // 静默超时的 Timeout ID
  const maxRecognitionTimeoutId = useRef<NodeJS.Timeout | null>(null); // 最大识别时长的 Timeout ID
  const startTime = useRef<number>(0); // 识别会话开始时间，用于性能追踪

  const MAX_RECOGNITION_TIME = 10000; // 最大识别时间 (毫秒)，例如10秒

  // 集中清理所有计时器的函数
  const clearAllTimeouts = useCallback(() => {
    if (silenceTimeoutId.current) {
      clearTimeout(silenceTimeoutId.current);
      silenceTimeoutId.current = null;
      // logger.info('静默计时器已清除');
    }
    if (maxRecognitionTimeoutId.current) {
      clearTimeout(maxRecognitionTimeoutId.current);
      maxRecognitionTimeoutId.current = null;
      // logger.info('最大识别时长计时器已清除');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognition.current && isRecognitionActive.current) {
      logger.info('停止语音识别 (stopListening)', {
        isActive: isRecognitionActive.current,
        shouldContinue: shouldContinue.current,
        hasSilenceTimeout: !!silenceTimeoutId.current,
        hasMaxTimeout: !!maxRecognitionTimeoutId.current,
      });
      
      shouldContinue.current = false; // 阻止 onend 事件后自动重启
      recognition.current.stop(); // 请求停止识别引擎
      // isRecognitionActive 和 setIsListening 状态将在 onend 事件中更新
      // 但为了即时反馈UI，可以先设置 setIsListening
      setIsListening(false);

      clearAllTimeouts(); // 清理所有相关的计时器
      logger.performance?.('speech-recognition-session', startTime.current);

    } else if (recognition.current && !isRecognitionActive.current) {
      // 如果 stopListening 被调用但识别并非激活状态 (例如，快速刷新后)
      // 确保 shouldContinue 为 false 并清理计时器
      // logger.info('stopListening 调用时识别未激活，确保清理');
      shouldContinue.current = false;
      clearAllTimeouts();
    }
  }, [clearAllTimeouts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognition.current = new SpeechRecognitionAPI();
        recognition.current.continuous = true; // 持续识别，直到明确停止
        recognition.current.interimResults = true; // 返回中间结果
        recognition.current.maxAlternatives = 1; // 只取最可能的识别结果
        
        // 浏览器级别的无语音超时设置 (可选，某些浏览器支持)
        // recognition.current.speechRecognitionTimeout = 5000; // 例如5秒无活动后触发 onend

        logger.info('语音识别服务已初始化', {
          continuous: recognition.current.continuous,
          interimResults: recognition.current.interimResults,
          silenceThreshold: SILENCE_THRESHOLD,
          maxAlternatives: recognition.current.maxAlternatives,
          // speechRecognitionTimeout: recognition.current.speechRecognitionTimeout
        });
      } else {
        logger.error('此浏览器不支持语音识别 API');
      }
    }

    // 组件卸载时的清理函数
    return () => {
      logger.info('useSpeechRecognition: useEffect 清理流程启动');
      shouldContinue.current = false; // 确保在卸载时不尝试重启

      if (recognition.current) {
        // 移除所有事件监听器，防止内存泄漏和意外行为
        recognition.current.onresult = null;
        recognition.current.onstart = null;
        recognition.current.onend = null;
        recognition.current.onerror = null;
        recognition.current.onspeechend = null;
        recognition.current.onsoundend = null;
        recognition.current.onaudioend = null;

        if (isRecognitionActive.current) { // 如果识别仍在活动
          logger.info('useSpeechRecognition: 清理时中止活动的识别');
          recognition.current.abort(); // 使用 abort() 强制立即停止，通常不触发 onend
          isRecognitionActive.current = false;
          setIsListening(false);
        }
      }
      clearAllTimeouts(); // 清理所有计时器
    };
  }, [clearAllTimeouts]); // 依赖 clearAllTimeouts

  const startListening = useCallback(() => {
    if (!recognition.current) {
      logger.error('语音识别服务未支持或未初始化');
      return;
    }

    if (isRecognitionActive.current) {
      logger.info('识别已经处于活动状态');
      return;
    }

    try {
      startTime.current = Date.now();
      logger.info('开始语音识别 (startListening)');
      
      shouldContinue.current = true; // 允许在结束后根据条件重启
      recognition.current.lang = language; // 设置识别语言
      currentTranscript.current = ''; // 重置当前文本片段
      
      clearAllTimeouts(); // 开始新的识别前，清除所有旧的计时器

      // 设置最大识别时长限制
      maxRecognitionTimeoutId.current = setTimeout(() => {
        logger.info('已达到最大识别时长', { maxTime: MAX_RECOGNITION_TIME });
        if (isRecognitionActive.current) { // 确保仍在识别
          const transcriptToProcess = currentTranscript.current;
          // 在调用 stopListening 之前设置 shouldContinue 为 false
          // 这样 stopListening 内部的 onend 事件就不会尝试重启
          shouldContinue.current = false; 
          stopListening(); // 这会停止识别并清理计时器
          
          if (transcriptToProcess.trim()) {
            onTranscript(transcriptToProcess);
          } else {
            // 可选：处理在最大时长后没有有效文本的情况
            // onTranscript(''); 
            logger.info('最大识别时长结束，但无有效文本');
          }
        }
      }, MAX_RECOGNITION_TIME);
      
      recognition.current.onresult = (event: any) => {
        const latestResult = event.results[event.results.length - 1];
        const transcript = latestResult[0].transcript;
        
        // logger.info('收到识别结果 (onresult)', { transcript, isFinal: latestResult.isFinal });

        if (transcript.trim()) {
          currentTranscript.current = transcript; // 持续更新当前文本
          
          // 收到新的语音输入，重置静默计时器
          if (silenceTimeoutId.current) {
            clearTimeout(silenceTimeoutId.current);
            silenceTimeoutId.current = null;
          }
          
          if (latestResult.isFinal) { // 如果这是最终确认的片段
            // logger.info('收到最终片段，设置静默超时', { transcript });
            silenceTimeoutId.current = setTimeout(() => {
              if (!shouldContinue.current) {
                // logger.info('静默超时触发，但 shouldContinue 为 false，不处理');
                return; // 如果已经被指示停止，则不处理
              }
              logger.info('静默超时已触发', { 
                threshold: SILENCE_THRESHOLD,
                transcript: currentTranscript.current 
              });
              const finalTranscript = currentTranscript.current;
              shouldContinue.current = false; // 准备停止
              stopListening(); // 停止识别并清理
              onTranscript(finalTranscript); // 处理最终文本
            }, SILENCE_THRESHOLD);
          }
        } else if (latestResult.isFinal && !transcript.trim()) {
            // logger.info('收到空的最终片段');
            // 如果需要，也可以在这里清除静默计时器
        }
      };

      recognition.current.onstart = () => {
        logger.info('识别服务已启动 (onstart)');
        isRecognitionActive.current = true;
        setIsListening(true);
      };

      recognition.current.onend = () => {
        logger.info('识别服务已结束 (onend)');
        isRecognitionActive.current = false;
        setIsListening(false); // 更新UI状态
        
        // 如果 onend 是由 maxRecognitionTimeout 之外的原因触发的，
        // 确保 maxRecognitionTimeoutId 被清除。
        // (stopListening 和 MAX_RECOGNITION_TIME 的回调已处理此情况)
        if (maxRecognitionTimeoutId.current) {
            clearTimeout(maxRecognitionTimeoutId.current);
            maxRecognitionTimeoutId.current = null;
        }
        // 静默计时器通常由其自身触发或 stopListening 清除。
        // 如果 onend 意外发生且静默计时器仍挂起，可能也需要清除，
        // 但 stopListening 应为主要处理者。

        if (shouldContinue.current) {
          logger.info('识别结束，因 shouldContinue=true 尝试重启');
          // 短暂延迟后重启，给浏览器一些喘息时间
          setTimeout(() => {
            // 在尝试重启前再次检查 shouldContinue 和 recognition 实例
            if (shouldContinue.current && recognition.current) {
                try {
                    // 如果需要，重新应用配置，或确保它们持久存在
                    recognition.current.lang = language; 
                    recognition.current.start();
                } catch (e) {
                    logger.error('在 onend 中重启识别时出错:', e);
                    isRecognitionActive.current = false; // 确保状态正确
                    setIsListening(false);
                    shouldContinue.current = false; // 阻止进一步的循环
                }
            } else {
                logger.info('重启被中止，因为 shouldContinue 已变为 false 或 recognition 实例不存在');
            }
          }, 100); 
        } else {
          logger.info('识别结束，且 shouldContinue 为 false，不重启');
        }
      };

      recognition.current.onerror = (event: any) => {
        logger.error('识别发生错误 (onerror):', event.error);
        // 常见错误: 'no-speech', 'network', 'audio-capture', 'not-allowed', 'aborted', 'service-not-allowed'
        isRecognitionActive.current = false;
        setIsListening(false);
        shouldContinue.current = false; // 发生错误后停止尝试
        clearAllTimeouts(); // 清理计时器
        
        // 可选: 调用 onTranscript 并附带错误信号或空字符串
        // onTranscript(''); 
        // 或者根据错误类型决定是否通知用户
        if (event.error !== 'aborted') { // 'aborted' 通常是主动停止，可能不需要视为错误回调
            // onTranscript(`错误: ${event.error}`);
        }
      };

      // 可选: 更详细的事件日志，用于调试
      // recognition.current.onspeechend = () => logger.info('语音结束事件 (onspeechend)');
      // recognition.current.onsoundend = () => logger.info('声音结束事件 (onsoundend)');
      // recognition.current.onaudioend = () => logger.info('音频结束事件 (onaudioend)');
      
      recognition.current.start(); // 启动识别

    } catch (error) {
      logger.error('启动识别时捕获到错误:', error);
      isRecognitionActive.current = false;
      setIsListening(false);
      shouldContinue.current = false;
      clearAllTimeouts();
    }
  }, [language, onTranscript, stopListening, clearAllTimeouts]); // 依赖项

  return {
    isListening,
    startListening,
    stopListening,
  };
};


