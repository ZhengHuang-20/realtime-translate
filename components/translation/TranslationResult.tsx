import { useEffect, useRef } from 'react';

interface TranslationResultProps {
  sourceText: string;
  translatedText: string;
  translations: Array<{
    sourceText: string;
    translatedText: string;
  }>;
}

export function TranslationResult({ sourceText, translatedText, translations }: TranslationResultProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新的翻译
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [translations]);

  return (
    <div 
      ref={scrollRef}
      className="h-[calc(100vh-300px)] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
    >
      {/* 当前识别的文本 */}
      {sourceText && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-pulse">
          <p className="text-gray-600">{sourceText}</p>
        </div>
      )}

      {/* 历史翻译记录 */}
      {translations.map((item, index) => (
        <div 
          key={index} 
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <p className="text-gray-700 mb-2 text-sm">
            <span className="text-gray-500">原文：</span>
            {item.sourceText}
          </p>
          <p className="text-blue-600">
            <span className="text-gray-500 text-sm">译文：</span>
            {item.translatedText}
          </p>
        </div>
      ))}
    </div>
  );
}