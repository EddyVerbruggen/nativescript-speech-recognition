import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";
export declare class SpeechRecognition implements SpeechRecognitionApi {
    private recognitionRequest;
    private audioEngine;
    private speechRecognizer;
    private recognitionTask;
    private inputNode;
    private audioSession;
    constructor();
    available(): Promise<boolean>;
    startListening(options: SpeechRecognitionOptions): Promise<boolean>;
    stopListening(): Promise<any>;
}
