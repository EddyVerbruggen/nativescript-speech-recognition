export interface SpeechRecognitionTranscription {
  text: string;
  finished: boolean;
  // confidence: number; // TODO some day
}

export interface SpeechRecognitionOptions {
  /**
   * Example: "nl-NL".
   * Default: the system locale.
   */
  locale?: string;

  /**
   * Set to true to get results back continuously.
   */
  returnPartialResults?: boolean;

  /**
   * The callback function invoked when speech is recognized.
   * @param transcription
   */
  onResult: (transcription: SpeechRecognitionTranscription) => void;
}

export interface SpeechRecognitionApi {
  available(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  startListening(options: SpeechRecognitionOptions): Promise<boolean>;
  stopListening(): Promise<any>;
}