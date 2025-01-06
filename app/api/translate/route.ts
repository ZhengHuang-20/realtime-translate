// app/api/translate/route.ts
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
if (!GOOGLE_AI_KEY) {
  throw new Error('Missing GOOGLE_AI_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = '';
    if (targetLanguage === 'en-US') {
      prompt = `You are a translator. Translate this Chinese text to English: "${text}"
Rules:
1. Only provide the direct translation
2. No explanations or alternatives
3. No "Or:" or parentheses
4. No additional context or notes`;
    } else if (targetLanguage === 'zh-CN') {
      prompt = `You are a translator. Translate this English text to Chinese: "${text}"
Rules:
1. Only provide the direct translation
2. No explanations or alternatives
3. No "Or:" or parentheses
4. No additional context or notes`;
    } else if (targetLanguage === 'ms-MY') {
      prompt = `You are a translator. Translate this text to Malay: "${text}"
Rules:
1. Only provide the direct translation
2. No explanations or alternatives
3. No "Or:" or parentheses
4. No additional context or notes`;
    }

    const result = await model.generateContent(prompt);
    let translation = result.response.text().trim();

    // 清理输出
    translation = translation
      .replace(/^["'\s]+|["'\s]+$/g, '') // 移除首尾引号和空白
      .replace(/\(.*?\)/g, '') // 移除括号内容
      .replace(/Or:.*$/g, '') // 移除 "Or:" 及其后面的内容
      .replace(/\n/g, '') // 移除换行
      .trim();

    return new Response(
      JSON.stringify({ translation }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Translation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Translation failed',
        details: (error instanceof Error) ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}