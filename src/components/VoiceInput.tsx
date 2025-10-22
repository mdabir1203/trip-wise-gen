import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useEffect } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceInput({ onTranscript, className }: VoiceInputProps) {
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, onTranscript, resetTranscript]);

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "secondary"}
      size="icon"
      className={`glass-button rounded-2xl ${className}`}
      onClick={isListening ? stopListening : startListening}
    >
      {isListening ? (
        <MicOff className="h-4 w-4 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
