import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";
export declare class SpeechRecognition implements SpeechRecognitionApi {
    private onPermissionGranted;
    private onPermissionRejected;
    private recognizer;
    constructor();
    available(): Promise<boolean>;
    startListening(options: SpeechRecognitionOptions): Promise<boolean>;
    stopListening(): Promise<any>;
    private wasPermissionGranted();
    private requestPermission(onPermissionGranted, reject);
}
