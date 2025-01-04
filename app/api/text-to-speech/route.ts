import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleAuth } from 'google-auth-library';
import base64js from 'base64-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

const deleteOldFiles = async (dir: string, maxAge: number) => {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      const fileAge = Date.now() - stat.mtimeMs;
      if (fileAge > maxAge) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error deleting old files:', error);
  }
};



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
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    await deleteOldFiles(audioDir, 60000);
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
    const filename = `${uuidv4()}.mp3`;
    try {
      await fs.access(audioDir);
    } catch (error) {
      await fs.mkdir(audioDir, { recursive: true });
    }
    const filePath = path.join(audioDir, filename);
    await fs.writeFile(filePath, Buffer.from(response.audioContent));

    const audioUrl = `/audio/${filename}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}
