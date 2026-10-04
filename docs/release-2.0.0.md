# Wish Map 2.0.0 release

Production release is not complete. Do not equate an EAS build or an App Store Connect upload with public store availability.

## Release source

- App functional source: `21f7443` on `main` (includes native My page safe area correction).
- API source: `2d939c6` on `main`, deployed at `https://api.wishmap.kr`.
- Android package: `kr.wishmap.app`.
- iOS bundle: `com.wishmap.app`; App Store ID: `6760577746`.
- Store version: `2.0.0`.
- Final Android build: `67fb4541-9523-45d7-9fa5-2e64a9fe2f41`, version code `11`.
- Final iOS build: `2c1cc482-bfa4-4a8b-a44d-b664756db3fa`, build number `109`.
- Superseded builds: Android `10`, iOS `108`. These omit the native safe area correction.

## Completed validation

- TypeScript compilation and ESLint: pass, no lint warnings.
- Expo SDK 55 compatibility check: pass; Expo `55.0.31`, React Native `0.83.10`.
- Three date logic tests: valid leap day, invalid dates/times, local date preservation.
- Twelve API tests: fresh/upgrade database schemas, reset boundaries, constraints, party capacity, membership visibility, personal lists, block relationships, venue search validation and provider failure handling.
- Browser journeys with isolated mock responses: OTP validation, redirect, agreement save failure/retry, venue search failure/retry, invalid date rejection, create, join, approval, withdrawal, report, cancellation, personal lists and 320px layout.
- Browser home checks: categories, dates, seats, query, paging, stale responses, Naver map links and error retry; mobile and desktop layouts.
- iOS Release compile: pass on Xcode 26.4.
- Native iPhone UI journey: guest home → login → guest My page; title position checked below the status bar. No real SMS or production party writes.
- iOS, Android and web production JavaScript exports: pass before the final safe area adjustment; final native iOS Release UI checks include that adjustment.
- Production database health: connected.
- Production Naver local search: successful Korean queries return up to five places. A transient search failure was observed during deploy and handled as a retryable 503.
- Critical dependency audit findings resolved. Other dependency audit findings still require review; this is not a claim of a clean security audit.

## Store preparation

App Store version ID: `08f13203-bf87-4c07-a79b-55dea5aae6fa`.

- Release type: `AFTER_APPROVAL` (automatic release after Apple approval).
- Korean and English descriptions, keywords, promotional text and release notes updated for party recruitment.
- Subtitles updated; categories: Social Networking / Lifestyle.
- Privacy policy URL: `https://api.wishmap.kr/privacy.html`.
- Native 1320×2868 JPEG screenshots stored under `store-assets/ios/2.0.0`.
- Previous build 108 was uploaded and became `VALID`; replace its association with final build 109 before review.
- Google Play production profile: `track=production`, `releaseStatus=completed`. Submission cannot proceed until a Google service account is connected.

## Required external configuration

1. **Production SMS login:** `/health/readiness` currently returns `phoneLoginConfigured=false`. Set `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` and `SOLAPI_SENDER` in Render. Sender must be a registered Korean number containing digits only, matching `0[0-9]{8,10}`. Verify provider balance/registration, then check readiness and perform an authorized real SMS login test. No keys belong in the app, Git or public environment variables.
2. **Google Play submission access:** register a Google Play service account JSON key in Expo Android credentials, with access to `kr.wishmap.app` and production releases. Re-run submission using the final build ID above. If Play rejects a first automated submission, complete the required first upload/app setup in Play Console and inspect its exact response before changing tracks.
3. **Review access:** provide a working review account/access method for the current South Korean SMS login flow. Existing review notes from social login were replaced; final credentials must be supplied and exercised before submission. Guest browsing alone does not validate creation or joining.
4. **Store privacy forms:** audit Apple App Privacy and Google Play Data Safety against current phone number, nickname/user ID, party content, participation, report/block and optional push token handling. Previous map/GPS/social-login declarations must be reconciled. These console forms have not yet been verified.
5. **Android remote push:** Expo has no FCM v1 key registered. Configure Firebase app/credentials and verify actual delivery before describing remote push as verified. In-app notifications remain a separate feature.
6. **Web:** the web bundle is ready, but `wishmap.kr` has no working website DNS/hosting connection. A public web URL is not yet configured for shared party links.

Chrome dashboard control requires the user to enable **View → Developer → Allow JavaScript from Apple Events**. The agent must not enable this browser permission itself.

The operating database was not erased. Reset SQL and fresh schema validation exist, but a live destructive reset must target the intended database explicitly.

## Resume release

After the external configuration is available, verify final build commits and processing states, upload the final Android AAB to production and final iOS IPA to App Store Connect, attach build 109 to 2.0.0, reconcile screenshots/privacy/review access, and submit to review. Confirm Play production release status and Apple review/public availability before declaring release complete.
