# Native release UI check

This check uses the production API for guest browsing only. It does not request SMS or create production data.

Run in a disposable copy of the app after a clean iOS Expo prebuild and CocoaPods installation. Copy `ReleaseUITests.swift` to `ReleaseUITests/ReleaseUITests.swift` at that copy's root and copy `add-ui-tests.rb` there. Run `ruby add-ui-tests.rb` once. The helper targets the generated `ios/app.xcodeproj` and adds a `WishMapReleaseQA` scheme.

Use Xcode's Release configuration and an available iPhone simulator:

```sh
EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=https://api.wishmap.kr \
xcodebuild -workspace ios/app.xcworkspace -scheme WishMapReleaseQA \
  -configuration Release -destination 'platform=iOS Simulator,id=<device-id>' \
  -resultBundlePath /private/tmp/wishmap-native-results.xcresult \
  CODE_SIGNING_ALLOWED=NO test

xcrun xcresulttool export attachments \
  --path /private/tmp/wishmap-native-results.xcresult \
  --output-path /private/tmp/wishmap-native-screenshots
```

The test captures native home, login and My page JPEG images. It checks that the My page title stays below the status bar. Inspect the images before using them in store listings. A successful guest UI test does not prove real SMS receipt, authenticated native journeys, Android behavior or remote push delivery.
