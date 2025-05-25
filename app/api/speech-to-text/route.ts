// [你的 app/api/speech-to-text/route.ts 文件]

import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient, protos } from '@google-cloud/speech';
import { logger } from '@/lib/utils/logger';

const gcpCredentialsBase64 = process.env.GCP_CREDENTIALS_BASE64; // 确保这个和你的环境变量名一致

if (!gcpCredentialsBase64) {
  logger.error('GCP_CREDENTIALS_BASE64 environment variable is not set.');
  throw new Error('GCP_CREDENTIALS_BASE64 environment variable is not set.');
}

let speechClient: SpeechClient | null = null;

try {
  const decodedCredentials = Buffer.from(gcpCredentialsBase64, 'base64').toString('utf-8');
  const credentials = JSON.parse(decodedCredentials);
  if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
    logger.error('Parsed credentials object is missing required fields. Check GCP_CREDENTIALS_BASE64.');
    throw new Error('Parsed credentials object is malformed or missing required fields.');
  }
  speechClient = new SpeechClient({ credentials });
  logger.info('Google Cloud Speech client initialized successfully.');
} catch (error: any) {
  logger.error('Failed to initialize Google Cloud Speech client. Error details:', {
    message: error.message,
    stack: error.stack,
    gcpCredentialsBase64Preview: gcpCredentialsBase64 ? gcpCredentialsBase64.substring(0, 50) + '...' : 'not set',
  });
}

export async function POST(req: NextRequest) {
  if (!speechClient) {
    logger.error('Speech client is not initialized. Check server logs for initialization errors.');
    return NextResponse.json(
      {
        error: '语音识别服务初始化失败',
        details: 'Speech client not available. Check GCP_CREDENTIALS_BASE64 and server startup logs.',
      },
      { status: 503 }
    );
  }

  try {
    const { audioData, language } = await req.json(); // 客户端现在应该只传这两个

    if (!audioData || typeof audioData !== 'string') {
      return NextResponse.json({ error: '无效的音频数据，应为 Base64 字符串' }, { status: 400 });
    }

    const recognitionConfig: protos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000,      // <--- 修改点1：显式设置采样率，与旧代码一致
      languageCode: language || 'zh-CN',
      // alternativeLanguageCodes: ['en-US'], // 如果需要，可以加回来
      model: 'default',            // <--- 修改点2：使用 'default' 模型，与旧代码一致
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
    };

    const requestPayload: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: {
        content: audioData,
      },
      config: recognitionConfig,
    };

    logger.info('Sending request to Google Speech API with config:', {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding[recognitionConfig.encoding as number], // 显示名称
      languageCode: recognitionConfig.languageCode,
      model: recognitionConfig.model,
      sampleRateHertz: recognitionConfig.sampleRateHertz,
      audio_content_length: audioData.length
    });

    const [response] = await speechClient.recognize(requestPayload);
    logger.info('Google Speech API Response:', JSON.stringify(response, null, 2));

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join('\n');
      logger.info(`Transcription successful: "${transcription.substring(0, 50)}..."`);
      return NextResponse.json({ transcript: transcription || '' });
    } else {
      logger.info('Google API returned no transcription results. Response:', response);
      return NextResponse.json({
        transcript: '',
        warning: '未识别到文本',
        details: 'API returned an empty result set.'
      });
    }

  } catch (error: any) {
    // ... (你之前的 catch 块错误处理逻辑保持不变) ...
    logger.error('Speech recognition error in POST handler:', error);
    let errorMessage = '语音识别失败';
    let errorDetails = '未知错误';
    let statusCode = 500;
    let googleApiError = null;

    if (error.code && typeof error.code === 'number') {
      errorDetails = `Google API Error Code ${error.code}: ${error.details || error.message}`;
      googleApiError = { code: error.code, details: error.details, metadata: error.metadata };
      switch (error.code) {
        case 3:
          errorMessage = '请求参数无效'; statusCode = 400; break;
        case 7:
          errorMessage = '权限不足或计费未启用'; statusCode = 403;
          errorDetails = `Permission denied or billing not enabled. Ensure the service account has 'Cloud Speech-to-Text API User' role and project billing is enabled. Original error: ${error.details || error.message}`;
          break;
        case 8: errorMessage = '资源耗尽或超出配额'; statusCode = 429; break;
        case 13: errorMessage = '语音服务内部错误'; statusCode = 503; break;
        default: statusCode = 500;
      }
    } else if (error instanceof Error) {
      errorDetails = error.message;
    }
    logger.error('Full error object for speech recognition failure:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return NextResponse.json(
      { error: errorMessage, details: errorDetails, googleApiError, },
      { status: statusCode }
    );
  }
}