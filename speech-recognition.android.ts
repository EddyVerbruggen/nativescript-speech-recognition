import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";
import * as application from "application";
import * as utils from "utils/utils";

declare let android: any;

export class SpeechRecognition implements SpeechRecognitionApi {

  private onPermissionGranted: Function;
  private onPermissionRejected: Function;
  private recognizer: android.speech.SpeechRecognizer = null;

  constructor() {
    let self = this;
    application.android.on(application.AndroidApplication.activityRequestPermissionsEvent, function (args: any) {
      for (let i = 0; i < args.permissions.length; i++) {
        if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
          if (self.onPermissionRejected) {
            self.onPermissionRejected("Please allow access to the Microphone and try again.");
          } else {
            console.log("Please allow access to the Microphone and try again. (tip: pass in a reject to receive this message in your app)");
          }
          return;
        }
      }
      if (self.onPermissionGranted) {
        self.onPermissionGranted();
      }
    });

    application.on(application.suspendEvent, (args: application.ApplicationEventData) => {
      if (this.recognizer !== null) {
        this.stopListening();
      }
    });
  }

  available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(android.speech.SpeechRecognizer.isRecognitionAvailable(application.android.context));
    });
  };

  startListening(options: SpeechRecognitionOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {

      let onPermissionGranted = () => {

        let loopHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        loopHandler.post(new java.lang.Runnable({
          run: () => {
            this.recognizer = android.speech.SpeechRecognizer.createSpeechRecognizer(application.android.context);
            this.recognizer.setRecognitionListener(new android.speech.RecognitionListener({
              /**
               * Called when the endpointer is ready for the user to start speaking.
               * @param params parameters set by the recognition service. Reserved for future use.
               */
              onReadyForSpeech(params: android.os.Bundle) {
                resolve(true);
              },

              /**
               * The user has started to speak.
               */
              onBeginningOfSpeech() {
              },

              /**
               * The sound level in the audio stream has changed. There is no guarantee that this method will be called.
               * @param rmsdB the new RMS dB value
               */
              onRmsChanged(rmsdB: number) {
              },

              /**
               * More sound has been received. The purpose of this function is to allow giving feedback to the user regarding the captured audio. There is no guarantee that this method will be called.
               * @param buffer a buffer containing a sequence of big-endian 16-bit integers representing a
               */
              onBufferReceived(buffer: native.Array<number>) {
              },

              /**
               * Called after the user stops speaking.
               */
              onEndOfSpeech() {
              },

              /**
               * A network or recognition error occurred.
               * @param error code is defined in {@link SpeechRecognizer}
               */
              onError(error: number) {
                console.log("Error: " + error);
                reject("Error code: " + error);
              },

              /**
               * Called when recognition results are ready.
               * @param results the recognition results. To retrieve the results in {@code
               */
              onResults(results: android.os.Bundle) {
                this.sendBackResults(results);
              },

              /**
               * Called when partial recognition results are available. The callback might be called at any time between #onBeginningOfSpeech() and #onResults(Bundle) when partial results are ready. This method may be called zero, one or multiple times for each call to SpeechRecognizer#startListening(Intent), depending on the speech recognition service implementation. To request partial results, use RecognizerIntent#EXTRA_PARTIAL_RESULTS
               * @param partialResults the returned results. To retrieve the results in
               */
              onPartialResults(partialResults: android.os.Bundle) {
                if (options.returnPartialResults) {
                  this.sendBackResults(partialResults);
                }
              },

              sendBackResults(results: android.os.Bundle) {
                let transcripts = results.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION);
                // let confidences = results.getFloatArray(android.speech.SpeechRecognizer.CONFIDENCE_SCORES);
                if (!transcripts.isEmpty()) {
                  // TODO return alternatives in a future version, as well as the confidence (can be done on iOS as well)
                  for (let i = 0; i < transcripts.size(); i++) {
                    let transcript = transcripts.get(i);
                  }
                  options.onResult({
                    text: transcripts.get(0), // the first one has the highest confidence
                    // confidence: confidences[0],
                    finished: true
                  })
                }
              },

              /**
               * Reserved for adding future events.
               * @param eventType the type of the occurred event
               * @param params a Bundle containing the passed parameters
               */

              onEvent(eventType: number, params: android.os.Bundle) {
              }
            }));
          }
        }));

        let intent = new android.content.Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL, android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_CALLING_PACKAGE, "voice.recognition.test");
        // if not set, the default will be used
        if (options.locale) {
          intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE, options.locale);
        }
        // to be able to receive partial results
        if (options.returnPartialResults) {
            intent.putExtra(android.speech.RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        }
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_MAX_RESULTS, 100);
        loopHandler.post(new java.lang.Runnable({
          run: () => {
            this.recognizer.startListening(intent);
            // resolve(true);
          }
        }));
      };

      if (!this.wasPermissionGranted()) {
        this.requestPermission(onPermissionGranted, reject);
        return;
      }

      onPermissionGranted();
    });
  }

  stopListening(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.recognizer === null) {
        reject("Not running");
        return;
      }

      let loopHandler = new android.os.Handler(android.os.Looper.getMainLooper());
      loopHandler.post(new java.lang.Runnable({
        run: () => {
          this.recognizer.stopListening();
          this.recognizer.cancel();
          this.recognizer.destroy();
          this.recognizer = null;
          resolve();
        }
      }));
    });
  }

  private wasPermissionGranted(): boolean {
    let hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
    if (!hasPermission) {
      hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
          android.support.v4.content.ContextCompat.checkSelfPermission(
              utils.ad.getApplicationContext(),
              android.Manifest.permission.RECORD_AUDIO);
    }
    return hasPermission;
  };

  private requestPermission(onPermissionGranted: Function, reject): void {
    this.onPermissionGranted = onPermissionGranted;
    this.onPermissionRejected = reject;
    android.support.v4.app.ActivityCompat.requestPermissions(
        application.android.foregroundActivity, // TODO application.android.context
        [android.Manifest.permission.RECORD_AUDIO],
        444 // irrelevant since we simply invoke onPermissionGranted
    );
  }
}
