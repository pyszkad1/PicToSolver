# PicToSolver 🎴

PicToSolver is a React Native mobile application built with Expo that allows users to instantly import printed bridge hands directly into the BridgeWebs/Bridge Solver engine just by taking a picture!

## Features
- **In-App Custom Image Cropper**: Bypasses unstable native OS croppers with a consistent, premium custom crop screen featuring draggable handles, a rule-of-thirds grid, and high-visibility action buttons on a dark layout. Applied to both camera captures and gallery uploads.
- **Auto Image Optimization**: Automatically optimizes and scales high-resolution images via `expo-image-manipulator` before sending them to Gemini, keeping uploads fast and light.
- **Gemini 2.5 Flash Vision Integration**: Extracts bridge diagrams directly into standard Portable Bridge Notation (PBN) formats.
- **Secure API Key Storage**: The API key is securely stored in local device storage and is masked on the Settings screen for security.
- **Scan History**: Retains your last 5 scanned boards with hand previews so you never lose your scans if you close the app.
- **In-App Bridge Solver**: Native embedding of BBO lin-parsed URLs directly into a webview for instant analysis of makeable contracts.

## How It Works
1. **Snap a photo or upload** from your gallery.
2. **Crop the hand** using our custom in-app crop editor.
3. The app passes the image to **Google's Gemini 2.5 Flash** vision model, which strictly extracts the 4 hands into standard Portable Bridge Notation (PBN).
4. The app bypasses the BridgeWebs upload page by computing the BBO `lin=` URL parameters and natively embedding the analyzed board directly into an in-app browser.
5. You can then instantly view the makeable contracts or open the exact board in your phone’s default web browser.

## Getting Started (Development)
If you are developing or running the app locally using Expo Go:
1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Run `npm install` to install dependencies.
3. Run `npx expo start --tunnel` and scan the QR code with the Expo Go app.
4. On first launch, the app will prompt you to enter your Gemini API key (which is securely saved to your local device).

## Downloading the App (Permanent APK)
Because Expo Go development links expire as soon as you turn your computer off, the best way to share the app is via a standalone `.apk` build!

You can view the build details and download the compiled Android app directly here:
> **🔗 [Expo Build Dashboard](https://expo.dev/accounts/apyszko/projects/PicToSolver/builds/e59ad1d4-8dc4-4bcd-b8b0-47468cf195a3)** 
> **📲 [Direct APK Download](https://expo.dev/artifacts/eas/e59ad1d4-8dc4-4bcd-b8b0-47468cf195a3.apk)** 

Alternatively, scan this permanent QR code with your Android phone to install the app:

<img src="./qr_link.png" width="250" alt="Download QR Code" />

## Built With
- **React Native** & **Expo SDK 54** (Expo Doctor certified)
- **@google/generative-ai** (Gemini 2.5 Flash Vision)
- **expo-image-manipulator** (custom crop and resize pipeline)
- **@react-native-async-storage/async-storage**
- **react-native-webview**

