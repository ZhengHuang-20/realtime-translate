import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleAuth } from 'google-auth-library';
// import base64js from 'base64-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

if (!GOOGLE_AI_KEY) {
  throw new Error('GOOGLE_AI_KEY environment variable is not set.');
}

const auth = new GoogleAuth({
    apiKey: GOOGLE_AI_KEY,
});

const client = new TextToSpeechClient({
    auth,
});

export async function POST(req: NextRequest) {
  try {
    const audioDir = '/tmp';
    const { text, language } = await req.json();

    let voice;
    if (language === 'en-US') {
      voice = { languageCode: 'en-GB', name: 'en-GB-Standard-B' }; // Use British male voice
    } else if (language === 'zh-CN') {
      voice = { languageCode: 'zh-CN', name: 'zh-CN-Standard-B' }; // Use Chinese male voice
    } else if (language === 'ms-MY') {
      voice = { languageCode: 'ms-MY', name: 'ms-MY-Standard-B' }; // Use Malay male voice
    } else {
      voice = { languageCode: language };
    }

    const request = {
      input: { text: text },
      voice: voice,
      audioConfig: { audioEncoding: 'MP3' as 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    if (!response.audioContent) {
      return NextResponse.json({ error: 'Invalid audio content' }, { status: 400 });
    }

    return new NextResponse(response.audioContent, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}
