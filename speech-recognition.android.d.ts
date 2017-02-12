import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";
export declare class SpeechRecognition implements SpeechRecognitionApi {
    available(): Promise<boolean>;
    startListening(options: SpeechRecognitionOptions): Promise<boolean>;
    stopListening(): Promise<any>;
}
