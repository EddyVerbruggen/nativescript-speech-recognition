import { Observable, isAndroid } from "@nativescript/core";
import { SpeechRecognition, SpeechRecognitionTranscription } from "nativescript-speech-recognition";

export class HelloWorldModel extends Observable {

  private speechRecognition: SpeechRecognition;
  public feedback: string = "pick a language and say something..";
  public listening: boolean = false;

  constructor() {
    super();
    this.speechRecognition = new SpeechRecognition();

    // Testing manual persmission. You don't need to do this.
    setTimeout(() => this.requestPermission(), 1500);
  }

  public startListeningDefault(): void {
    this.startListening();
  }

  public startListeningNL(): void {
    this.startListening("nl-NL");
  }

  public startListeningEN(): void {
    this.startListening("en-US");
  }

  public startListeningContinuously(): void {
    this.startListening(undefined, true);
  }

  public startListening(locale?: string, listenContinuously?: boolean): void {
    let that = this; // TODO remove 'that'

    this.speechRecognition.available().then((avail: boolean) => {
      if (!avail) {
        that.set("feedback", "speech recognition not available");
        return;
      }
      that.speechRecognition.startListening(
          {
            returnPartialResults: true,
            locale: locale,
            listenContinuously: listenContinuously,
            onResult: (transcription: SpeechRecognitionTranscription) => {
              that.set("feedback", transcription.text);
              if (transcription.finished && !listenContinuously) {
                that.set("listening", false);
              }
            },
            onError: (error: string | number) => {
              console.log(">>>> error: " + error);
              // because of the way iOS and Android differ, this is either:
              // - iOS: A 'string', describing the issue.
              // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
            }
          }
      ).then((started: boolean) => {
        that.set("listening", true);
      }).catch((error: string | number) => {
        console.log(`Error while trying to start listening: ${error}`);
      });
    });
  }

  public stopListening(): void {
    let that = this;
    this.speechRecognition.stopListening().then(() => {
      that.set("listening", false);
    }, (errorMessage: string) => {
      console.log(`Error while trying to stop listening: ${errorMessage}`);
    });
  }

  public requestPermission(): void {
    let that = this;
    this.speechRecognition.requestPermission().then((granted: boolean) => {
      console.log("Granted? " + granted);
    });
  }
}
