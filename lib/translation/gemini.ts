// lib/translation/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;
    const result = await model.generateContent(prompt);
    let translation = result.response.text().trim();

    // 清理输出
    translation = translation
      .replace(/^["'\s]+|["'\s]+$/g, '') // 移除首尾引号和空白
      .replace(/\(.*?\)/g, '') // 移除括号内容
      .replace(/Or:.*$/g, '') // 移除 "Or:" 及其后面的内容
      .replace(/\n/g, '') // 移除换行
      .trim();

    return translation; // 确保返回清理后的翻译
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
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