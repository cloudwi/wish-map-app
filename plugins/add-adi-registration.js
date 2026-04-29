const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Android Developer Verification - adi-registration.properties 파일을
 * android/app/src/main/assets/ 에 주입한다.
 *
 * 스니펫은 Play Console > Android 개발자 인증 > 패키지 > APK 서명 및 업로드
 * 다이얼로그에서 발급된 계정 고유 식별자.
 */
const ADI_SNIPPET = 'D33WX7UXXOWRYAAAAAAAAAAAAA';

module.exports = function addAdiRegistration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidRoot = config.modRequest.platformProjectRoot;
      const assetsDir = path.join(androidRoot, 'app', 'src', 'main', 'assets');
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(assetsDir, 'adi-registration.properties'),
        ADI_SNIPPET + '\n',
      );
      return config;
    },
  ]);
};
