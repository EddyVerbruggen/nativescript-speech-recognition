import { Observable, isAndroid, Folder, knownFolders, path } from "@nativescript/core";
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

  public startListeningFromFile(): void {
    let audio = "../audio/alex.mp3";
    const appPath: Folder = <Folder>knownFolders.currentApp();
    const folder: Folder = <Folder>appPath.getFolder(path.join("audio"));
    const file: string = folder.getFile(audio).path;
    this.startListening("en-US", true, file);
  }

  public startListeningNL(): void {
    this.startListening("nl-NL");
  }

  public startListeningEN(): void {
    this.startListening("en-US");
  }

  /**
   * local: is the local like en-US
   * fromFile: if set to true you will need to provide a `path` for the audio file
   * path: the file path
   */
  public startListening(locale?: string, fromFile: boolean = false, path?: string): void {

    this.speechRecognition.available().then((avail: boolean) => {
      if (!avail) {
        this.set("feedback", "speech recognition not available");
        return;
      }
      this.speechRecognition.startListening(
          {
            returnPartialResults: true,
            locale: locale,
            fromFile: fromFile,
            path: path,
            onResult: (transcription: SpeechRecognitionTranscription) => {
              this.set("feedback", transcription.text);
              if (transcription.finished) {
                this.set("listening", false);
              }
            },
            onError: (error: string | number) => {
              console.log(">>>> error: " + error);
              // because of the way iOS and Android differ, this is either:
              // - iOS: A 'string', describing the issue.
              // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
              //            If this code is either 6 or 7 you may want to restart listening.
              if (isAndroid && error === 6 /* timeout */) {
                // this.startListening(locale);
              }
            }
          }
      ).then((started: boolean) => {
        this.set("listening", true);
      }).catch((error: string | number) => {
        console.log(`Error while trying to start listening: ${error}`);
      });
    });
  }

  public stopListening(): void {
    this.speechRecognition.stopListening().then(() => {
      this.set("listening", false);
    }, (errorMessage: string) => {
      console.log(`Error while trying to stop listening: ${errorMessage}`);
    });
  }

  public requestPermission(): void {
    this.speechRecognition.requestPermission().then((granted: boolean) => {
      console.log("Granted? " + granted);
    });
  }
}
