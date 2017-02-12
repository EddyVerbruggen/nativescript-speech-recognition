import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";

export class SpeechRecognition implements SpeechRecognitionApi {
  available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      reject("not implemented yet");
    });
  };

  startListening(options: SpeechRecognitionOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      reject("not implemented yet");
    });
  }

  stopListening(): Promise<any> {
    return new Promise((resolve, reject) => {
      reject("not implemented yet");
    });
  }
}