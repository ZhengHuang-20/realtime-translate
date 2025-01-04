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
    return result.response.text();
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
}

// app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translation/gemini';

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const translation = await translateText(text, targetLanguage);
    
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