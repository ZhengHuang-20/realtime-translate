'use client';
// app/page.tsx

import { useState } from 'react';
import { LanguageSelector } from '@/components/translation/LanguageSelector';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { TranslationResult } from '@/components/translation/TranslationResult';
// import { speakText } from '@/lib/translation/textToSpeech';
import { logger } from '@/lib/utils/logger';



// 添加导出功能的工具函数
const exportTranslations = (translations: Array<{ sourceText: string; translatedText: string }>) => {
  const content = translations.map(t => 
    `原文：${t.sourceText}\n译文：${t.translatedText}\n\n`
  ).join('');
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `translations-${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState('zh-CN');
  const [targetLanguage, setTargetLanguage] = useState('en-US');
  // 修改状态管理，使用数组存储所有的翻译记录
  const [translations, setTranslations] = useState<Array<{
    sourceText: string;
    translatedText: string;
  }>>([]);
  const [currentSourceText, setCurrentSourceText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // 处理语音识别结果
  const handleTranscript = async (text: string) => {
    if (!text.trim()) return;
    setCurrentSourceText(text);
    
    try {
      // 先使用Gemini校正识别文本
      const correctionResponse = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!correctionResponse.ok) {
        throw new Error('文本校正失败');
      }
      
      const { correctedText } = await correctionResponse.json();
      logger.info('Text corrected by Gemini', { 
        original: text, 
        corrected: correctedText 
      });
      
      // 使用校正后的文本进行翻译
      await handleTranslation(correctedText);
    } catch (error) {
      logger.error('Text correction error', {
        error: error instanceof Error ? error.message : error,
        text
      });
      // 如果校正失败，仍使用原始文本进行翻译
      await handleTranslation(text);
    }
  };

  // 处理翻译
  const handleTranslation = async (text: string, shouldSpeak = true) => {
    if (isTranslating) return;
    try {
      logger.info('Starting translation', { text });
      setIsTranslating(true);

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const { translation } = await response.json();
      logger.info('Translation received', { translation });
      
      // 修改这里，只将新翻译添加到数组的开头
      setTranslations(prev => [{
        sourceText: text,
        translatedText: translation
      }, ...prev]);

      // 使用 Web Speech API 进行文本朗读
      if (shouldSpeak && window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance(translation);
          utterance.lang = targetLanguage;
          window.speechSynthesis.speak(utterance);
          logger.info('Speaking text using browser synthesis', { targetLanguage });
        } catch (speechError) {
          logger.error('Browser speech synthesis failed', {
            error: speechError instanceof Error ? speechError.message : speechError
          });
        }
      }
      
      setCurrentSourceText('');
    } catch (error) {
      logger.error('Translation error', {
        error: error instanceof Error ? error.message : error,
        text,
        targetLanguage
      });
    } finally {
      setIsTranslating(false);
      logger.info('Translation process completed');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Real-time Speech Translator
        </h1>
        
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧操作区域 */}
          <div className="col-span-7">
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
              />
            </div>
          </div>

          {/* 右侧翻译记录区域 */}
          <div className="col-span-5">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">翻译记录</h2>
                {translations.length > 0 && (
                  <button
                    onClick={() => exportTranslations(translations)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    导出记录
                  </button>
                )}
              </div>
              <TranslationResult
                sourceText={currentSourceText}
                translatedText=""
                translations={translations}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
