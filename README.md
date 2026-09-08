# NativeScript Speech Recognition

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-speech-recognition.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-speech-recognition
[npm-image]:http://img.shields.io/npm/v/nativescript-speech-recognition.svg
[npm-url]:https://npmjs.org/package/nativescript-speech-recognition
[downloads-image]:http://img.shields.io/npm/dm/nativescript-speech-recognition.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

This is the plugin [demo](https://github.com/EddyVerbruggen/nativescript-speech-recognition/tree/master/demo) in action..

| ..while recognizing Dutch 🇳🇱 | .. after recognizing American-English 🇺🇸 |
| --- | --- |
| <img src="https://github.com/EddyVerbruggen/nativescript-speech-recognition/raw/master/screenshots/ios-nl.jpg" width="375px" /> | <img src="https://github.com/EddyVerbruggen/nativescript-speech-recognition/raw/master/screenshots/ios-en.jpg" width="375px" /> |

## Installation
From the command prompt go to your app's root folder and execute:

### NativeScript 7+:
```bash
ns plugin add nativescript-speech-recognition
```

### NativeScript < 7:
```
tns plugin add nativescript-speech-recognition@1.5.0
```

## Testing
You'll need to test this on a real device as a Simulator/Emulator doesn't have speech recognition capabilities.

## API

### `available`

Depending on the OS version a speech engine may not be available.

#### JavaScript
```js
// require the plugin
var SpeechRecognition = require("nativescript-speech-recognition").SpeechRecognition;

// instantiate the plugin
var speechRecognition = new SpeechRecognition();

speechRecognition.available().then(
  function(available) {
    console.log(available ? "YES!" : "NO");
  }
);
```

#### TypeScript
```typescript
// import the plugin
import { SpeechRecognition } from "nativescript-speech-recognition";

class SomeClass {
  private speechRecognition = new SpeechRecognition();
  
  public checkAvailability(): void {
    this.speechRecognition.available().then(
      (available: boolean) => console.log(available ? "YES!" : "NO"),
      (err: string) => console.log(err)
    );
  }
}
```

### `requestPermission`
You can either let `startListening` handle permissions when needed, but if you want to have more control
over when the permission popups are shown, you can use this function:

```typescript
this.speechRecognition.requestPermission().then((granted: boolean) => {
  console.log("Granted? " + granted);
});
```

### `startListening`

On iOS this will trigger two prompts:

The first prompt requests to allow Apple to analyze the voice input. The user will see a consent screen which you can extend with your own message by adding a fragment like this to `app/App_Resources/iOS/Info.plist`:

```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>My custom recognition usage description. Overriding the default empty one in the plugin.</string>
```

The second prompt requests access to the microphone:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>My custom microphone usage description. Overriding the default empty one in the plugin.</string>
```

#### TypeScript
```typescript
// import the options
import { SpeechRecognitionTranscription } from "nativescript-speech-recognition";

this.speechRecognition.startListening(
  {
    // optional, uses the device locale by default
    locale: "en-US",
    // set to true to get results back continuously
    returnPartialResults: true,
    // set to true to keep listening after each speech utterance (Android only)
    // when enabled, the recognizer automatically restarts after recognition completes
    listenContinuously: false,
    // this callback will be invoked repeatedly during recognition
    onResult: (transcription: SpeechRecognitionTranscription) => {
      console.log(`User said: ${transcription.text}`);
      console.log(`User finished?: ${transcription.finished}`);
    },
    onError: (error: string | number) => {
      // because of the way iOS and Android differ, this is either:
      // - iOS: A 'string', describing the issue. 
      // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
      //            When listenContinuously is enabled, the recognizer will automatically restart
      //            after errors, providing hands-free continuous voice input.
    }
  }
).then(
  (started: boolean) => { console.log(`started listening`) },
  (errorMessage: string) => { console.log(`Error: ${errorMessage}`); }
).catch((error: string | number) => {
  // same as the 'onError' handler, but this may not return if the error occurs after listening has successfully started (because that resolves the promise,
  // hence the' onError' handler was created.
});
```

##### Angular tip
If you're using this plugin in Angular, then note that the `onResult` callback is not part of Angular's lifecycle.
So either update the UI in [an `ngZone` as shown here](https://github.com/EddyVerbruggen/nativescript-pluginshowcase/blob/28f65ef98716ad7c4698071b9c394cceb2d9748f/app/speech/speech.component.ts#L154),
or use [`ChangeDetectorRef` as shown here](https://blog.paulhalliday.io/2017/06/24/nativescript-speech-recognition/).

### `stopListening`

#### TypeScript
```typescript
this.speechRecognition.stopListening().then(
  () => { console.log(`stopped listening`) },
  (errorMessage: string) => { console.log(`Stop error: ${errorMessage}`); }
);
```

## Continuous Listening Mode

### Using `listenContinuously` Option

You can enable **continuous listening mode** on **Android** by setting the `listenContinuously` option to `true`:

```typescript
this.speechRecognition.startListening({
  locale: "en-US",
  returnPartialResults: true,
  listenContinuously: true,  // Enable continuous listening
  onResult: (transcription: SpeechRecognitionTranscription) => {
    console.log(`User said: ${transcription.text}`);
    // transcription.finished will be true after each utterance,
    // but listening continues automatically
  },
  onError: (error: string | number) => {
    console.log(`Error: ${error}`);
    // Recognizer will automatically restart after errors
  }
});
```

When `listenContinuously` is enabled:

- **Automatic restart**: After each speech utterance completes, listening automatically restarts
- **Continuous operation**: The recognizer keeps running until you explicitly call `stopListening()`
- **Error recovery**: Automatically restarts after errors (including speech timeout)
- **Text accumulation**: Recognized text accumulates across multiple utterances
- **Hands-free experience**: Ideal for voice assistants and applications requiring continuous voice input

To stop continuous listening, call `stopListening()`:

```typescript
this.speechRecognition.stopListening().then(() => {
  console.log('Stopped continuous listening');
});
```

**Note**: This feature is currently available on **Android only**. iOS support may be added in future versions.

## Demo app (Angular)
This plugin is part of the [plugin showcase app](https://github.com/EddyVerbruggen/nativescript-pluginshowcase/tree/master/app/speech) I built using Angular.

### Angular video tutorial
Rather watch a video? Check out [this tutorial on YouTube](https://www.youtube.com/watch?v=C5i_EYjfuTE).
