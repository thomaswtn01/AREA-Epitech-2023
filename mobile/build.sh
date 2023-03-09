#!/bin/bash

# Enter android directory.
cd android

# Run gradle bundle.
./gradlew :app:assembleRelease

# Copy APK to apk_folder.
cp ./app/build/outputs/apk/release/app-release.apk /apk_folder/client.apk
