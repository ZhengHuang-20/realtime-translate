// lib/translation/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { translationCache } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

const getTranslationPrompt = (text: string, targetLanguage: string): string => {
  const basePrompt = `You are a professional translator. Translate this text to ${targetLanguage}:
"${text}"

Rules:
1. Provide only the direct translation
2. Ensure natural, conversational language
3. No explanations or alternatives
4. No additional context or notes
5. Maintain the original tone and formality`;

  return basePrompt;
};

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  const cacheKey = `${text}:${targetLanguage}`;
  const cachedTranslation = translationCache.get(cacheKey);
  
  if (cachedTranslation) {
    logger.info('Translation cache hit', { text, targetLanguage });
    return cachedTranslation;
  }

  return await logger.withPerformanceLogging('translation', async () => {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = getTranslationPrompt(text, targetLanguage);
        const result = await model.generateContent(prompt);
        let translation = result.response.text().trim()
          .replace(/^["'\s]+|["'\s]+$/g, '')
          .replace(/\(.*?\)/g, '')
          .replace(/Or:.*$/g, '')
          .replace(/\n/g, '')
          .trim();

        translationCache.set(cacheKey, translation);
        return translation;
      } catch (error) {
        retries++;
        logger.error(`Translation error (attempt ${retries}/${maxRetries}):`, error);
        
        if (retries >= maxRetries) {
          throw new Error('Translation failed after multiple attempts');
        }
        
        // 指数退避策略
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
      }
    }
    
    throw new Error('Translation failed');
  });
}

// app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { translateText as geminiTranslateText } from '@/lib/translation/gemini';

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const translation = await geminiTranslateText(text, targetLanguage);
    
    return NextResponse.json({ translation });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}

// lib/translation/textToSpeech.ts
export function speakText(text: string, language: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);
    
    window.speechSynthesis.speak(utterance);
  });
}