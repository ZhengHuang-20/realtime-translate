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