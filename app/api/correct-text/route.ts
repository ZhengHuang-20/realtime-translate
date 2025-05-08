import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '无效的文本输入' },
        { status: 400 }
      );
    }

    // 使用Gemini模型
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // 构建提示词
    const prompt = `
    你是一个语音识别校正专家。下面是浏览器语音识别的结果，可能存在一些错误。
    请校正这段文本，使其更准确地反映原始语音内容。只返回校正后的文本，不要添加任何解释或额外内容。
    
    原始识别文本: "${text}"
    `;
    
    // 获取Gemini的响应
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const correctedText = response.text().trim();
    
    return NextResponse.json({ correctedText });
  } catch (error) {
    console.error('文本校正错误:', error);
    return NextResponse.json(
      { error: '文本校正失败' },
      { status: 500 }
    );
  }
}