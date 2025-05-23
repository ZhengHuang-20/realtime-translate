// components/audio/AudioRecorder.tsx
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AudioRecorderProps } from '@/lib/utils/types';

export function AudioRecorder({ sourceLanguage, onTranscript }: AudioRecorderProps) {
  const { state, startRecording, stopRecording } = useAudioRecorder();
  const { isListening, startListening, stopListening } = useSpeechRecognition(
    sourceLanguage,
    async (text) => {
      await onTranscript(text);
      startListening();
    }
  );

  const handleToggleRecording = async () => {
    if (state.isRecording) {
      stopRecording();
      await stopListening();
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
