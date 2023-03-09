FROM node:16.19.1-alpine3.16

# Install Java, Git, etc...
RUN apk add --no-cache openjdk11 git gcompat curl unzip bash

# Download Android Command Line Tools.
RUN curl -o /android-sdk.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
RUN unzip /android-sdk.zip -d /android-sdk
RUN rm -f /android-sdk.zip
RUN mkdir /latest
RUN mv /android-sdk/cmdline-tools/* /latest
RUN mv /latest /android-sdk/cmdline-tools
ENV ANDROID_SDK_ROOT /android-sdk

# Download Android SDK.
RUN yes | /android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses
RUN /android-sdk/cmdline-tools/latest/bin/sdkmanager --update
RUN /android-sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"

# Update NPM and install Expo EAS CLI.
RUN npm install -g npm@latest
RUN npm install -g expo-cli
RUN npm install -g sharp-cli

# Build app.
WORKDIR /app
COPY . .
RUN npm install
RUN expo prebuild -p android
RUN chmod +x build.sh
CMD [ "./build.sh" ]
