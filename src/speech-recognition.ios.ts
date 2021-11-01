import { Device, File } from "@nativescript/core";
import { SpeechRecognitionApi, SpeechRecognitionOptions } from "./speech-recognition.common";

export class SpeechRecognition implements SpeechRecognitionApi {

    private recognitionRequest: SFSpeechAudioBufferRecognitionRequest = null;
    private urlRecognitionRequest: SFSpeechURLRecognitionRequest = null;
    private audioEngine: AVAudioEngine = null;
    private speechRecognizer: SFSpeechRecognizer = null;
    private recognitionTask: SFSpeechRecognitionTask = null;
    private recognitionTaskFromFile: SFSpeechRecognitionTask = null;
    private inputNode: AVAudioInputNode = null;
    private audioSession: AVAudioSession = null;

    constructor() {
        this.audioEngine = AVAudioEngine.new();
    }

    available(): Promise<boolean> {
        return new Promise((resolve, reject) => {
        resolve(parseInt(Device.osVersion) >= 10);
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
        if (options.fromFile) {
            return this.record(options);
        }
        return this.listen(options);
    }

    listen(options: SpeechRecognitionOptions): Promise<boolean>  {
        return new Promise((resolve, reject) => {
            const locale = NSLocale.alloc().initWithLocaleIdentifier(options.locale ? options.locale : Device.language);
            this.speechRecognizer = SFSpeechRecognizer.alloc().initWithLocale(locale);

            if (this.recognitionTask !== null) {
            this.recognitionTask.cancel();
            this.recognitionTask = null;
            }

            SFSpeechRecognizer.requestAuthorization((status: SFSpeechRecognizerAuthorizationStatus) => {
            if (status !== SFSpeechRecognizerAuthorizationStatus.Authorized) {
                options.onError && options.onError("Not authorized");
                reject("Not authorized");
                return;
            }

            this.audioSession = AVAudioSession.sharedInstance();
            this.audioSession.setCategoryError(AVAudioSessionCategoryRecord);
            this.audioSession.setModeError(AVAudioSessionModeMeasurement);
            this.audioSession.setActiveWithOptionsError(true, AVAudioSessionSetActiveOptions.NotifyOthersOnDeactivation);

            this.recognitionRequest = SFSpeechAudioBufferRecognitionRequest.new();
            if (!this.recognitionRequest) {
                options.onError && options.onError("Unable to create an SFSpeechAudioBufferRecognitionRequest object");
                reject("Unable to create an SFSpeechAudioBufferRecognitionRequest object");
                return;
            }

            this.inputNode = this.audioEngine.inputNode;
            if (!this.inputNode) {
                options.onError && options.onError("Audio engine has no input node");
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
                        options.onError && options.onError(error.localizedDescription);
                        // no need to 'reject' as the promise has been resolved by now anyway
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

    record(options: SpeechRecognitionOptions): Promise<boolean>  {
        return new Promise((resolve, reject) => {
            let exists = File.exists(options.path);

            if (!options.path || !exists) {
                reject("You should set a file path!");
                return;
            }

            SFSpeechRecognizer.requestAuthorization((status: SFSpeechRecognizerAuthorizationStatus) => {
                if (status !== SFSpeechRecognizerAuthorizationStatus.Authorized) {
                    options.onError && options.onError("Not authorized");
                    reject("Not authorized");
                    return;
                }

                this.speechRecognizer =  SFSpeechRecognizer.alloc().initWithLocale(NSLocale.alloc().initWithLocaleIdentifier(options.locale));
                if (!this.speechRecognizer) {
                    reject("Local not allowed!");
                    return;
                }

                this.urlRecognitionRequest = SFSpeechURLRecognitionRequest.alloc().initWithURL(NSURL.alloc().initFileURLWithPath(options.path));
                this.urlRecognitionRequest.shouldReportPartialResults = options.returnPartialResults;

                this.recognitionTaskFromFile = this.speechRecognizer.recognitionTaskWithRequestResultHandler(
                    this.urlRecognitionRequest, (result: SFSpeechRecognitionResult, error: NSError) => {
                    if (error !== null || (result !== null && result.final)) {
                        this.urlRecognitionRequest = null;
                        this.recognitionRequest = null;
                        this.recognitionTask = null;
                    }

                    // console.log(`FETCHING RESULT :: ${result.bestTranscription.formattedString}`)
                    if (result !== null) {
                        options.onResult({
                            finished: result.final,
                            text: result.bestTranscription.formattedString
                        });
                    }
                });

                // this.recognitionTaskFromFile = this.speechRecognizer.recognitionTaskWithRequestDelegate(this.urlRecognitionRequest, this.speechRecognizer.delegate);
                // 0 = Starting
                resolve(this.recognitionTaskFromFile.state === 0);
            });
        });
    }

    stopListening(): Promise<any> {
        return new Promise((resolve, reject) => {

            console.log("state " + this.recognitionTaskFromFile.state );
            if (this.recognitionTaskFromFile && this.recognitionTaskFromFile.state < 3) {
                this.recognitionTaskFromFile.cancel();
                this.recognitionTaskFromFile = null;
                this.recognitionTask = null;
                this.recognitionTask = null;
                resolve(true);
            }

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
            resolve(true);
        });
    }
}
