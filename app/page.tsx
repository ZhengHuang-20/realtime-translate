'use client';
// app/page.tsx

import { useState, useRef } from 'react';
import { LanguageSelector } from '@/components/translation/LanguageSelector';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { TranslationResult } from '@/components/translation/TranslationResult';
import { speakText } from '@/lib/translation/textToSpeech';


export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState('zh-CN');
  const [targetLanguage, setTargetLanguage] = useState('en-US');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // 处理语音识别结果
  const handleTranscript = async (text: string) => {
    if (!text.trim()) return;
    setSourceText(text);
    await handleTranslation(text);
  };

  // 处理翻译
  const handleTranslation = async (text: string) => {
    try {
      setIsTranslating(true);
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage }),
      });
      
      if (!response.ok) throw new Error('Translation failed');
      
      const { translation } = await response.json();
      setTranslatedText(translation);
      
      // 播放翻译后的语音
      await speakText(translation, targetLanguage);

      // 清除源文本和识别内容
      setSourceText('');
      if (speechRecognitionRef.current?.clearTranscript) {
        speechRecognitionRef.current.clearTranscript();
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // 语音识别回调
  const onSpeechRecognition = (recognition: any) => {
    speechRecognitionRef.current = recognition;
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Real-time Speech Translator
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              label="Source Language"
            />
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              label="Target Language"
            />
          </div>
          
          <AudioRecorder
            sourceLanguage={sourceLanguage}
            onTranscript={handleTranscript}
            onRecognitionInit={onSpeechRecognition}
          />
          
          <TranslationResult
            sourceText={sourceText}
            translatedText={translatedText}
            isLoading={isTranslating}
          />
        </div>
      </div>
    </main>
  );
}