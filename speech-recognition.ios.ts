import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";

export class SpeechRecognition implements SpeechRecognitionApi {

  private recognitionRequest: SFSpeechAudioBufferRecognitionRequest = null;
  private audioEngine: AVAudioEngine = null;
  private speechRecognizer: SFSpeechRecognizer = null;
  private recognitionTask: SFSpeechRecognitionTask = null;
  private inputNode: AVAudioInputNode = null;
  private audioSession: AVAudioSession = null;

  constructor() {
    this.audioEngine = AVAudioEngine.new();
  }

  available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(SFSpeechRecognizer.new().available);
    });
  }

  requestPermission(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      SFSpeechRecognizer.requestAuthorization((status: SFSpeechRecognizerAuthorizationStatus) => {
        if (status !== SFSpeechRecognizerAuthorizationStatus.Authorized) {
          resolve(false);
          return;
        }
        AVAudioSession.sharedInstance().requestRecordPermission((granted: boolean) => {
          resolve(granted);
        });
      });
    });
  }

  startListening(options: SpeechRecognitionOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (options.locale) {
        let locale = NSLocale.alloc().initWithLocaleIdentifier(options.locale);
        this.speechRecognizer = SFSpeechRecognizer.alloc().initWithLocale(locale);
      } else {
        this.speechRecognizer = SFSpeechRecognizer.new();
      }

      if (this.recognitionTask !== null) {
        this.recognitionTask.cancel();
        this.recognitionTask = null;
      }

      // might as well not set this delegate
      // this.speechRecognizer.delegate = SFSpeechRecognizerDelegateImpl.new().initWithCallback((available: boolean) => {
      //   console.log("************ Availability changed to: " + available);
      // });

      SFSpeechRecognizer.requestAuthorization((status: SFSpeechRecognizerAuthorizationStatus) => {
        if (status !== SFSpeechRecognizerAuthorizationStatus.Authorized) {
          reject("Not authorized");
          return;
        }

        this.audioSession = AVAudioSession.sharedInstance();
        this.audioSession.setCategoryError(AVAudioSessionCategoryRecord);
        this.audioSession.setModeError(AVAudioSessionModeMeasurement);
        this.audioSession.setActiveWithOptionsError(true, AVAudioSessionSetActiveOptions.NotifyOthersOnDeactivation);

        this.recognitionRequest = SFSpeechAudioBufferRecognitionRequest.new();
        if (!this.recognitionRequest) {
          reject("Unable to create an SFSpeechAudioBufferRecognitionRequest object");
          return;
        }

        this.inputNode = this.audioEngine.inputNode;
        if (!this.inputNode) {
          reject("Audio engine has no input node");
          return;
        }

        this.recognitionRequest.shouldReportPartialResults = options.returnPartialResults;

        this.recognitionTask = this.speechRecognizer.recognitionTaskWithRequestResultHandler(
            this.recognitionRequest,
            (result: SFSpeechRecognitionResult, error: NSError) => {
              if (result !== null) {
                options.onResult({
                  finished: result.final,
                  text: result.bestTranscription.formattedString
                });
              }

              if (error !== null || (result !== null && result.final)) {
                this.audioEngine.stop();
                this.inputNode.removeTapOnBus(0);
                this.audioSession.setCategoryError(AVAudioSessionCategoryPlayback);
                this.audioSession.setModeError(AVAudioSessionModeDefault);
                this.recognitionRequest = null;
                this.recognitionTask = null;
              }

              if (error !== null) {
                console.log("error in handler: " + error.localizedDescription);
              }
            });

        let that = this;

        let recordingFormat = this.inputNode.outputFormatForBus(0);
        this.inputNode.installTapOnBusBufferSizeFormatBlock(0, 1024, recordingFormat, (buffer: AVAudioPCMBuffer, when: AVAudioTime) => {
          that.recognitionRequest.appendAudioPCMBuffer(buffer);
        });

        this.audioEngine.prepare();
        resolve(this.audioEngine.startAndReturnError());
      });
    });
  }

  stopListening(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.audioEngine.running) {
        reject("Not running");
        return;
      }

      this.audioEngine.stop();
      this.recognitionRequest.endAudio();
      this.audioSession.setCategoryError(AVAudioSessionCategoryPlayback);
      this.audioSession.setModeError(AVAudioSessionModeDefault);
      this.speechRecognizer = null;
      this.recognitionTask = null;
      resolve();
    });
  }
}

/*
class SFSpeechRecognizerDelegateImpl extends NSObject implements SFSpeechRecognizerDelegate {
  public static ObjCProtocols = [SFSpeechRecognizerDelegate];

  static new(): SFSpeechRecognizerDelegateImpl {
    return <SFSpeechRecognizerDelegateImpl>super.new();
  }

  private _callback: (available: boolean) => void;

  public initWithCallback(callback: (available: boolean) => void): SFSpeechRecognizerDelegateImpl {
    this._callback = callback;
    return this;
  }

  public speechRecognizerAvailabilityDidChange(speechRecognizer: SFSpeechRecognizer, available: boolean): void {
    if (this._callback) {
      this._callback(available);
    } else {
      console.trace();
      console.log("--- callback lost");
    }
  }
}
*/