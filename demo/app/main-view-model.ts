import { Observable } from "data/observable";
import { SpeechRecognition, SpeechRecognitionTranscription } from "nativescript-speech-recognition";

export class HelloWorldModel extends Observable {

  private speechRecognition: SpeechRecognition;
  public feedback: string = "pick a language and say something..";
  public listening: boolean = false;

  constructor() {
    super();
    this.speechRecognition = new SpeechRecognition();
  }

  public startListeningNL(): void {
    this.startListening("nl-NL");
  }

  public startListeningEN(): void {
    this.startListening("en-US");
  }

  public startListening(locale: string): void {
    let that = this;

    this.speechRecognition.available().then((avail: boolean) => {
      if (!avail) {
        that.set("feedback", "speech recognition not available");
        return;
      }
      that.speechRecognition.startListening(
          {
            onResult: (transcription: SpeechRecognitionTranscription) => {
              that.set("feedback", transcription.text);
              if (transcription.finished) {
                that.set("listening", false);
              }
            },
            returnPartialResults: true,
            locale: locale
          }
      ).then((started: boolean) => {
        that.set("listening", true);
      }, (errorMessage: string) => {
        console.log(`Error while trying to start listening: ${errorMessage}`);
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
}