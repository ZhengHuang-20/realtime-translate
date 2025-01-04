// components/translation/LanguageSelector.tsx
import { SUPPORTED_LANGUAGES } from '@/lib/utils/constants';
import type { Language } from '@/lib/utils/types';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function LanguageSelector({ value, onChange, label }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {SUPPORTED_LANGUAGES.map((language: Language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// components/audio/AudioRecorder.tsx
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface AudioRecorderProps {
  sourceLanguage: string;
  onTranscript: (text: string) => void;
}

export function AudioRecorder({ sourceLanguage, onTranscript }: AudioRecorderProps) {
  const { state, startRecording, stopRecording } = useAudioRecorder();
  const { isListening, startListening, stopListening } = useSpeechRecognition(
    sourceLanguage,
    onTranscript
  );

  const handleToggleRecording = async () => {
    if (state.isRecording) {
      stopRecording();
      stopListening();
    } else {
      await startRecording();
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleToggleRecording}
        className={`rounded-full p-6 ${
          state.isRecording ? 'bg-red-500' : 'bg-blue-500'
        } text-white shadow-lg hover:opacity-90 transition-opacity`}
      >
        {state.isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {state.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
    </div>
  );
}

// components/translation/TranslationResult.tsx
interface TranslationResultProps {
  sourceText: string;
  translatedText: string;
  isLoading?: boolean;
}

export function TranslationResult({
  sourceText,
  translatedText,
  isLoading = false,
}: TranslationResultProps) {
  return (
    <div className="space-y-4 w-full">
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-700 mb-2">Original Text:</h3>
        <p className="text-gray-900">{sourceText || 'Start speaking...'}</p>
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-700 mb-2">Translation:</h3>
        {isLoading ? (
          <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4" />
        ) : (
          <p className="text-gray-900">{translatedText || 'Translation will appear here...'}</p>
        )}
      </div>
    </div>
  );
}

// components/audio/VolumeVisualizer.tsx
import { useRef, useEffect } from 'react';

interface VolumeVisualizerProps {
  stream: MediaStream | null;
}

export function VolumeVisualizer({ stream }: VolumeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    if (!stream || !canvasRef.current) return;
    
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    function draw() {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        ctx.fillStyle = `rgb(50, 50, ${barHeight + 100})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    }
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [stream]);
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={50}
      className="border rounded-lg"
    />
  );
}