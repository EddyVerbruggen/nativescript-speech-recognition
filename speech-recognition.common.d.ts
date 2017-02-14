export interface SpeechRecognitionTranscription {
    text: string;
    finished: boolean;
}
export interface SpeechRecognitionOptions {
    locale?: string;
    returnPartialResults?: boolean;
    onResult: (transcription: SpeechRecognitionTranscription) => void;
}
export interface SpeechRecognitionApi {
    available(): Promise<boolean>;
    startListening(options: SpeechRecognitionOptions): Promise<boolean>;
    stopListening(): Promise<any>;
}
